import { NextResponse } from 'next/server'

export const revalidate = 300

const NOMI_GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

function toGiorniNome(ricorrenza: string, giorniStr: string, esclusionStr: string): string {
  if (ricorrenza === 'giornaliera') {
    const esclusi = esclusionStr ? esclusionStr.split(',').map(Number).filter(n => !isNaN(n)) : []
    return [0,1,2,3,4,5,6].filter(d => !esclusi.includes(d)).map(d => NOMI_GIORNI[d]).join(',')
  }
  if (ricorrenza === 'settimanale') {
    return (giorniStr || '').split(',').map(n => NOMI_GIORNI[parseInt(n.trim())]).filter(Boolean).join(',')
  }
  return ''
}

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID
  const table = process.env.AIRTABLE_AGENDA || 'Agenda'

  if (!token || !base) return NextResponse.json({ success: false }, { status: 500 })

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?sort[0][field]=Data&sort[0][direction]=asc&maxRecords=200`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } }
    )
    if (!res.ok) return NextResponse.json({ success: false }, { status: 500 })

    const json = await res.json()
    const events = (json.records ?? [])
      .filter((r: { fields: Record<string, unknown> }) => r.fields['Stato'] !== 'dormiente')
      .map((r: { fields: Record<string, unknown> }) => {
        const f = r.fields
        const ricorrenza = (f['Ricorrenza'] as string) || 'nessuna'
        const ricorrente = ricorrenza !== 'nessuna'
        const slug = (f['Slug'] as string) || ''
        return {
          data:            f['Data'] ?? null,
          dataFine:        f['DataFineRicorrenza'] ?? null,
          giornoSettimana: ricorrente
            ? toGiorniNome(ricorrenza, (f['GiorniSettimana'] as string) || '', (f['GiorniEsclusione'] as string) || '')
            : '',
          titolo:          f['Titolo'] ?? '',
          descrizione:     f['Note'] ?? '',
          orario:          f['Ora'] ?? '',
          orarioFine:      f['OraFine'] ?? '',
          ricorrente,
          link:            slug ? `/eventi-speciali/${slug}` : '',
          nascondiAltri:   false,
          evidenza:        f['Tipo'] === 'pagina' || !!slug,
        }
      })

    return NextResponse.json({ success: true, events })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
