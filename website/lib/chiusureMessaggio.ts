/**
 * Testi banner/popup per chiusure e aperture straordinarie.
 * Per le aperture, considera anche le fasce ordinarie del giorno:
 * se il giorno è già aperto in altre fasce → "anche a …" invece di "solo …".
 */

export type OrarioLite = {
  giorno: number | null
  fascia: string
  attivo: boolean
}

/** Mappa giorno settimana (0=Dom…6=Sab) → fasce ordinarie attive. */
export function buildFasceOrdinarieMap(orari: OrarioLite[]): Record<number, string[]> {
  const map: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  for (const o of orari) {
    if (!o.attivo || o.giorno === null || !o.fascia) continue
    const list = map[o.giorno]
    if (!list.includes(o.fascia)) list.push(o.fascia)
  }
  return map
}

function formatAnche(fasce: string[]): string {
  if (fasce.length === 1) return ` anche a ${fasce[0]}`
  if (fasce.length === 2) return ` anche a ${fasce[0]} e a ${fasce[1]}`
  return ` anche a ${fasce.slice(0, -1).join(', a ')} e a ${fasce[fasce.length - 1]}`
}

/** True se in almeno un giorno del range esistono fasce ordinarie fuori da quelle straordinarie. */
function hasOtherOrdinaryFasce(
  dataInizio: string,
  dataFine: string,
  fasceExtra: string[],
  fasceOrdinarie: Record<number, string[]>,
): boolean {
  const start = new Date(dataInizio + 'T12:00:00')
  const end = new Date((dataFine || dataInizio) + 'T12:00:00')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ordinary = fasceOrdinarie[d.getDay()] || []
    if (ordinary.some(f => !fasceExtra.includes(f))) return true
  }
  return false
}

/**
 * Suffisso fasce da appendere a "siamo aperti/chiusi".
 * - Chiusura con fasce → " (solo Pranzo)"
 * - Apertura su giorno già aperto in altre fasce → " anche a Pranzo"
 * - Apertura su giorno altrimenti chiuso (o solo quelle fasce) → " (solo Pranzo)"
 * - Nessuna fascia → ""
 */
export function buildFascePart(
  tipoApertura: string,
  fasce: string[],
  dataInizio: string,
  dataFine: string,
  fasceOrdinarie: Record<number, string[]>,
): string {
  if (!fasce.length) return ''

  const list = fasce.join(' e ')
  const isApertura = tipoApertura === 'Apertura straordinaria'

  if (!isApertura) return ` (solo ${list})`

  if (hasOtherOrdinaryFasce(dataInizio, dataFine || dataInizio, fasce, fasceOrdinarie)) {
    return formatAnche(fasce)
  }
  return ` (solo ${list})`
}
