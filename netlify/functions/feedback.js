// netlify/functions/feedback.js
// Chiamata ogni giorno alle 11:00 da cron-job.org
//
// 1) Prima mail: prenotazioni confermate + WiFi di ieri → chiedi recensione Google
// 2) Follow-up: se il conteggio Google non è salito rispetto allo snapshot di ieri,
//    rimanda un sollecito a chi ha ricevuto la prima mail ieri (visitatori di 2 giorni fa)
// 3) Salva snapshot giornaliero del conteggio Google su Airtable (tabella Recensioni)

const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJr9H7A7enhkcRimfhn3EqfVU'
const PLACE_ID = 'ChIJr9H7A7enhkcRimfhn3EqfVU'

function ymd(d) {
  return d.toISOString().split('T')[0]
}

function formatDataIT(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function atHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function fetchClientiPerData({ token, baseId, tablePren, dataYmd }) {
  const filterPren = encodeURIComponent(
    `AND(DATETIME_FORMAT({Data},'YYYY-MM-DD')="${dataYmd}", {Stato}="Confermata")`
  )
  const urlPren = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tablePren)}?filterByFormula=${filterPren}&fields[]=Nome&fields[]=Email&fields[]=Data`

  const filterWifi = encodeURIComponent(
    `DATETIME_FORMAT({Ultima visita},'YYYY-MM-DD')="${dataYmd}"`
  )
  const urlWifi = `https://api.airtable.com/v0/${baseId}/WiFi_Clienti?filterByFormula=${filterWifi}&fields[]=Nome&fields[]=Email`

  const [resPren, resWifi] = await Promise.all([
    fetch(urlPren, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(urlWifi, { headers: { Authorization: `Bearer ${token}` } }),
  ])

  if (!resPren.ok) {
    throw new Error(`Airtable prenotazioni: ${await resPren.text()}`)
  }

  const prenotazioni = (await resPren.json()).records || []
  const wifiClienti = resWifi.ok ? ((await resWifi.json()).records || []) : []

  const clientiMap = new Map()
  const dataFormattataDefault = formatDataIT(dataYmd)

  for (const record of prenotazioni) {
    const email = (record.fields['Email'] || '').toLowerCase().trim()
    const nome = (record.fields['Nome'] || '').split(' ')[0]
    const data = record.fields['Data'] || ''
    if (!email) continue
    const dataFormattata = data ? formatDataIT(data) : dataFormattataDefault
    if (!clientiMap.has(email)) clientiMap.set(email, { nome, dataFormattata })
  }

  for (const record of wifiClienti) {
    const email = (record.fields['Email'] || '').toLowerCase().trim()
    const nome = (record.fields['Nome'] || '').split(' ')[0]
    if (!email) continue
    if (!clientiMap.has(email)) clientiMap.set(email, { nome, dataFormattata: dataFormattataDefault })
  }

  return clientiMap
}

