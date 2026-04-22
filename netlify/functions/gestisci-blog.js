// netlify/functions/gestisci-blog.js
// GET / POST / PATCH / DELETE articoli blog

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_BLOG || 'Blog'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  // GET — lista articoli (tutti, inclusi non pubblicati)
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(
        `${BASE_URL}?sort[0][field]=Ordine&sort[0][direction]=asc&maxRecords=200`,
        { headers: AT_HEADERS }
      )
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const articoli = (json.records || []).map(r => ({
        id:               r.id,
        titolo:           r.fields['Titolo'] || '',
        slug:             r.fields['Slug'] || '',
        autore:           r.fields['Autore'] || '',
        dataPubblicazione: r.fields['DataPubblicazione'] || '',
        categoria:        r.fields['Categoria'] || '',
        descrizioneBreve: r.fields['DescrizioneBreve'] || '',
        fotoHero:         r.fields['FotoHero'] || '',
        contenuto:        r.fields['Contenuto'] || '',
        metaTitle:        r.fields['MetaTitle'] || '',
        metaDescription:  r.fields['MetaDescription'] || '',
        pubblicato:       r.fields['Pubblicato'] !== false,
        ordine:           r.fields['Ordine'] || 0,
        socialCopy:       r.fields['SocialCopy'] || '',
        statoSocial:      r.fields['StatoSocial'] || 'nessuno',
      }))
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, articoli }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // POST — crea nuovo
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body)
      const fields = {
        'Titolo':            body.titolo || '',
        'Slug':              body.slug || '',
        'Autore':            body.autore || '',
        'DataPubblicazione': body.dataPubblicazione || '',
        'Categoria':         body.categoria || '',
        'DescrizioneBreve':  body.descrizioneBreve || '',
        'FotoHero':          body.fotoHero || '',
        'Contenuto':         body.contenuto || '',
        'MetaTitle':         body.metaTitle || '',
        'MetaDescription':   body.metaDescription || '',
        'Pubblicato':        !!body.pubblicato,
        'Ordine':            body.ordine || 0,
        'SocialCopy':        body.socialCopy || '',
        'StatoSocial':       body.statoSocial || 'nessuno',
      }
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields }),
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
      if (body.titolo           !== undefined) fields['Titolo']            = body.titolo
      if (body.slug             !== undefined) fields['Slug']              = body.slug
      if (body.autore           !== undefined) fields['Autore']            = body.autore
      if (body.dataPubblicazione !== undefined) fields['DataPubblicazione'] = body.dataPubblicazione
      if (body.categoria        !== undefined) fields['Categoria']         = body.categoria
      if (body.descrizioneBreve !== undefined) fields['DescrizioneBreve']  = body.descrizioneBreve
      if (body.fotoHero         !== undefined) fields['FotoHero']          = body.fotoHero
      if (body.contenuto        !== undefined) fields['Contenuto']         = body.contenuto
      if (body.metaTitle        !== undefined) fields['MetaTitle']         = body.metaTitle
      if (body.metaDescription  !== undefined) fields['MetaDescription']   = body.metaDescription
      if (body.pubblicato       !== undefined) fields['Pubblicato']        = !!body.pubblicato
      if (body.ordine           !== undefined) fields['Ordine']            = body.ordine
      if (body.socialCopy       !== undefined) fields['SocialCopy']        = body.socialCopy
      if (body.statoSocial      !== undefined) fields['StatoSocial']       = body.statoSocial

      const res = await fetch(`${BASE_URL}/${body.id}`, {
        method: 'PATCH',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields }),
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
