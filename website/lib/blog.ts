import { REVALIDATE_BLOG_S } from '@/lib/revalidate'

export type ArticoloBlog = {
  id:               string
  titolo:           string
  slug:             string
  autore:           string
  dataPubblicazione: string
  categoria:        string
  descrizioneBreve: string
  fotoHero:         string
  contenuto:        string
  metaTitle:        string
  metaDescription:  string
  pubblicato:       boolean
  ordine:           number
}

export async function fetchArticoli(): Promise<ArticoloBlog[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_BLOG || 'Blog'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Ordine&sort[0][direction]=asc&maxRecords=200`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_BLOG_S } }
    )
    if (!res.ok) return []

    const json = await res.json()
    return (json.records ?? [])
      .map((r: { id: string; fields: Record<string, unknown> }) => ({
        id:               r.id,
        titolo:           (r.fields['Titolo'] as string) ?? '',
        slug:             (r.fields['Slug'] as string) ?? '',
        autore:           (r.fields['Autore'] as string) ?? '',
        dataPubblicazione: (r.fields['DataPubblicazione'] as string) ?? '',
        categoria:        (r.fields['Categoria'] as string) ?? '',
        descrizioneBreve: (r.fields['DescrizioneBreve'] as string) ?? '',
        fotoHero:         (r.fields['FotoHero'] as string) ?? '',
        contenuto:        (r.fields['Contenuto'] as string) ?? '',
        metaTitle:        (r.fields['MetaTitle'] as string) ?? '',
        metaDescription:  (r.fields['MetaDescription'] as string) ?? '',
        pubblicato:       r.fields['Pubblicato'] !== false,
        ordine:           (r.fields['Ordine'] as number) ?? 0,
      }))
      .filter((a: ArticoloBlog) => a.pubblicato && a.slug)
  } catch {
    return []
  }
}

export async function fetchArticoloBySlug(slug: string): Promise<ArticoloBlog | null> {
  const articoli = await fetchArticoli()
  return articoli.find(a => a.slug === slug) ?? null
}
