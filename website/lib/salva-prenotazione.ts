import { randomUUID } from 'node:crypto'
import { getStore } from '@netlify/blobs'

type Campi = Record<string, unknown> & { Data: string; Ora: string; Persone: number }
type Esito = { id: string } | { errore: 'slot_pieno' | 'disponibilita_non_verificabile' }

// La chiave è condivisa fra le istanze del sito. Un arresto del processo non blocca la fascia per sempre.
const DURATA_BLOCCO_MS = 120_000
const CAPACITA = 10

export async function salvaPrenotazione(
  campi: Campi,
  tabella: string,
  token: string,
  store = getStore({ name: 'capienza-prenotazioni', consistency: 'strong' }),
): Promise<Esito> {
  const key = `${campi.Data}/${campi.Ora}`
  const corrente = await store.getWithMetadata(key, { type: 'json' })
  if (corrente && (!corrente.etag || corrente.data.scadenza > Date.now())) {
    return { errore: 'disponibilita_non_verificabile' }
  }
  const scadenza = Date.now() + DURATA_BLOCCO_MS
  const blocco = await store.setJSON(key, { scadenza, id: randomUUID() },
    corrente ? { onlyIfMatch: corrente.etag } : { onlyIfNew: true })
  if (!blocco.modified || !blocco.etag) return { errore: 'disponibilita_non_verificabile' }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  let scritturaIncerta = false
  try {
    const url = new URL(tabella)
    url.searchParams.set('filterByFormula', `AND(DATETIME_FORMAT({Data},'YYYY-MM-DD')="${campi.Data}",{Ora}="${campi.Ora}",{Stato}!="Cancellata")`)
    url.searchParams.set('fields[]', 'Persone')
    let occupati = 0
    do {
      const res = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error(`Lettura capienza: HTTP ${res.status}`)
      const pagina = await res.json()
      for (const record of pagina.records) {
        const persone = Number(record.fields.Persone)
        if (!Number.isInteger(persone) || persone < 0) throw new Error('Numero di coperti non valido')
        occupati += persone
      }
      if (occupati + campi.Persone > CAPACITA) return { errore: 'slot_pieno' }
      if (!pagina.offset) break
      url.searchParams.set('offset', pagina.offset)
    } while (Date.now() < scadenza - 10_000)
    if (Date.now() >= scadenza - 10_000) return { errore: 'disponibilita_non_verificabile' }

    scritturaIncerta = true
    const res = await fetch(tabella, {
      method: 'POST', headers, body: JSON.stringify({ fields: campi }), signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Salvataggio prenotazione: HTTP ${res.status}`)
    const { id } = await res.json()
    if (!id) throw new Error('ID prenotazione mancante')
    scritturaIncerta = false
    return { id }
  } finally {
    // In caso di timeout Airtable può aver ricevuto la scrittura. Lascia scadere il blocco.
    if (!scritturaIncerta) {
      await store.setJSON(key, { scadenza: 0 }, { onlyIfMatch: blocco.etag })
        .catch(() => console.error('Rilascio blocco capienza rimandato alla scadenza'))
    }
  }
}
