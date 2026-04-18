export type MediaItem = {
  id:         string
  nome:       string
  url:        string
  alt:        string
  tag:        string[]
  ordine:     number
  soloMobile: boolean
}

export async function fetchMedia(tag?: string): Promise<MediaItem[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID

  if (!token || !base) return []

  try {
    const formula = tag
      ? `&filterByFormula=${encodeURIComponent(`FIND("${tag}", {Tag})`)}`
      : ''

    const res = await fetch(
      `https://api.airtable.com/v0/${base}/Media?fields[]=Nome&fields[]=URL&fields[]=Alt%20text&fields[]=Tag&fields[]=Ordine&fields[]=Solo%20Mobile&sort[0][field]=Ordine&sort[0][direction]=asc${formula}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const json = await res.json()

    return (json.records || []).map((r: { id: string; fields: Record<string, unknown> }) => ({
      id:   r.id,
      nome: r.fields['Nome'] as string || '',
      url:  r.fields['URL']  as string || '',
      alt:  r.fields['Alt text'] as string || '',
      tag:        r.fields['Tag'] ? (r.fields['Tag'] as string).split(',').map(t => t.trim()).filter(Boolean) : [],
      ordine:     (r.fields['Ordine'] as number) ?? 0,
      soloMobile: r.fields['Solo Mobile'] === true,
    })).filter((m: MediaItem) => m.url)
  } catch {
    return []
  }
}

export async function fetchMediaById(id: string): Promise<MediaItem | null> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  if (!token || !base) return null

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/Media/${id}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const r = await res.json()
    return {
      id:         r.id,
      nome:       r.fields['Nome'] || '',
      url:        r.fields['URL']  || '',
      alt:        r.fields['Alt text'] || '',
      tag:        r.fields['Tag'] || [],
      ordine:     r.fields['Ordine'] || 0,
      soloMobile: r.fields['Solo mobile'] || false,
    }
  } catch {
    return null
  }
}
