// netlify/functions/gestisci-appuntamenti.js
// GET / POST / DELETE appuntamenti agenda

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_AGENDA || 'Agenda'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const BREVO_API_KEY        = process.env.BREVO_API_KEY
const BREVO_LIST_ID_EVENTI = parseInt(process.env.BREVO_LIST_ID_EVENTI || '0')
const EMAIL_FROM           = process.env.EMAIL_FROM
const SITO_BASE            = 'https://boogiebistrot.com'

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

async function notificaRitornoEvento(titolo, slug, data, ora) {
  if (!BREVO_API_KEY || !EMAIL_FROM || !AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return 0

  const listaAttesaUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('ListaAttesa')}?filterByFormula=${encodeURIComponent(`{Evento}="${titolo}"`)}&maxRecords=500`
  const res = await fetch(listaAttesaUrl, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } })
  if (!res.ok) return 0
  const json = await res.json()

  const contatti = (json.records || []).map(r => ({
    email: r.fields['Email'] || '',
    nome:  r.fields['Nome'] || '',
    id:    r.id,
  })).filter(c => c.email)

  if (contatti.length === 0) return 0

  const dataFormattata = data ? (() => {
    const d = new Date(data + 'T00:00:00')
    return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
  })() : ''

  const eventoLink = slug
    ? `${SITO_BASE}/eventi-speciali/${slug}`
    : `${SITO_BASE}/eventi-speciali`

  const orarioLabel = ora ? ` · ore ${ora}` : ''
  const dataLabel   = dataFormattata ? `${dataFormattata}${orarioLabel}` : ''

  await Promise.allSettled(contatti.map(c => {
    const nome = c.nome || ''
    const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
<tr><td style="padding:40px 40px 20px;">
<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot · ${titolo}</p>
<h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;">È tornato ✓</h1>
<p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">${nome ? `Ciao <strong>${nome}</strong>,<br>` : ''}ci avevi lasciato i tuoi contatti — <strong>${titolo}</strong> è di nuovo disponibile${dataLabel ? ` per il <strong>${dataLabel}</strong>` : ''}. Prenota il tuo posto.</p>
${dataLabel ? `<table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;"><tr><td style="padding:16px 24px;"><p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data</span><strong>${dataLabel}</strong></p></td></tr></table>` : ''}
<a href="${eventoLink}" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">Prenota ora</a>
<p style="font-size:15px;color:#4A4030;line-height:1.6;margin:28px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
</td></tr>
<tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
<p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</p>
</td></tr>
</table></td></tr></table></body></html>`

    return fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
        to: [{ email: c.email, name: nome }],
        subject: `${titolo} è tornato${dataFormattata ? ' — ' + dataFormattata : ''}`,
        htmlContent: html,
      }),
    })
  }))

  return contatti.length
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
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
        stato:              (() => {
          const s = r.fields['Stato'] || 'attivo'
          if (s === 'dormiente') return 'passato'           // backward compat
          if (s === 'attivo' && r.fields['DataTBD']) return 'futuro' // backward compat
          return s
        })(),
        metaTitle:          r.fields['MetaTitle'] || '',
        metaDescription:    r.fields['MetaDescription'] || '',
        inPrimoPiano:       !!r.fields['InPrimoPiano'],
        dataTBD:            !!r.fields['DataTBD'],
        mostraInNews:       !!r.fields['MostraInNews'],
        socialCopy:         r.fields['SocialCopy'] || '',
        statoSocial:        r.fields['StatoSocial'] || 'nessuno',
      }))
      // Auto-passato: eventi singoli con data passata ancora attivi
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
            records: daArchiviare.map(a => ({
              id: a.id,
              fields: {
                'Stato': 'passato',
                // Se ha una pagina pubblica, mantienilo visibile nel carousel
                ...(a.slug ? { 'MostraInNews': true } : {}),
              }
            }))
          })
        }).catch(() => {}) // fire-and-forget
        daArchiviare.forEach(a => {
          a.stato = 'passato'
          if (a.slug) a.mostraInNews = true
        })
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
        'Data':                body.data || null,
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
        'DataTBD':             !!body.dataTBD,
        'MostraInNews':        !!body.mostraInNews,
        'SocialCopy':          body.socialCopy || '',
        'StatoSocial':         body.statoSocial || 'nessuno',
        ...(body.dataFineRicorrenza ? { 'DataFineRicorrenza': body.dataFineRicorrenza } : {}),
      }

      // Aggiorna esistente
      if (body.id) {
        let notificati = 0
        if (body.stato === 'attivo') {
          const vecchioRes = await fetch(`${BASE_URL}/${body.id}`, { headers: AT_HEADERS })
          if (vecchioRes.ok) {
            const vecchio = await vecchioRes.json()
            const statoVecchio = vecchio.fields?.['Stato']
            if (statoVecchio === 'futuro' || statoVecchio === 'passato' || statoVecchio === 'dormiente') {
              notificati = await notificaRitornoEvento(body.title, body.slug, body.data, body.ora).catch(() => 0)
            }
          }
        }
        const res = await fetch(`${BASE_URL}/${body.id}`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({ fields })
        })
        if (!res.ok) throw new Error(await res.text())
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, notificati }) }
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

  // PATCH — aggiorna campi specifici (usato da Social Scheduler)
  if (event.httpMethod === 'PATCH') {
    try {
      const body = JSON.parse(event.body)
      if (!body.id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'id mancante' }) }
      const fields = {}
      if (body.socialCopy  !== undefined) fields['SocialCopy']  = body.socialCopy
      if (body.statoSocial !== undefined) fields['StatoSocial'] = body.statoSocial
      if (body.stato       !== undefined) fields['Stato']       = body.stato
      if (body.inPrimoPiano !== undefined) fields['InPrimoPiano'] = !!body.inPrimoPiano
      if (body.dataTBD      !== undefined) fields['DataTBD']      = !!body.dataTBD
      if (body.mostraInNews !== undefined) fields['MostraInNews'] = !!body.mostraInNews
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
