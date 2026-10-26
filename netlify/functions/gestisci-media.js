// netlify/functions/gestisci-media.js

const RECORD_ID = /^rec[A-Za-z0-9]{10,20}$/

function isRecordId(id) {
  return typeof id === 'string' && RECORD_ID.test(id)
}

function toFields(data) {
  const fields = {}
  if (data.nome !== undefined) fields['Nome'] = String(data.nome).slice(0, 200)
  if (data.url !== undefined) fields['URL'] = String(data.url).trim().slice(0, 2000)
  if (data.alt !== undefined) fields['Alt text'] = String(data.alt).slice(0, 500)
  if (data.tag !== undefined) {
    const tag = Array.isArray(data.tag) ? data.tag.join(', ') : String(data.tag)
    fields['Tag'] = tag.slice(0, 500)
  }
  if (data.soloMobile !== undefined) fields['Solo Mobile'] = data.soloMobile === true
  if (data.ordine !== undefined) {
    const ordine = Number(data.ordine)
    if (!Number.isFinite(ordine)) return { error: 'Ordine non valido' }
    fields['Ordine'] = ordine
  }
  if (Object.keys(fields).length === 0) return { error: 'Nessun campo da aggiornare' }
  return { fields }
}

function mapRecord(record) {
  const tag = record.fields['Tag']
  return {
    id: record.id,
    nome: record.fields['Nome'] || '',
    url: record.fields['URL'] || '',
    alt: record.fields['Alt text'] || '',
    tag: tag ? String(tag).split(',').map((t) => t.trim()).filter(Boolean) : [],
    ordine: record.fields['Ordine'] ?? 0,
    soloMobile: record.fields['Solo Mobile'] === true,
  }
}

async function listAll(tableUrl, atHeaders) {
  const query = [
    'pageSize=100',
    'fields[]=Nome',
    'fields[]=URL',
    `fields[]=${encodeURIComponent('Alt text')}`,
    'fields[]=Tag',
    'fields[]=Ordine',
    `fields[]=${encodeURIComponent('Solo Mobile')}`,
    'sort[0][field]=Ordine',
    'sort[0][direction]=asc',
  ].join('&')

  const records = []
  let offset = null
  do {
    const url = `${tableUrl}?${query}${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`
    const res = await fetch(url, { headers: atHeaders })
    if (!res.ok) {
      console.error('[gestisci-media] GET', res.status, await res.text())
      return null
    }
    const json = await res.json()
    records.push(...(json.records || []))
    offset = json.offset || null
  } while (offset)
  return records
}

async function patchBatches(tableUrl, atHeaders, records) {
  for (let i = 0; i < records.length; i += 10) {
    const res = await fetch(tableUrl, {
      method: 'PATCH',
      headers: atHeaders,
      body: JSON.stringify({ records: records.slice(i, i + 10) }),
    })
    if (!res.ok) {
      console.error('[gestisci-media] PATCH batch', res.status, await res.text())
      return false
    }
  }
  return true
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
  const TABLE = process.env.AIRTABLE_MEDIA || 'Media'
  const tableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
  const atHeaders = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

  if (event.httpMethod === 'GET') {
    try {
      const records = await listAll(tableUrl, atHeaders)
      if (!records) return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
      const items = records.map(mapRecord).filter((item) => item.url)
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, items }) }
    } catch (err) {
      console.error('[gestisci-media]', err)
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters && event.queryStringParameters.id
    if (!isRecordId(id)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID non valido' }) }
    const res = await fetch(`${tableUrl}/${id}`, { method: 'DELETE', headers: atHeaders })
    if (!res.ok) console.error('[gestisci-media] DELETE', res.status, await res.text())
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) }
  }

  let data
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) } }

  if (event.httpMethod === 'PATCH' && Array.isArray(data.records)) {
    if (data.records.length === 0 || data.records.length > 200) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Batch non valido' }) }
    }
    const records = []
    for (const row of data.records) {
      if (!isRecordId(row && row.id)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID non valido' }) }
      }
      const mapped = toFields(row)
      if (mapped.error) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: mapped.error }) }
      records.push({ id: row.id, fields: mapped.fields })
    }
    const ok = await patchBatches(tableUrl, atHeaders, records)
    return { statusCode: ok ? 200 : 500, headers, body: JSON.stringify({ success: ok }) }
  }

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
      console.error('[gestisci-media] PATCH', res.status, await res.text())
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
    const result = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: result.id }) }
  }

  if (event.httpMethod === 'POST') {
    const mapped = toFields(data)
    if (mapped.error) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: mapped.error }) }
    if (!mapped.fields['URL']) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'URL obbligatorio' }) }
    const res = await fetch(tableUrl, {
      method: 'POST',
      headers: atHeaders,
      body: JSON.stringify({ fields: mapped.fields }),
    })
    if (!res.ok) {
      console.error('[gestisci-media] POST', res.status, await res.text())
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'Errore Airtable' }) }
    }
    const result = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: result.id }) }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' }
}
