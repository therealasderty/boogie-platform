import { REVALIDATE_EVENTI_S } from '@/lib/revalidate'

export type BloccoTesto        = { id: string; tipo: 'testo'; titolo?: string; contenuto: string }
export type BloccoImmagine     = { id: string; tipo: 'immagine'; url: string; alt?: string }
export type BloccoMenuVocePiatto = { tipo?: 'piatto' | undefined; nome: string; descrizione?: string; prezzo?: string }
export type BloccoMenuVoceSep    = { tipo: 'separatore'; testo?: string }
export type BloccoMenuVoce       = BloccoMenuVocePiatto | BloccoMenuVoceSep
export type BloccoMenuSezione    = { titolo?: string; voci: BloccoMenuVoce[] }
export type BloccoMenu         = { id: string; tipo: 'menu'; titolo?: string; importo?: string; notePrezzo?: string[]; voci?: BloccoMenuVoce[]; sezioni?: BloccoMenuSezione[] }
export type BloccoPrenotazione = { id: string; tipo: 'prenotazione'; titolo?: string; maxPosti?: number; slotMinuti?: number }
export type BloccoArtista      = { id: string; tipo: 'artista'; nome: string; bio?: string; foto?: string }
export type BloccoCardOfferte  = { id: string; tipo: 'card-offerte'; titolo?: string; voci: string[] }
export type BloccoPrezzo       = { id: string; tipo: 'prezzo'; titolo?: string; importo?: string; voci: string[] }
export type Blocco = BloccoTesto | BloccoImmagine | BloccoMenu | BloccoPrenotazione | BloccoArtista | BloccoCardOfferte | BloccoPrezzo

export interface EventoAgenda {
  id:              string
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
  inPrimoPiano:    boolean
  mostraInNews:    boolean
  bloccaGiorno:    boolean
  metaTitle:       string
  metaDescription: string
}

function parseBlocchi(raw: unknown): Blocco[] {
  if (Array.isArray(raw)) return raw as Blocco[]
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapStato(f: Record<string, unknown>): EventoAgenda['stato'] {
  const s = f['Stato'] as string
  if (s === 'bozza') return 'bozza'
  if (s === 'futuro') return 'futuro'
  if (s === 'passato') return 'passato'
  if (s === 'dormiente') return 'passato'
  if (s === 'attivo' && f['DataTBD']) return 'futuro'
  return 'attivo'
}

function mapRecord(r: { id: string; fields?: Record<string, unknown> }): EventoAgenda | null {
  const f = r.fields
  if (!f) return null
  if ((f['Stato'] as string) === 'bozza') return null
  const ricorrente = !!f['Ricorrenza'] && f['Ricorrenza'] !== 'nessuna'
  return {
    id:               r.id,
    data:             (f['Data'] as string) ?? null,
    dataFine:         (f['DataFineRicorrenza'] as string) ?? null,
    giornoSettimana:  (f['GiorniSettimana'] as string) ?? '',
    titolo:           (f['Titolo'] as string) ?? '',
    descrizione:      (f['Note'] as string) ?? '',
    descrizioneBreve: (f['DescrizioneBreve'] as string) ?? '',
    orario:           (f['Ora'] as string) ?? '',
    orarioFine:       (f['OraFine'] as string) ?? '',
    ricorrente,
    ricorrenza:       (f['Ricorrenza'] as string) ?? 'nessuna',
    giorniEsclusione: (f['GiorniEsclusione'] as string) ?? '',
    evidenza:         f['Tipo'] !== 'Appuntamento',
    slug:             (f['Slug'] as string) ?? '',
    fotoHero:         (f['FotoHero'] as string) ?? '',
    tagFotoIntro:     (f['TagFotoIntro'] as string) ?? '',
    titoloIntro:      (f['TitoloIntro'] as string) ?? '',
    testoIntro:       (f['TestoIntro'] as string) ?? '',
    blocchi:          parseBlocchi(f['Blocchi']),
    stato:            mapStato(f),
    mostraInNews:     !!(f['MostraInNews'] as boolean),
    inPrimoPiano:     !!(f['InPrimoPiano'] as boolean),
    bloccaGiorno:     !!(f['BloccaGiorno'] as boolean),
    metaTitle:        (f['MetaTitle'] as string) ?? '',
    metaDescription:  (f['MetaDescription'] as string) ?? '',
  }
}

export async function fetchEventi(): Promise<EventoAgenda[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_AGENDA || 'Agenda'

  if (!token || !base) {
    console.error('[agenda] AIRTABLE_TOKEN o AIRTABLE_BASE_ID mancanti')
    return []
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Data&sort[0][direction]=asc&maxRecords=200`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_EVENTI_S, tags: ['agenda'] } }
    )
    if (!res.ok) {
      console.error('[agenda] Airtable', res.status, await res.text().catch(() => ''))
      return []
    }

    const json = await res.json()
    const mapped: EventoAgenda[] = []
    for (const r of json.records ?? []) {
      try {
        const evento = mapRecord(r)
        if (evento) mapped.push(evento)
      } catch (err) {
        console.error('[agenda] record saltato', r?.id, err)
      }
    }
    return mapped
  } catch (err) {
    console.error('[agenda] fetchEventi', err)
    return []
  }
}

export async function fetchEventoBySlug(slug: string): Promise<EventoAgenda | null> {
  const eventi = await fetchEventi()
  return eventi.find(e => e.slug === slug) ?? null
}

/** Voce navbar: tutti gli appuntamenti attivi/futuri con pagina pubblica. In evidenza per primo. */
export function selezionaEventiNavbar(eventi: EventoAgenda[], oggi: string): EventoAgenda[] {
  const visibili = eventi.filter(e => {
    if (!e.slug) return false
    if (e.stato === 'bozza' || e.stato === 'passato') return false
    if (e.stato === 'futuro') return true
    if (e.ricorrente) return true
    return !!e.data && e.data >= oggi
  })

  visibili.sort((a, b) => {
    if (a.inPrimoPiano !== b.inPrimoPiano) return a.inPrimoPiano ? -1 : 1
    if (a.mostraInNews !== b.mostraInNews) return a.mostraInNews ? -1 : 1
    const aRic = a.ricorrente ? 1 : 0
    const bRic = b.ricorrente ? 1 : 0
    if (aRic !== bRic) return aRic - bRic
    return (b.data || '').localeCompare(a.data || '')
  })

  return visibili.map(e => ({ ...e, blocchi: [], testoIntro: '' }))
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