async function fetchUltimoSnapshotPrimaDiOggi({ token, baseId, table, oggi }) {
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?sort[0][field]=Data&sort[0][direction]=desc&maxRecords=5` +
    `&filterByFormula=${encodeURIComponent(`IS_BEFORE({Data}, '${oggi}')`)}`

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.error('Snapshot Recensioni error:', await res.text())
    return null
  }
  const records = (await res.json()).records || []
  if (!records.length) return null
  const fields = records[0].fields || {}
  const count = fields['Google Recensioni']
  return {
    data: fields['Data'] || null,
    count: typeof count === 'number' ? count : (count != null ? Number(count) : null),
  }
}

async function upsertSnapshotOggi({ token, baseId, table, oggi, count, rating }) {
  const findUrl =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?maxRecords=1&filterByFormula=${encodeURIComponent(`{Data}='${oggi}'`)}`

  const findRes = await fetch(findUrl, { headers: { Authorization: `Bearer ${token}` } })
  if (!findRes.ok) {
    console.error('Find snapshot oggi error:', await findRes.text())
    return
  }
  const existing = ((await findRes.json()).records || [])[0]
  const fields = { Data: oggi, 'Google Recensioni': count }
  if (rating != null) fields['Google Rating'] = rating

  if (existing) {
    const patchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${existing.id}`,
      {
        method: 'PATCH',
        headers: atHeaders(token),
        body: JSON.stringify({ fields }),
      }
    )
    if (!patchRes.ok) console.error('Update snapshot error:', await patchRes.text())
    return
  }

  const createRes = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
    {
      method: 'POST',
      headers: atHeaders(token),
      body: JSON.stringify({ fields }),
    }
  )
  if (!createRes.ok) console.error('Create snapshot error:', await createRes.text())
}

function emailHtmlPrima({ nome, dataFormattata, sitoUrl }) {
  const linkNegativo = `${sitoUrl}/feedback?nome=${encodeURIComponent(nome)}&data=${dataFormattata}`
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot</p>
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 4px;font-weight:400;line-height:1.3;">Ciao ${nome},</h1>
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;line-height:1.3;">grazie per aver scelto il Boogie Bistrot ${dataFormattata}!</h1>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 32px;">
            Come è andata l'esperienza? Ci farebbe molto piacere sapere la tua opinione.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${GOOGLE_REVIEW_URL}" target="_blank"
                   style="display:block;background:#1A1610;color:white;text-decoration:none;padding:14px 16px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border-radius:4px;line-height:1.4;">
                  😊 È stata una bella serata<br>
                  <span style="font-size:11px;font-weight:400;opacity:0.7;letter-spacing:0;">Lascia una recensione su Google</span>
                </a>
              </td>
              <td style="padding-left:8px;">
                <a href="${linkNegativo}"
                   style="display:block;background:#F5F0E8;color:#1A1610;text-decoration:none;padding:14px 16px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border:1px solid #D4C9B0;border-radius:4px;line-height:1.4;">
                  😐 C'è qualcosa da migliorare<br>
                  <span style="font-size:11px;font-weight:400;opacity:0.6;letter-spacing:0;">Lascia un feedback</span>
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 8px;">Grazie di cuore,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            Hai ricevuto questa email perché hai cenato da noi. Non vuoi ricevere questi messaggi? Scrivici a <a href="mailto:info@boogiebistrot.com" style="color:#C4913A;">info@boogiebistrot.com</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function emailHtmlFollowup({ nome, dataFormattata }) {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot</p>
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 4px;font-weight:400;line-height:1.3;">Ciao ${nome},</h1>
          <h1 style="font-size:24px;color:#1A1610;margin:0 0 24px;font-weight:400;line-height:1.3;">un piccolo sollecito sulla tua sera al Boogie</h1>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 16px;">
            Ti abbiamo scritto dopo la tua visita del ${dataFormattata}. Se l'esperienza ti è piaciuta, una recensione su Google ci aiuta davvero tanto.
          </p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 32px;">
            Ci vuole un minuto — e per noi vale oro.
          </p>
          <a href="${GOOGLE_REVIEW_URL}" target="_blank"
             style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:14px 28px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border-radius:4px;">
            Lascia una recensione su Google
          </a>
          <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:32px 0 8px;">Grazie di cuore,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            Hai ricevuto questa email perché hai cenato da noi. Non vuoi ricevere questi messaggi? Scrivici a <a href="mailto:info@boogiebistrot.com" style="color:#C4913A;">info@boogiebistrot.com</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function inviaBrevo({ apiKey, emailFrom, toEmail, toName, subject, htmlContent }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: 'Boogie Bistrot', email: emailFrom },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brevo ${res.status}: ${text}`)
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const API_KEY = process.env.FEEDBACK_API_KEY
  const requestKey = event.headers['x-api-key'] || event.queryStringParameters?.key
  if (API_KEY && requestKey !== API_KEY) {
    return { statusCode: 401, headers, body: 'Unauthorized' }
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'Prenotazioni'
  const AIRTABLE_RECENSIONI = process.env.AIRTABLE_RECENSIONI || 'Recensioni'
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  const EMAIL_FROM = process.env.EMAIL_FROM
  const SITO_URL = process.env.SITO_URL || 'https://boogiebistrot.com'
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

  const oggi = new Date()
  const dataOggi = ymd(oggi)
  const ieri = new Date(oggi)
  ieri.setDate(ieri.getDate() - 1)
  const dataIeri = ymd(ieri)
  const dueGiorniFa = new Date(oggi)
  dueGiorniFa.setDate(dueGiorniFa.getDate() - 2)
  const dataDueGiorniFa = ymd(dueGiorniFa)

  console.log('Feedback run:', { dataOggi, dataIeri, dataDueGiorniFa })

  try {
    // ── Snapshot Google: live + ultimo salvato prima di oggi ───────────
    let googleCountLive = null
    let googleRatingLive = null
    if (GOOGLE_PLACES_API_KEY) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`
      const placesRes = await fetch(placesUrl)
      const placesData = await placesRes.json()
      if (placesData.status === 'OK') {
        googleCountLive = placesData.result?.user_ratings_total ?? null
        googleRatingLive = placesData.result?.rating ?? null
      } else {
        console.error('Google Places error:', placesData.status)
      }
    } else {
      console.warn('GOOGLE_PLACES_API_KEY assente: follow-up disabilitato per questo run')
    }

    const snapshotPrec = await fetchUltimoSnapshotPrimaDiOggi({
      token: AIRTABLE_TOKEN,
      baseId: AIRTABLE_BASE_ID,
      table: AIRTABLE_RECENSIONI,
      oggi: dataOggi,
    })

    const conteggioFermo =
      googleCountLive != null &&
      snapshotPrec?.count != null &&
      Number(googleCountLive) === Number(snapshotPrec.count)

    console.log('Google count:', {
      live: googleCountLive,
      snapshotPrec: snapshotPrec?.count,
      snapshotData: snapshotPrec?.data,
      conteggioFermo,
    })

    // ── 1) Prima mail: visitatori di ieri ──────────────────────────────
    const clientiIeri = await fetchClientiPerData({
      token: AIRTABLE_TOKEN,
      baseId: AIRTABLE_BASE_ID,
      tablePren: AIRTABLE_TABLE,
      dataYmd: dataIeri,
    })
    console.log('Clienti ieri:', clientiIeri.size)

    let inviatiPrima = 0
    for (const [email, { nome, dataFormattata }] of clientiIeri) {
      try {
        await inviaBrevo({
          apiKey: BREVO_API_KEY,
          emailFrom: EMAIL_FROM,
          toEmail: email,
          toName: nome,
          subject: `Come è andata ${dataFormattata}? 😊`,
          htmlContent: emailHtmlPrima({ nome, dataFormattata, sitoUrl: SITO_URL }),
        })
        inviatiPrima++
        console.log('Prima mail →', email)
      } catch (err) {
        console.error('Errore prima mail a', email, ':', err.message)
      }
    }

    // ── 2) Follow-up: visitatori di 2 giorni fa, solo se conteggio fermo ─
    let inviatiFollowup = 0
    let followupMotivo = 'saltato'
    if (!GOOGLE_PLACES_API_KEY) {
      followupMotivo = 'no_google_api_key'
    } else if (googleCountLive == null) {
      followupMotivo = 'google_count_non_disponibile'
    } else if (snapshotPrec?.count == null) {
      followupMotivo = 'nessuno_snapshot_precedente'
    } else if (!conteggioFermo) {
      followupMotivo = `conteggio_aumentato_${snapshotPrec.count}_to_${googleCountLive}`
    } else {
      followupMotivo = 'conteggio_fermo'
      const clientiDueGiorniFa = await fetchClientiPerData({
        token: AIRTABLE_TOKEN,
        baseId: AIRTABLE_BASE_ID,
        tablePren: AIRTABLE_TABLE,
        dataYmd: dataDueGiorniFa,
      })
      console.log('Clienti 2 giorni fa (follow-up):', clientiDueGiorniFa.size)

      for (const [email, { nome, dataFormattata }] of clientiDueGiorniFa) {
        // Se oggi ricevono già la prima mail (hanno mangiato anche ieri), non raddoppiare
        if (clientiIeri.has(email)) continue
        try {
          await inviaBrevo({
            apiKey: BREVO_API_KEY,
            emailFrom: EMAIL_FROM,
            toEmail: email,
            toName: nome,
            subject: `${nome}, ti va di lasciare una recensione su Google?`,
            htmlContent: emailHtmlFollowup({ nome, dataFormattata }),
          })
          inviatiFollowup++
          console.log('Follow-up →', email)
        } catch (err) {
          console.error('Errore follow-up a', email, ':', err.message)
        }
      }
    }

    // ── 3) Snapshot giornaliero ───────────────────────────────────────
    if (googleCountLive != null) {
      await upsertSnapshotOggi({
        token: AIRTABLE_TOKEN,
        baseId: AIRTABLE_BASE_ID,
        table: AIRTABLE_RECENSIONI,
        oggi: dataOggi,
        count: googleCountLive,
        rating: googleRatingLive,
      })
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sent: inviatiPrima,
        followupSent: inviatiFollowup,
        followupMotivo,
        date: dataIeri,
        followupDate: dataDueGiorniFa,
        googleCount: googleCountLive,
        googleCountPrev: snapshotPrec?.count ?? null,
      }),
    }
  } catch (err) {
    console.error('Error:', err)
    return { statusCode: 500, headers, body: 'Errore server' }
  }
}
