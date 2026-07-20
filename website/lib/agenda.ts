import { REVALIDATE_AGENDA_S } from '@/lib/revalidate'

export type BloccoTesto        = { id: string; tipo: 'testo'; titolo?: string; contenuto: string }
export type BloccoImmagine     = { id: string; tipo: 'immagine'; url: string; alt?: string }
export type BloccoMenuVocePiatto = { tipo?: 'piatto' | undefined; nome: string; descrizione?: string; prezzo?: string }
export type BloccoMenuVoceSep    = { tipo: 'separatore'; testo?: string }
export type BloccoMenuVoce       = BloccoMenuVocePiatto | BloccoMenuVoceSep
export type BloccoMenuSezione    = { titolo?: string; voci: BloccoMenuVoce[] }
export type BloccoMenu         = { id: string; tipo: 'menu'; titolo?: string; voci?: BloccoMenuVoce[]; sezioni?: BloccoMenuSezione[] }
export type BloccoPrenotazione = { id: string; tipo: 'prenotazione'; titolo?: string; maxPosti?: number; slotMinuti?: number }
export type BloccoArtista      = { id: string; tipo: 'artista'; nome: string; bio?: string; foto?: string }
export type BloccoCardOfferte  = { id: string; tipo: 'card-offerte'; titolo?: string; voci: string[] }
export type BloccoPrezzo       = { id: string; tipo: 'prezzo'; titolo?: string; importo?: string; voci: string[] }
export type Blocco = BloccoTesto | BloccoImmagine | BloccoMenu | BloccoPrenotazione | BloccoArtista | BloccoCardOfferte | BloccoPrezzo

export interface EventoAgenda {
  data:            string | null
  dataFine:        string | null
  giornoSettimana: string
  titolo:          string
  descrizione:     string
  descrizioneBreve: string
  orario:          string
  orarioFine:      string
  ricorrente:      boolean
  ricorrenza:      string
  giorniEsclusione: string
  evidenza:        boolean
  slug:            string
  fotoHero:        string
  tagFotoIntro:    string
  titoloIntro:     string
  testoIntro:      string
  blocchi:         Blocco[]
  stato:           'attivo' | 'futuro' | 'passato' | 'bozza'
  mostraInNews:    boolean
  bloccaGiorno:    boolean
  metaTitle:       string
  metaDescription: string
}

