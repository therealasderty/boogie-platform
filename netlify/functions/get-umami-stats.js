// netlify/functions/get-umami-stats.js
// Proxy autenticato verso Umami Cloud API
// GET: ?startAt=YYYY-MM-DD&endAt=YYYY-MM-DD

const UMAMI_API_KEY    = process.env.UMAMI_API_KEY
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID
const UMAMI_BASE       = 'https://api.umami.is/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: 'Method not allowed' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  const { startAt, endAt } = event.queryStringParameters || {}
  if (!startAt || !endAt) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'startAt e endAt richiesti' }) }

  if (!UMAMI_API_KEY || !UMAMI_WEBSITE_ID) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, data: null }) }
  }

  const start = new Date(startAt + 'T00:00:00').getTime()
  const end   = new Date(endAt   + 'T23:59:59').getTime()

  const atHeaders = {
    'Authorization': `Bearer ${UMAMI_API_KEY}`,
    'Accept': 'application/json',
  }

  try {
    const [statsRes, pagesRes, sourcesRes, devicesRes, prenotaRes] = await Promise.all([
      fetch(`${UMAMI_BASE}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${start}&endAt=${end}`, { headers: atHeaders }),
      fetch(`${UMAMI_BASE}/websites/${UMAMI_WEBSITE_ID}/metrics?type=url&startAt=${start}&endAt=${end}&limit=8`, { headers: atHeaders }),
      fetch(`${UMAMI_BASE}/websites/${UMAMI_WEBSITE_ID}/metrics?type=referrer&startAt=${start}&endAt=${end}&limit=8`, { headers: atHeaders }),
      fetch(`${UMAMI_BASE}/websites/${UMAMI_WEBSITE_ID}/metrics?type=device&startAt=${start}&endAt=${end}`, { headers: atHeaders }),
      fetch(`${UMAMI_BASE}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${start}&endAt=${end}&url=%2Fprenota`, { headers: atHeaders }),
    ])

    const [stats, pages, sources, devices, prenotaStats] = await Promise.all([
      statsRes.json(),
      pagesRes.json(),
      sourcesRes.json(),
      devicesRes.json(),
      prenotaRes.json(),
    ])

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        data: {
          visite:        stats.visits?.value    ?? 0,
          pageviews:     stats.pageviews?.value ?? 0,
          visitatori:    stats.visitors?.value  ?? 0,
          bounceRate:    stats.bounces?.value   ?? 0,
          visitePrenota: prenotaStats.visits?.value ?? 0,
          pages:   (Array.isArray(pages)   ? pages   : []).map(p => ({ url: p.x, visite: p.y })),
          sources: (Array.isArray(sources) ? sources : []).map(s => ({ sorgente: s.x || '(diretto)', visite: s.y })),
          devices: (Array.isArray(devices) ? devices : []).map(d => ({ device: d.x || 'altro', visite: d.y })),
        },
      }),
    }
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
  }
}
