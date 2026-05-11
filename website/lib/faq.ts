import { REVALIDATE_3_GIORNI_S } from '@/lib/revalidate'

export type FaqItem = {
  id: string
  domanda: string
  risposta: string
  ordine: number
  attivo: boolean
}

export async function fetchFaq(): Promise<FaqItem[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_FAQ || 'FAQ'

  if (!token || !base) return []

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Ordine&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: REVALIDATE_3_GIORNI_S } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.records || [])
      .filter((r: { fields: Record<string, unknown> }) => r.fields['Attivo'] !== false)
      .map((r: { id: string; fields: Record<string, unknown> }) => ({
        id:       r.id,
        domanda:  (r.fields['Domanda'] as string) || '',
        risposta: (r.fields['Risposta'] as string) || '',
        ordine:   (r.fields['Ordine'] as number) ?? 0,
        attivo:   r.fields['Attivo'] !== false,
      }))
  } catch {
    return []
  }
}
