import { REVALIDATE_AGENDA_S } from '@/lib/revalidate'

export interface ChiusuraRecord {
  tipoApertura: string   // 'Chiusura' | 'Apertura straordinaria'
  tipo: string           // 'Data specifica' | 'Giorno della settimana'
  giorno: number | null
  dataInizio: string
  dataFine: string
  descrizione: string
  fasce: string[]
}

export interface OrarioRecord {
  giorno: number | null
  fascia: string
  oraInizio: string
  oraFine: string
  attivo: boolean
}

const GIORNI_SHORT: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Gio', 5: 'Ven', 6: 'Sab', 0: 'Dom',
}
// Ordine settimana: Lun → Dom
const ORDINE = [1, 2, 3, 4, 5, 6, 0]

function formatGiorni(giorni: Set<number>): string {
  const sorted = ORDINE.filter((g) => giorni.has(g))
  if (sorted.length === 0) return ''

  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (
      j + 1 < sorted.length &&
      ORDINE.indexOf(sorted[j + 1]) === ORDINE.indexOf(sorted[j]) + 1
    ) j++
    const chunk = sorted.slice(i, j + 1)
    if (chunk.length === 1) ranges.push(GIORNI_SHORT[chunk[0]])
    else ranges.push(`${GIORNI_SHORT[chunk[0]]}–${GIORNI_SHORT[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

export function getDayStatus(
  date: Date,
  orari: OrarioRecord[],
  chiusure: ChiusuraRecord[]
): 'aperto' | 'chiuso' | 'chiusura-straordinaria' | 'apertura-straordinaria' {
  const dateStr = date.toISOString().split('T')[0]
  const dayOfWeek = date.getDay()

  const matches = chiusure.filter(c => {
    if (c.tipo === 'Giorno della settimana' && c.giorno === dayOfWeek) return true
    if (c.tipo === 'Data specifica' && c.dataInizio) {
      const fine = c.dataFine || c.dataInizio
      return dateStr >= c.dataInizio && dateStr <= fine
    }
    return false
  })

  // Apertura straordinaria ha sempre priorità su chiusura straordinaria
  if (matches.some(c => c.tipoApertura !== 'Chiusura')) return 'apertura-straordinaria'
  if (matches.some(c => c.tipoApertura === 'Chiusura')) return 'chiusura-straordinaria'

  const hasHours = orari.some((o) => o.attivo && o.giorno === dayOfWeek)
  return hasHours ? 'aperto' : 'chiuso'
}

function checkChiusura(chiusure: ChiusuraRecord[], date: Date): 'chiuso' | 'straordinaria' | null {
  const dateStr = date.toISOString().split('T')[0]
  const dayOfWeek = date.getDay()
  for (const c of chiusure) {
    if (c.tipo === 'Giorno della settimana' && c.giorno === dayOfWeek) {
      return c.tipoApertura === 'Chiusura' ? 'chiuso' : 'straordinaria'
    }
    if (c.tipo === 'Data specifica' && c.dataInizio) {
      const fine = c.dataFine || c.dataInizio
      if (dateStr >= c.dataInizio && dateStr <= fine) {
        return c.tipoApertura === 'Chiusura' ? 'chiuso' : 'straordinaria'
      }
    }
  }
  return null
}

export function buildOrariDisplay(orari: OrarioRecord[], chiusure: ChiusuraRecord[] = []): string {
  const attivi = orari.filter(
    (o) => o.attivo && o.giorno !== null && o.oraInizio && o.oraFine
  )
  if (attivi.length === 0) return ''

  // Slot con i loro giorni associati
  const slotMap = new Map<string, { inizio: string; fine: string; giorni: Set<number> }>()
  for (const o of attivi) {
    const key = `${o.oraInizio}|${o.oraFine}`
    if (!slotMap.has(key)) slotMap.set(key, { inizio: o.oraInizio, fine: o.oraFine, giorni: new Set() })
    slotMap.get(key)!.giorni.add(o.giorno as number)
  }

  // Ordina per ora inizio, mergia slot sovrapposti (unendo anche i giorni)
  const sorted = [...slotMap.values()].sort((a, b) => a.inizio.localeCompare(b.inizio))
  const merged: { inizio: string; fine: string; giorni: Set<number> }[] = []
  for (const slot of sorted) {
    const last = merged[merged.length - 1]
    if (last && slot.inizio <= last.fine) {
      if (slot.fine > last.fine) last.fine = slot.fine
      for (const g of slot.giorni) last.giorni.add(g)
    } else {
      merged.push({ inizio: slot.inizio, fine: slot.fine, giorni: new Set(slot.giorni) })
    }
  }

  // Se tutti gli slot hanno gli stessi giorni → formato compatto
  // Altrimenti → ogni slot mostra i suoi giorni
  const stessiGiorni = merged.length > 1 && merged.every(
    (s) => [...s.giorni].sort().join() === [...merged[0].giorni].sort().join()
  )

  let result: string
  if (stessiGiorni) {
    const giorniStr = formatGiorni(merged[0].giorni)
    result = `${giorniStr} ${merged.map((s) => `${s.inizio}–${s.fine}`).join(' · ')}`
  } else {
    result = merged.map((s) => `${formatGiorni(s.giorni)} ${s.inizio}–${s.fine}`).join(' · ')
  }

  // Giorni chiusi
  const tuttiGiorni = new Set(attivi.map((o) => o.giorno as number))
  const chiusi = new Set(ORDINE.filter((g) => !tuttiGiorni.has(g)))
  const chiusiStr = chiusi.size > 0 && chiusi.size <= 2
    ? ` · ${formatGiorni(chiusi)} chiuso`
    : ''

  // Avvisi chiusure/aperture straordinarie per oggi e domani
  const oggi = new Date()
  const domani = new Date(oggi)
  domani.setDate(domani.getDate() + 1)

  const statoOggi = checkChiusura(chiusure, oggi)
  const statoDomani = checkChiusura(chiusure, domani)

  const avvisi: string[] = []
  if (statoOggi === 'chiuso') avvisi.push('Oggi chiuso')
  else if (statoOggi === 'straordinaria') avvisi.push('Apertura straordinaria oggi')
  if (statoDomani === 'chiuso') avvisi.push('Domani chiuso')
  else if (statoDomani === 'straordinaria') avvisi.push('Apertura straordinaria domani')

  const avvisiStr = avvisi.length > 0 ? ` · ${avvisi.join(' · ')}` : ''

  return result + chiusiStr + avvisiStr
}

export interface OrariDisplay {
  righe: string[]
  avvisoSettimana: boolean
  giorniChiusi: number[]
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

export function buildOrariLines(orari: OrarioRecord[], chiusure: ChiusuraRecord[] = []): OrariDisplay {
  const attivi = orari.filter(o => o.attivo && o.giorno !== null && o.oraInizio && o.oraFine)

  // Build per-day slot lists, merging overlapping ranges
  const perDayRaw = new Map<number, { inizio: string; fine: string }[]>()
  for (const g of ORDINE) perDayRaw.set(g, [])
  for (const o of attivi) {
    perDayRaw.get(o.giorno as number)!.push({ inizio: o.oraInizio, fine: o.oraFine })
  }

  const perDay = new Map<number, string[]>()
  for (const g of ORDINE) {
    const sorted = [...perDayRaw.get(g)!].sort((a, b) => a.inizio.localeCompare(b.inizio))
    const merged: { inizio: string; fine: string }[] = []
    for (const slot of sorted) {
      const last = merged[merged.length - 1]
      if (last && slot.inizio <= last.fine) {
        if (slot.fine > last.fine) last.fine = slot.fine
      } else {
        merged.push({ ...slot })
      }
    }
    perDay.set(g, merged.map(s => `${s.inizio}–${s.fine}`))
  }

  // Group days by identical slot pattern
  const groups = new Map<string, number[]>()
  for (const g of ORDINE) {
    const key = perDay.get(g)!.join('|')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(g)
  }

  const righe: string[] = []

  // Closed days first
  const chiusiGiorni = groups.get('') ?? []
  if (chiusiGiorni.length > 0) righe.push(`${formatGiorni(new Set(chiusiGiorni))}: Chiuso`)

  // Open groups, ordered by first occurrence in week
  const openGroups = [...groups.entries()]
    .filter(([key]) => key !== '')
    .sort(([, a], [, b]) => ORDINE.indexOf(a[0]) - ORDINE.indexOf(b[0]))

  for (const [key, giorni] of openGroups) {
    righe.push(`${formatGiorni(new Set(giorni))}: ${key.split('|').join(' · ')}`)
  }

  // Check for extraordinary events this week
  const oggi = new Date()
  const monday = getMondayOfWeek(oggi)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const mondayStr = monday.toISOString().split('T')[0]
  const sundayStr = sunday.toISOString().split('T')[0]

  const avvisoSettimana = chiusure.some(c =>
    c.tipo === 'Data specifica' &&
    c.dataInizio &&
    c.dataInizio <= sundayStr &&
    (c.dataFine || c.dataInizio) >= mondayStr
  )

  const tuttiGiorni = new Set(attivi.map(o => o.giorno as number))
  const giorniChiusi = ORDINE.filter(g => !tuttiGiorni.has(g))

  return { righe, avvisoSettimana, giorniChiusi }
}

export async function fetchChiusure(): Promise<ChiusuraRecord[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_CHIUSURE || 'Chiusure'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_AGENDA_S, tags: ['chiusure'] } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.records ?? []).map((r: { fields: Record<string, unknown> }) => ({
      tipoApertura: String(r.fields['Tipo apertura'] ?? 'Chiusura'),
      tipo:         String(r.fields['Tipo'] ?? ''),
      giorno:       r.fields['Giorno'] != null ? Number(r.fields['Giorno']) : null,
      dataInizio:   String(r.fields['Data inizio'] ?? ''),
      dataFine:     String(r.fields['Data fine'] ?? ''),
      descrizione:  String(r.fields['Descrizione'] ?? ''),
      fasce:        Array.isArray(r.fields['Fascia']) ? r.fields['Fascia'] as string[] : [],
    }))
  } catch {
    return []
  }
}

export async function fetchGiorniAperti(): Promise<Set<number>> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_ORARI || 'Orari'
  if (!token || !base) return new Set()
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?fields[]=Giorni&fields[]=Attivo`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_AGENDA_S } }
    )
    if (!res.ok) return new Set()
    const json = await res.json()
    const giorni = new Set<number>()
    for (const r of (json.records ?? [])) {
      if (!r.fields['Attivo']) continue
      const g = r.fields['Giorni']
      if (Array.isArray(g)) g.forEach((d: string) => giorni.add(parseInt(d)))
    }
    return giorni
  } catch {
    return new Set()
  }
}

export async function fetchOrari(): Promise<OrarioRecord[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_ORARI || 'Orari'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: REVALIDATE_AGENDA_S },
      }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.records ?? []).map((r: Record<string, { fields: Record<string, unknown> }>) => {
      const f = (r as unknown as { fields: Record<string, unknown> }).fields
      const giorni = f['Giorni']
      const giorno = Array.isArray(giorni) && giorni.length > 0
        ? parseInt(String(giorni[0]))
        : null
      return {
        giorno,
        fascia:     String(f['Fascia'] ?? ''),
        oraInizio:  String(f['Ora inizio'] ?? ''),
        oraFine:    String(f['Ora fine'] ?? ''),
        attivo:     Boolean(f['Attivo']),
      }
    })
  } catch {
    return []
  }
}
