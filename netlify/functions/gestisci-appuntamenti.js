// netlify/functions/gestisci-appuntamenti.js
// GET / POST / DELETE appuntamenti agenda

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_AGENDA || 'Agenda'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }

  // GET — lista appuntamenti
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(
        `${BASE_URL}?sort[0][field]=Data&sort[0][direction]=asc&maxRecords=200`,
        { headers: AT_HEADERS }
      )
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      const appuntamenti = (json.records || []).map(r => ({
        id:                 r.id,
        title:              r.fields['Titolo'] || '',
        data:               r.fields['Data'] || '',
        ora:                r.fields['Ora'] || '',
        oraFine:            r.fields['OraFine'] || '',
        visibilita:         r.fields['Tipo'] || 'promozione',
        note:               r.fields['Note'] || '',
        descrizioneBreve:   r.fields['DescrizioneBreve'] || '',
        ricorrenza:         r.fields['Ricorrenza'] || 'nessuna',
        giorniSettimana:    r.fields['GiorniSettimana'] || '',
        giorniEsclusione:   r.fields['GiorniEsclusione'] || '',
        bloccaGiorno:       !!r.fields['BloccaGiorno'],
        dataFineRicorrenza: r.fields['DataFineRicorrenza'] || '',
        slug:               r.fields['Slug'] || '',
        fotoHero:           r.fields['FotoHero'] || '',
        tagFotoIntro:       r.fields['TagFotoIntro'] || '',
        titoloIntro:        r.fields['TitoloIntro'] || '',
        testoIntro:         r.fields['TestoIntro'] || '',
        blocchi:            r.fields['Blocchi'] || '[]',
        stato:              r.fields['Stato'] || 'attivo',
        metaTitle:          r.fields['MetaTitle'] || '',
        metaDescription:    r.fields['MetaDescription'] || '',
        inPrimoPiano:       !!r.fields['InPrimoPiano'],
      }))
      // Auto-dormiente: eventi singoli con data passata ancora attivi
      const oggi = new Date().toISOString().split('T')[0]
      const daArchiviare = appuntamenti.filter(a =>
        (!a.ricorrenza || a.ricorrenza === 'nessuna') &&
        a.data && a.data < oggi &&
        a.stato === 'attivo'
      )
      if (daArchiviare.length > 0) {
        fetch(`${BASE_URL}`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({
            records: daArchiviare.map(a => ({ id: a.id, fields: { 'Stato': 'dormiente' } }))
          })
        }).catch(() => {}) // fire-and-forget
        daArchiviare.forEach(a => { a.stato = 'dormiente' })
      }

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, appuntamenti }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // POST — crea o aggiorna
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body)

      const fields = {
        'Titolo':              body.title,
        'Data':                body.data,
        'Ora':                 body.ora || '',
        'OraFine':             body.oraFine || '',
        'Tipo':                body.visibilita || 'promozione',
        'Note':                body.note || '',
        'DescrizioneBreve':    body.descrizioneBreve || '',
        'Ricorrenza':          body.ricorrenza || 'nessuna',
        'GiorniSettimana':     body.giorniSettimana || '',
        'GiorniEsclusione':    body.giorniEsclusione || '',
        'BloccaGiorno':        !!body.bloccaGiorno,
        'Slug':                body.slug || '',
        'FotoHero':            body.fotoHero || '',
        'TagFotoIntro':        body.tagFotoIntro || '',
        'TitoloIntro':         body.titoloIntro || '',
        'TestoIntro':          body.testoIntro || '',
        'Blocchi':             body.blocchi || '[]',
        'Stato':               body.stato || 'attivo',
        'MetaTitle':           body.metaTitle || '',
        'MetaDescription':     body.metaDescription || '',
        'InPrimoPiano':        !!body.inPrimoPiano,
        ...(body.dataFineRicorrenza ? { 'DataFineRicorrenza': body.dataFineRicorrenza } : {}),
      }

      // Aggiorna esistente
      if (body.id) {
        const res = await fetch(`${BASE_URL}/${body.id}`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({ fields })
        })
        if (!res.ok) throw new Error(await res.text())
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
      }

      // Crea nuovo
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields })
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: json.id }) }
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