export async function fetchEventi(): Promise<EventoAgenda[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_AGENDA || 'Agenda'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Data&sort[0][direction]=asc&maxRecords=200`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_AGENDA_S } }
    )
    if (!res.ok) return []

    const json = await res.json()
    return (json.records ?? [])
    .filter((r: { fields: Record<string, unknown> }) => (r.fields['Stato'] as string) !== 'bozza')
    .map((r: { fields: Record<string, unknown> }) => {
      const f = r.fields
      const ricorrente = !!f['Ricorrenza'] && f['Ricorrenza'] !== 'nessuna'
      return {
        data:            (f['Data'] as string) ?? null,
        dataFine:        (f['DataFineRicorrenza'] as string) ?? null,
        giornoSettimana: (f['GiorniSettimana'] as string) ?? '',
        titolo:          (f['Titolo'] as string) ?? '',
        descrizione:     (f['Note'] as string) ?? '',
        descrizioneBreve: (f['DescrizioneBreve'] as string) ?? '',
        orario:          (f['Ora'] as string) ?? '',
        orarioFine:      (f['OraFine'] as string) ?? '',
        ricorrente,
        ricorrenza:       (f['Ricorrenza'] as string) ?? 'nessuna',
        giorniEsclusione: (f['GiorniEsclusione'] as string) ?? '',
        evidenza:        f['Tipo'] !== 'Appuntamento',
        slug:            (f['Slug'] as string) ?? '',
        fotoHero:        (f['FotoHero'] as string) ?? '',
        tagFotoIntro:    (f['TagFotoIntro'] as string) ?? '',
        titoloIntro:     (f['TitoloIntro'] as string) ?? '',
        testoIntro:      (f['TestoIntro'] as string) ?? '',
        blocchi:         (() => { try { return JSON.parse((f['Blocchi'] as string) || '[]') } catch { return [] } })(),
        stato:           (() => {
          const s = f['Stato'] as string
          if (s === 'bozza')   return 'bozza'
          if (s === 'futuro')  return 'futuro'
          if (s === 'passato') return 'passato'
          if (s === 'dormiente') return 'passato'            // backward compat
          if (s === 'attivo' && f['DataTBD']) return 'futuro' // backward compat
          return 'attivo'
        })() as 'attivo' | 'futuro' | 'passato' | 'bozza',
        mostraInNews:    !!(f['MostraInNews'] as boolean),
        bloccaGiorno:    !!(f['BloccaGiorno'] as boolean),
        metaTitle:       (f['MetaTitle'] as string) ?? '',
        metaDescription: (f['MetaDescription'] as string) ?? '',
      }
    })
  } catch {
    return []
  }
}

export async function fetchEventoBySlug(slug: string): Promise<EventoAgenda | null> {
  const eventi = await fetchEventi()
  return eventi.find(e => e.slug === slug) ?? null
}

const ORDINE_SETT   = [1, 2, 3, 4, 5, 6, 0]
const GIORNI_LABEL  = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_BREVI  = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const GIORNI_ESTESI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

function fmtGiorniRange(str: string): string {
  const nums = str.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (!nums.length) return ''
  const sorted = ORDINE_SETT.filter(g => nums.includes(g))
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETT.indexOf(sorted[j + 1]) === ORDINE_SETT.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL[chunk[0]] : `${GIORNI_LABEL[chunk[0]]}–${GIORNI_LABEL[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

export function formatBadgeRicorrente(
  evento: { ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; orario: string; orarioFine: string },
  giorniChiusi: number[] = []
): string {
  let giorni = ''

  if (evento.ricorrenza === 'giornaliera') {
    const esclusiEvento = evento.giorniEsclusione ? evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n)) : []
    const tuttiEsclusi  = [...new Set([...esclusiEvento, ...giorniChiusi])]
    const attivi        = ORDINE_SETT.filter(d => !tuttiEsclusi.includes(d))
    if (attivi.length === 0) return ''
    if (attivi.length === 7) {
      giorni = 'Tutti i giorni'
    } else {
      const firstIdx       = ORDINE_SETT.indexOf(attivi[0])
      const lastIdx        = ORDINE_SETT.indexOf(attivi[attivi.length - 1])
      const inRange        = ORDINE_SETT.slice(firstIdx, lastIdx + 1)
      const esclusiInRange = inRange.filter(d => !attivi.includes(d))
      const rangeLabel     = `${GIORNI_LABEL[attivi[0]]}–${GIORNI_LABEL[attivi[attivi.length - 1]]}`
      giorni = esclusiInRange.length === 0 ? rangeLabel : `${rangeLabel} (escluso ${esclusiInRange.map(n => GIORNI_BREVI[n]).join(', ')})`
    }
  } else if (evento.ricorrenza === 'settimanale' && evento.giornoSettimana) {
    const nums = evento.giornoSettimana.split(',').map(Number).filter(n => !isNaN(n))
    const label = nums.length === 1 && GIORNI_ESTESI[nums[0]]
      ? `Ogni ${GIORNI_ESTESI[nums[0]]}`
      : `Ogni ${fmtGiorniRange(evento.giornoSettimana)}`
    giorni = label
    if (evento.giorniEsclusione) {
      const esclusi = evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI[n])
      if (esclusi.length) giorni += ` (escluso ${esclusi.map(n => GIORNI_BREVI[n]).join(', ')})`
    }
  }

  const orario = evento.orario ? ` · ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}` : ''
  return giorni ? `${giorni}${orario}` : ''
}
