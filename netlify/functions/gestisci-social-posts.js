// netlify/functions/gestisci-social-posts.js
// CRUD per la tabella SocialPosts su Airtable.
//
// Tabella Airtable "SocialPosts" — campi richiesti:
//   Titolo            (Single line text)
//   Stato             (Single select): Bozza | Programmato | Pubblicato | Errore
//   DataProgrammata   (Date, include time field)
//   Caption           (Long text)
//   Slides            (Long text — JSON array di slide)
//   Piattaforme       (Long text — CSV: "instagram,facebook")
//   Sorgente          (Single select): evento | menu | recensione | libero
//   SorgenteId        (Single line text)
//   SorgenteTitolo    (Single line text)
//   RisultatiPubblicazione (Long text — JSON)
//   ErroreMsg         (Long text)
//   DataCreazione     (Single line text — ISO string)
//   DataPubblicata    (Single line text — ISO string)
//
// GET    ?stato=Bozza    → lista post filtrata
// POST                   → crea post
// PATCH                  → aggiorna post (body.id obbligatorio)
// DELETE ?id=recXXX      → elimina post

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_SOCIAL_POSTS || 'SocialPosts'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = {
  'Authorization':  `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type':   'application/json',
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function mapRecord(r) {
  return {
    id:                      r.id,
    titolo:                  r.fields['Titolo']                  || '',
    stato:                   r.fields['Stato']                   || 'Bozza',
    dataProgrammata:         r.fields['DataProgrammata']         || '',
    caption:                 r.fields['Caption']                 || '',
    slides:                  r.fields['Slides']                  || '[]',
    piattaforme:             r.fields['Piattaforme']             || '',
    sorgente:                r.fields['Sorgente']                || 'libero',
    sorgenteId:              r.fields['SorgenteId']              || '',
    sorgenteTitolo:          r.fields['SorgenteTitolo']          || '',
    risultatiPubblicazione:  r.fields['RisultatiPubblicazione']  || '',
    erroreMsg:               r.fields['ErroreMsg']               || '',
    dataCreazione:           r.fields['DataCreazione']           || '',
    dataPubblicata:          r.fields['DataPubblicata']          || '',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
  }

  // ── GET — lista ──────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const stato = event.queryStringParameters?.stato
      const params = new URLSearchParams({
        'sort[0][field]':     'DataCreazione',
        'sort[0][direction]': 'desc',
        maxRecords:           '200',
      })
      if (stato) params.set('filterByFormula', `{Stato}='${stato}'`)

      const res  = await fetch(`${BASE_URL}?${params}`, { headers: AT_HEADERS })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify({ success: true, posts: (json.records || []).map(mapRecord) }),
      }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}

  // ── POST — crea ──────────────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const fields = {
        'Titolo':          body.titolo          || 'Nuovo post',
        'Stato':           body.stato           || 'Bozza',
        'Caption':         body.caption         || '',
        'Slides':          typeof body.slides === 'string' ? body.slides : JSON.stringify(body.slides || []),
        'Piattaforme':     body.piattaforme     || '',
        'Sorgente':        body.sorgente        || 'libero',
        'SorgenteId':      body.sorgenteId      || '',
        'SorgenteTitolo':  body.sorgenteTitolo  || '',
        'DataCreazione':   new Date().toISOString(),
      }
      if (body.dataProgrammata) fields['DataProgrammata'] = body.dataProgrammata

      const res  = await fetch(BASE_URL, {
        method:  'POST',
        headers: AT_HEADERS,
        body:    JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify({ success: true, post: mapRecord(json) }),
      }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // ── PATCH — aggiorna ─────────────────────────────────────────────────────────
  if (event.httpMethod === 'PATCH') {
    if (!body.id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id obbligatorio' }) }
    }
    try {
      const fields = {}
      if (body.titolo          !== undefined) fields['Titolo']                  = body.titolo
      if (body.stato           !== undefined) fields['Stato']                   = body.stato
      if (body.caption         !== undefined) fields['Caption']                 = body.caption
      if (body.slides          !== undefined) fields['Slides']                  = typeof body.slides === 'string' ? body.slides : JSON.stringify(body.slides)
      if (body.piattaforme     !== undefined) fields['Piattaforme']             = body.piattaforme
      if (body.dataProgrammata !== undefined) fields['DataProgrammata']         = body.dataProgrammata
      if (body.sorgenteId      !== undefined) fields['SorgenteId']              = body.sorgenteId
      if (body.sorgenteTitolo  !== undefined) fields['SorgenteTitolo']          = body.sorgenteTitolo
      if (body.erroreMsg       !== undefined) fields['ErroreMsg']               = body.erroreMsg
      if (body.dataPubblicata  !== undefined) fields['DataPubblicata']          = body.dataPubblicata
      if (body.risultatiPubblicazione !== undefined) {
        fields['RisultatiPubblicazione'] = typeof body.risultatiPubblicazione === 'string'
          ? body.risultatiPubblicazione
          : JSON.stringify(body.risultatiPubblicazione)
      }

      const res  = await fetch(`${BASE_URL}/${body.id}`, {
        method:  'PATCH',
        headers: AT_HEADERS,
        body:    JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify({ success: true, post: mapRecord(json) }),
      }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id || body.id
    if (!id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id obbligatorio' }) }
    }
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: AT_HEADERS })
      if (!res.ok) throw new Error(await res.text())
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  return { statusCode: 405, headers: CORS, body: 'Method not allowed' }
}
