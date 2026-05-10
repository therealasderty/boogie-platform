export interface RecensioneItem {
  id:          string
  nome:        string
  piattaforma: 'Google' | 'TripAdvisor'
  stelle:      number
  testo:       string
  data:        string
}

export async function fetchRecensioni(): Promise<RecensioneItem[]> {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  if (!token || !base) return []
  try {
    const filter = encodeURIComponent(`{Attivo}=TRUE()`)
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/RecensioniSito?filterByFormula=${filter}&sort[0][field]=Ordine&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.records || []).map((r: { id: string; fields: Record<string, unknown> }) => ({
      id:          r.id,
      nome:        String(r.fields['Nome'] || ''),
      piattaforma: (r.fields['Piattaforma'] as 'Google' | 'TripAdvisor') || 'Google',
      stelle:      Number(r.fields['Stelle'] ?? 5),
      testo:       String(r.fields['Testo'] || ''),
      data:        String(r.fields['Data'] || ''),
    }))
  } catch {
    return []
  }
}
