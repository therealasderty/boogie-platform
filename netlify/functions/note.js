const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const BASE_ID = 'appo1z9qJbcQm2PQx'
const TABLE_ID = 'tblw6Crct6OaEjpDk'
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`

const atHeaders = {
  'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

async function airtable(url, options = {}) {
  const res = await fetch(url, { ...options, headers: atHeaders })
  if (!res.ok) throw new Error(`Airtable HTTP ${res.status}`)
  return res.json()
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  const method = event.httpMethod

  if (method === 'GET') {
    try {
      const json = await airtable(`${BASE_URL}?sort[0][field]=Data&sort[0][direction]=desc&maxRecords=50`)
      const note = (json.records || []).map(r => ({
        id: r.id,
        testo: r.fields.Testo || '',
        autore: r.fields.Autore || '',
        data: r.fields.Data || '',
        completata: r.fields.Completata || false,
        categoria: r.fields.Categoria || 'Generale',
        per: r.fields.Per || [],
      }))
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, note }) }
    } catch (e) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  if (method === 'POST') {
    try {
      const body = JSON.parse(event.body)

      if (body.action === 'toggle' && body.id) {
        const json = await airtable(`${BASE_URL}/${body.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ fields: { Completata: body.completata } }),
        })
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, record: json }) }
      }

      if (body.action === 'delete' && body.id) {
        await airtable(`${BASE_URL}/${body.id}`, { method: 'DELETE' })
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) }
      }

      const json = await airtable(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          fields: {
            Testo: body.testo,
            Autore: body.autore,
            Data: new Date().toISOString().split('T')[0],
            Completata: false,
            Categoria: body.categoria || 'Generale',
            Per: body.per || [],
          }
        }),
      })
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, record: json }) }
    } catch (e) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' }
}
