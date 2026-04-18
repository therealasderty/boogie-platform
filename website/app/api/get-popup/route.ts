import { NextResponse } from 'next/server'

const TABLE = process.env.AIRTABLE_AGENDA || 'Agenda'

function isRicorrente(fields: Record<string, unknown>): boolean {
  const ric = fields['Ricorrenza'] as string
  return !!ric && ric !== '' && ric !== 'nessuna'
}

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN
  const base  = process.env.AIRTABLE_BASE_ID

  if (!token || !base) return NextResponse.json({ success: false, popup: null }, { status: 500 })

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLE)}?filterByFormula={Stato}="attivo"&sort[0][field]=Data&sort[0][direction]=asc&maxRecords=50`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error(await res.text())

    const json = await res.json()
    const records: { fields: Record<string, unknown> }[] = json.records || []

    const oggi      = new Date().toISOString().split('T')[0]
    const in7giorni = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const imminenti = records
      .filter(r => !isRicorrente(r.fields) && (r.fields['Data'] as string) >= oggi && (r.fields['Data'] as string) <= in7giorni)
      .sort((a, b) => ((a.fields['Data'] as string) || '').localeCompare((b.fields['Data'] as string) || ''))

    const futuri = records
      .filter(r => !isRicorrente(r.fields) && (r.fields['Data'] as string) > in7giorni)
      .sort((a, b) => ((a.fields['Data'] as string) || '').localeCompare((b.fields['Data'] as string) || ''))

    const ricorrenti = records.filter(r => isRicorrente(r.fields))

    const selected = imminenti[0] || futuri[0] || ricorrenti[0] || null

    if (!selected) return NextResponse.json({ success: true, popup: null })

    const f = selected.fields
    return NextResponse.json({
      success: true,
      popup: {
        slug:             f['Slug'] || '',
        titolo:           f['Titolo'] || '',
        descrizioneBreve: f['DescrizioneBreve'] || '',
        fotoHero:         f['FotoHero'] || '',
        data:             f['Data'] || null,
        ricorrente:       isRicorrente(f),
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, popup: null, error: (e as Error).message }, { status: 500 })
  }
}
