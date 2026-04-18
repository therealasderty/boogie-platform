// netlify/functions/gestisci-localita.js
// GET / POST / PATCH / DELETE località per local SEO

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_LOCALITA || 'Localita'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function mapRecord(r) {
  return {
    id:              r.id,
    citta:           r.fields['Citta'] || '',
    slug:            r.fields['Slug'] || '',
    serviziAttivi:   (r.fields['ServiziAttivi'] || '').split(',').map(s => s.trim()).filter(Boolean),
    introText:       r.fields['IntroText'] || '',
    metaTitle:       r.fields['MetaTitle'] || '',
    metaDescription: r.fields['MetaDescription'] || '',
    attiva:          r.fields['Attiva'] !== false,
    ordine:          r.fields['Ordine'] || 0,
    tempoGuida:      r.fields['TempoGuida'] || '',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  // GET
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(
        `${BASE_URL}?sort[0][field]=Ordine&sort[0][direction]=asc&maxRecords=200`,
        { headers: AT_HEADERS }
      )
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, localita: (json.records || []).map(mapRecord) }),
      }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // POST — crea
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body)
      const fields = {
        'Citta':           body.citta || '',
        'Slug':            body.slug || '',
        'ServiziAttivi':   (body.serviziAttivi || []).join(','),
        'IntroText':       body.introText || '',
        'MetaTitle':       body.metaTitle || '',
        'MetaDescription': body.metaDescription || '',
        'Attiva':          !!body.attiva,
        'Ordine':          body.ordine || 0,
        'TempoGuida':      body.tempoGuida || '',
      }
      const res = await fetch(BASE_URL, {
        method: 'POST', headers: AT_HEADERS, body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: json.id }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // PATCH — aggiorna
  if (event.httpMethod === 'PATCH') {
    try {
      const body = JSON.parse(event.body)
      if (!body.id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id mancante' }) }
      const fields = {}
      if (body.citta           !== undefined) fields['Citta']           = body.citta
      if (body.slug            !== undefined) fields['Slug']            = body.slug
      if (body.serviziAttivi   !== undefined) fields['ServiziAttivi']   = (body.serviziAttivi || []).join(',')
      if (body.introText       !== undefined) fields['IntroText']       = body.introText
      if (body.metaTitle       !== undefined) fields['MetaTitle']       = body.metaTitle
      if (body.metaDescription !== undefined) fields['MetaDescription'] = body.metaDescription
      if (body.attiva          !== undefined) fields['Attiva']          = !!body.attiva
      if (body.ordine          !== undefined) fields['Ordine']          = body.ordine
      if (body.tempoGuida      !== undefined) fields['TempoGuida']      = body.tempoGuida || ''
      const res = await fetch(`${BASE_URL}/${body.id}`, {
        method: 'PATCH', headers: AT_HEADERS, body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error(await res.text())
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // DELETE
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
