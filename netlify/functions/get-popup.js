// netlify/functions/get-popup.js
// GET pubblico — seleziona automaticamente l'evento più rilevante da mostrare nel popup

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_AGENDA || 'Agenda'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function isRicorrente(r) {
  const ric = r.fields['Ricorrenza']
  return ric && ric !== '' && ric !== 'nessuna'
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: 'Method not allowed' }

  try {
    const formula = encodeURIComponent('OR({Stato}="attivo",{Stato}="futuro",AND(OR({Stato}="passato",{Stato}="dormiente"),{InPrimoPiano}=1))')
    const res = await fetch(
      `${BASE_URL}?filterByFormula=${formula}&sort[0][field]=Data&sort[0][direction]=asc&maxRecords=50`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    )
    if (!res.ok) throw new Error(await res.text())

    const json = await res.json()
    const records = json.records || []

    const oggi     = new Date().toISOString().split('T')[0]
    const in7giorni = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

    const attivi  = records.filter(r => r.fields['Stato'] === 'attivo')
    const futuriTBD = records.filter(r => r.fields['Stato'] === 'futuro')

    // 1. Una tantum attivi nei prossimi 7 giorni (priorità assoluta)
    const imminenti = attivi
      .filter(r => !isRicorrente(r) && r.fields['Data'] >= oggi && r.fields['Data'] <= in7giorni)
      .sort((a, b) => (a.fields['Data'] || '').localeCompare(b.fields['Data'] || ''))

    // 2. Una tantum attivi futuri oltre i 7 giorni
    const futuriDatati = attivi
      .filter(r => !isRicorrente(r) && r.fields['Data'] > in7giorni)
      .sort((a, b) => (a.fields['Data'] || '').localeCompare(b.fields['Data'] || ''))

    // 3. Passati/futuri con InPrimoPiano
    const passatiInPrimoPiano = records.filter(r =>
      (r.fields['Stato'] === 'passato' || r.fields['Stato'] === 'dormiente') && r.fields['InPrimoPiano']
    )

    // 4. Ricorrenti attivi (fallback)
    const ricorrenti = attivi.filter(r => isRicorrente(r))

    const selected = imminenti[0] || futuriDatati[0] || futuriTBD[0] || passatiInPrimoPiano[0] || ricorrenti[0] || null

    if (!selected) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, popup: null }) }
    }

    const f = selected.fields
    const popup = {
      slug:             f['Slug'] || '',
      titolo:           f['Titolo'] || '',
      descrizioneBreve: f['DescrizioneBreve'] || '',
      fotoHero:         f['FotoHero'] || '',
      data:             f['Data'] || null,
      ricorrente:       isRicorrente(selected),
      stato:            f['Stato'] || 'attivo',
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, popup }) }
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
  }
}
