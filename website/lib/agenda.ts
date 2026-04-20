export type BloccoTesto        = { id: string; tipo: 'testo'; titolo?: string; contenuto: string }
export type BloccoImmagine     = { id: string; tipo: 'immagine'; url: string; alt?: string }
export type BloccoMenuVoce     = { nome: string; descrizione?: string; prezzo?: string }
export type BloccoMenu         = { id: string; tipo: 'menu'; titolo?: string; voci: BloccoMenuVoce[] }
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
  stato:           'attivo' | 'dormiente'
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
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
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
        stato:           ((f['Stato'] as string) === 'dormiente' ? 'dormiente' : 'attivo'),
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
