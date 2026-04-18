// netlify/functions/gestisci-localita-servizi.js
// GET / POST / PATCH / DELETE + action=sync per LocalitaServizi

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE_SERVIZI    = 'LocalitaServizi'
const TABLE_LOCALITA   = process.env.AIRTABLE_LOCALITA || 'Localita'
const BASE_SERVIZI     = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_SERVIZI)}`
const BASE_LOCALITA    = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_LOCALITA)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function mapServizio(r) {
  return {
    id:        r.id,
    cittaSlug: r.fields['CittaSlug'] || '',
    eventoSlug: r.fields['EventoSlug'] || '',
    introText: r.fields['IntroText'] || '',
    attiva:    r.fields['Attiva'] !== false,
  }
}

async function getAllServizi() {
  const records = []
  let offset = null
  do {
    const url = BASE_SERVIZI + '?maxRecords=200' + (offset ? `&offset=${offset}` : '')
    const res = await fetch(url, { headers: AT_HEADERS })
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()
    records.push(...(json.records || []))
    offset = json.offset || null
  } while (offset)
  return records
}

async function getAllLocalita() {
  const res = await fetch(
    `${BASE_LOCALITA}?maxRecords=200`,
    { headers: AT_HEADERS }
  )
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return json.records || []
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  // GET — lista tutti i servizi
  if (event.httpMethod === 'GET') {
    try {
      const records = await getAllServizi()
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, servizi: records.map(mapServizio) }),
      }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')

    // SYNC — crea i record mancanti in LocalitaServizi
    if (body.action === 'sync') {
      try {
        const [localitaRecords, serviziRecords] = await Promise.all([
          getAllLocalita(),
          getAllServizi(),
        ])

        // Costruisce set delle coppie già esistenti
        const esistenti = new Set(
          serviziRecords.map(r => `${r.fields['CittaSlug']}::${r.fields['EventoSlug']}`)
        )

        // Trova le coppie mancanti
        const mancanti = []
        for (const loc of localitaRecords) {
          const cittaSlug = loc.fields['Slug'] || ''
          const serviziRaw = loc.fields['ServiziAttivi'] || ''
          const servizi = serviziRaw.split(',').map(s => s.trim()).filter(Boolean)
          for (const eventoSlug of servizi) {
            const key = `${cittaSlug}::${eventoSlug}`
            if (!esistenti.has(key)) {
              mancanti.push({ cittaSlug, eventoSlug })
            }
          }
        }

        // Crea i record mancanti (batch da 10 per Airtable)
        let creati = 0
        for (let i = 0; i < mancanti.length; i += 10) {
          const batch = mancanti.slice(i, i + 10).map(m => ({
            fields: {
              'CittaSlug':  m.cittaSlug,
              'EventoSlug': m.eventoSlug,
              'IntroText':  '',
              'Attiva':     true,
            },
          }))
          const res = await fetch(BASE_SERVIZI, {
            method: 'POST',
            headers: AT_HEADERS,
            body: JSON.stringify({ records: batch }),
          })
          if (!res.ok) throw new Error(await res.text())
          creati += batch.length
        }

        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ success: true, creati, mancanti: mancanti.length }),
        }
      } catch (e) {
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
      }
    }

    // POST normale — crea singolo record
    try {
      const res = await fetch(BASE_SERVIZI, {
        method: 'POST',
        headers: AT_HEADERS,
        body: JSON.stringify({
          fields: {
            'CittaSlug':  body.cittaSlug || '',
            'EventoSlug': body.eventoSlug || '',
            'IntroText':  body.introText || '',
            'Attiva':     body.attiva !== false,
          },
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: json.id }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // PATCH — aggiorna IntroText / Attiva
  if (event.httpMethod === 'PATCH') {
    try {
      const body = JSON.parse(event.body || '{}')
      if (!body.id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id mancante' }) }
      const fields = {}
      if (body.introText !== undefined) fields['IntroText'] = body.introText
      if (body.attiva    !== undefined) fields['Attiva']    = !!body.attiva
      const res = await fetch(`${BASE_SERVIZI}/${body.id}`, {
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
      const { id } = JSON.parse(event.body || '{}')
      await fetch(`${BASE_SERVIZI}/${id}`, { method: 'DELETE', headers: AT_HEADERS })
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  return { statusCode: 405, headers: CORS, body: 'Method not allowed' }
}
