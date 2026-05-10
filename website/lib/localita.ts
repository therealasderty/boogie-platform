export type LocalitaItem = {
  id:              string
  citta:           string
  slug:            string
  serviziAttivi:   string[]   // slug degli eventi Agenda
  introText:       string     // HTML da Tiptap
  metaTitle:       string
  metaDescription: string
  attiva:          boolean
  ordine:          number
  tempoGuida:      string     // es. "15" (minuti in auto) — opzionale
}

export async function fetchLocalita(): Promise<LocalitaItem[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_LOCALITA || 'Localita'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Ordine&sort[0][direction]=asc&maxRecords=200`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []

    const json = await res.json()
    return (json.records ?? [])
      .map((r: { id: string; fields: Record<string, unknown> }) => ({
        id:              r.id,
        citta:           (r.fields['Citta'] as string) ?? '',
        slug:            (r.fields['Slug'] as string) ?? '',
        serviziAttivi:   ((r.fields['ServiziAttivi'] as string) ?? '').split(',').map(s => s.trim()).filter(Boolean),
        introText:       (r.fields['IntroText'] as string) ?? '',
        metaTitle:       (r.fields['MetaTitle'] as string) ?? '',
        metaDescription: (r.fields['MetaDescription'] as string) ?? '',
        attiva:          r.fields['Attiva'] !== false,
        ordine:          (r.fields['Ordine'] as number) ?? 0,
        tempoGuida:      (r.fields['TempoGuida'] as string) ?? '',
      }))
      .filter((l: LocalitaItem) => l.attiva && l.slug && l.citta)
  } catch {
    return []
  }
}

export async function fetchLocalitaBySlug(slug: string): Promise<LocalitaItem | null> {
  const lista = await fetchLocalita()
  return lista.find(l => l.slug === slug) ?? null
}

export async function fetchIntroServizio(cittaSlug: string, eventoSlug: string): Promise<string> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = 'LocalitaServizi'

  if (!token || !base) return ''

  try {
    const formula = encodeURIComponent(`AND({CittaSlug}="${cittaSlug}", {EventoSlug}="${eventoSlug}", {Attiva}=1)`)
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?filterByFormula=${formula}&fields[]=IntroText&maxRecords=1`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return ''
    const json = await res.json()
    return (json.records?.[0]?.fields?.IntroText as string) ?? ''
  } catch {
    return ''
  }
}
