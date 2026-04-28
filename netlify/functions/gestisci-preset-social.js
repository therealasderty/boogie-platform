// netlify/functions/gestisci-preset-social.js
// CRUD preset social su tabella Airtable "PresetSocial"
// Campi: Nome (text), Slides (long text JSON)
//
// GET    → lista preset
// POST   → crea preset  { nome, slides }
// PATCH  → aggiorna     { id, nome?, slides? }
// DELETE → elimina      { id }

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = 'PresetSocial'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(`${BASE_URL}?sort[0][field]=Nome&sort[0][direction]=asc&maxRecords=200`, { headers: AT_HEADERS })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const preset = (json.records || []).map(r => ({
        id:     r.id,
        nome:   r.fields['Nome'] || '',
        slides: r.fields['Slides'] || '[]',
      }))
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, preset }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { nome, slides } = JSON.parse(event.body)
      if (!nome) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'nome mancante' }) }
      const res = await fetch(BASE_URL, {
        method: 'POST', headers: AT_HEADERS,
        body: JSON.stringify({ fields: { Nome: nome, Slides: slides || '[]' } }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: json.id }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  if (event.httpMethod === 'PATCH') {
    try {
      const body = JSON.parse(event.body)
      if (!body.id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id mancante' }) }
      const fields = {}
      if (body.nome   !== undefined) fields['Nome']   = body.nome
      if (body.slides !== undefined) fields['Slides'] = body.slides
      const res = await fetch(`${BASE_URL}/${body.id}`, {
        method: 'PATCH', headers: AT_HEADERS,
        body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error(await res.text())
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      const { id } = JSON.parse(event.body)
      await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: AT_HEADERS })
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  return { statusCode: 405, headers: CORS, body: 'Method not allowed' }
}
