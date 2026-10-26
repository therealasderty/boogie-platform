// netlify/functions/gestisci-recensioni-sito.js
// CRUD della tabella RecensioniSito. scraping-recensioni.js è un altro flusso (rating Google).

const RECORD_ID = /^rec[A-Za-z0-9]{10,20}$/
const PIATTAFORME = new Set(['Google', 'TripAdvisor'])

function isRecordId(id) {
  return typeof id === 'string' && RECORD_ID.test(id)
}

function toFields(data, { requireAll = false } = {}) {
  const fields = {}
  if (data.nome !== undefined) fields['Nome'] = String(data.nome).trim().slice(0, 200)
  if (data.piattaforma !== undefined) {
    if (!PIATTAFORME.has(data.piattaforma)) return { error: 'Piattaforma non valida' }
    fields['Piattaforma'] = data.piattaforma
  }
  if (data.stelle !== undefined) {
    const stelle = Number(data.stelle)
    if (!Number.isInteger(stelle) || stelle < 1 || stelle > 5) return { error: 'Stelle non valide' }
    fields['Stelle'] = stelle
  }
  if (data.testo !== undefined) fields['Testo'] = String(data.testo).trim().slice(0, 5000)
  if (data.data !== undefined) fields['Data'] = String(data.data).trim().slice(0, 80)
  if (data.attivo !== undefined) fields['Attivo'] = data.attivo === true
  if (data.ordine !== undefined) {
    const ordine = Number(data.ordine)
    if (!Number.isFinite(ordine)) return { error: 'Ordine non valido' }
    fields['Ordine'] = ordine
  }

  if (requireAll) {
    if (!fields['Nome']) return { error: 'Il nome è obbligatorio' }
    if (!fields['Testo']) return { error: 'Il testo è obbligatorio' }
    if (!fields['Piattaforma']) fields['Piattaforma'] = 'Google'
    if (fields['Stelle'] === undefined) fields['Stelle'] = 5
    if (fields['Attivo'] === undefined) fields['Attivo'] = true
    if (fields['Data'] === undefined) fields['Data'] = ''
  }

  if (Object.keys(fields).length === 0) return { error: 'Nessun campo da aggiornare' }
  return { fields }
}

function mapRecord(record) {
  return {
    id: record.id,
    nome: record.fields['Nome'] || '',
    piattaforma: record.fields['Piattaforma'] || 'Google',
    stelle: record.fields['Stelle'] ?? 5,
    testo: record.fields['Testo'] || '',
    data: record.fields['Data'] || '',
    attivo: record.fields['Attivo'] === true,
    ordine: record.fields['Ordine'] ?? 0,
  }
}

async function listAll(tableUrl, atHeaders) {
  const records = []
  let offset = null
  do {
    const url = `${tableUrl}?pageSize=100&sort[0][field]=Ordine&sort[0][direction]=asc${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`
    const res = await fetch(url, { headers: atHeaders })
    if (!res.ok) {
      console.error('[gestisci-recensioni-sito] GET', res.status, await res.text())
      return null
    }
    const json = await res.json()
    records.push(...(json.records || []))
    offset = json.offset || null
  } while (offset)
  return records
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
  const TABLE = process.env.AIRTABLE_RECENSIONI_SITO || 'RecensioniSito'
  const tableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
  const atHeaders = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

  if (event.httpMethod === 'GET') {
    try {
      const records = await listAll(tableUrl, atHeaders)
      if (!records) return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, items: records.map(mapRecord) }) }
    } catch (err) {
      console.error('[gestisci-recensioni-sito]', err)
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters && event.queryStringParameters.id
    if (!isRecordId(id)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID non valido' }) }
    const res = await fetch(`${tableUrl}/${id}`, { method: 'DELETE', headers: atHeaders })
    if (!res.ok) console.error('[gestisci-recensioni-sito] DELETE', res.status, await res.text())
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) }
  }

  let data
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) } }

  if (event.httpMethod === 'PATCH') {
    if (!isRecordId(data.id)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID non valido' }) }
    const mapped = toFields(data)
    if (mapped.error) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: mapped.error }) }
    const res = await fetch(`${tableUrl}/${data.id}`, {
      method: 'PATCH',
      headers: atHeaders,
      body: JSON.stringify({ fields: mapped.fields }),
    })
    if (!res.ok) {
      console.error('[gestisci-recensioni-sito] PATCH', res.status, await res.text())
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
    const result = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: result.id }) }
  }

  if (event.httpMethod === 'POST') {
    const mapped = toFields(data, { requireAll: true })
    if (mapped.error) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: mapped.error }) }
    const res = await fetch(tableUrl, {
      method: 'POST',
      headers: atHeaders,
      body: JSON.stringify({ fields: mapped.fields }),
    })
    if (!res.ok) {
      console.error('[gestisci-recensioni-sito] POST', res.status, await res.text())
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
    const result = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: result.id }) }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' }
}
