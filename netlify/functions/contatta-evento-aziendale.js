// netlify/functions/contatta-evento-aziendale.js

function normalizePhoneForBrevo(raw) {
  const input = String(raw || '').trim()
  if (!input) return null

  let cleaned = input.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('00')) cleaned = `+${cleaned.slice(2)}`
  if (!cleaned.startsWith('+')) {
    cleaned = cleaned.startsWith('0') ? `+39${cleaned.slice(1)}` : `+39${cleaned}`
  }

  if (!/^\+\d{8,15}$/.test(cleaned)) return null
  return cleaned
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: 'Method Not Allowed' }

  const BREVO_API_KEY    = process.env.BREVO_API_KEY
  const EMAIL_RISTORANTE = process.env.EMAIL_RISTORANTE
  const EMAIL_FROM       = process.env.EMAIL_FROM
  const BREVO_LIST_ID    = parseInt(process.env.BREVO_LIST_ID) || 3
  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

  let data
  try {
    data = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers, body: 'Invalid JSON' }
  }

  const {
    nome,
    cognome,
    email,
    telefono,
    data_evento,
    num_ospiti,
    tipo_evento,
    note,
    consenso_privacy,
    consenso_marketing,
  } = data

  if (!nome || !email || !num_ospiti || !consenso_privacy) {
    return { statusCode: 400, headers, body: 'Campi obbligatori mancanti' }
  }

  const brevoHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': BREVO_API_KEY,
  }

  // ── Salva richiesta su Airtable ─────────────────────────────────
  try {
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/RichiesteEventi`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{
            fields: {
              Nome:               nome,
              Cognome:            cognome || '',
              Email:              email,
              Telefono:           telefono || '',
              TipoEvento:         tipo_evento || '',
              NumOspiti:          num_ospiti ? parseInt(num_ospiti) : null,
              DataEvento:         data_evento || '',
              Note:               note || '',
              ConsensoMarketing:  consenso_marketing ? true : false,
              DataRichiesta:      new Date().toISOString(),
            },
          }],
        }),
      }
    )
  } catch (err) {
    console.error('Airtable save error:', err)
  }

  // ── Salva/aggiorna contatto su Brevo ────────────────────────────
  try {
    const normalizedPhone = normalizePhoneForBrevo(telefono)
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: nome,
          LASTNAME: cognome || '',
          ...(normalizedPhone ? { SMS: normalizedPhone } : {}),
          CONSENSO_MARKETING: consenso_marketing ? true : false,
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    })
  } catch (err) {
    console.error('Brevo contact error:', err)
  }

  // ── Email di conferma all'utente ─────────────────────────────────
  const emailUtenteHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot</p>
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;">Richiesta ricevuta ✓</h1>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ciao <strong>${nome}</strong>,<br>
            abbiamo ricevuto la tua richiesta per un evento aziendale e ti risponderemo al più presto per definire insieme tutti i dettagli.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              ${tipo_evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Tipo evento</span><strong style="color:#1A1610;">${tipo_evento}</strong></p>` : ''}
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Numero ospiti</span><strong style="color:#1A1610;">${num_ospiti}</strong></p>
              ${data_evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data / periodo</span><strong style="color:#1A1610;">${data_evento}</strong></p>` : ''}
              ${note ? `<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Note</span><span style="color:#1A1610;line-height:1.7;">${note}</span></p>` : ''}
            </td></tr>
          </table>
          <p style="font-size:13px;color:#8B6F47;line-height:1.6;">Per urgenze puoi scriverci a <a href="mailto:${EMAIL_RISTORANTE}" style="color:#C4913A;">${EMAIL_RISTORANTE}</a>.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  // ── Email di notifica al ristorante ──────────────────────────────
  const emailNotificaHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot — Gestionale</p>
          <h1 style="font-size:22px;color:#1A1610;margin:0 0 6px;font-weight:400;">🏢 Nuova richiesta evento aziendale</h1>
          <p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">Ricevuta il ${new Date().toLocaleString('it-IT')}</p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Nome</span><strong style="color:#1A1610;">${nome}${cognome ? ' ' + cognome : ''}</strong></p>
              <p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Email</span><strong style="color:#1A1610;">${email}</strong></p>
              ${telefono ? `<p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Telefono</span><strong style="color:#1A1610;">${telefono}</strong></p>` : ''}
              <p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Numero ospiti</span><strong style="color:#1A1610;">${num_ospiti}</strong></p>
              ${tipo_evento ? `<p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Tipo evento</span><strong style="color:#1A1610;">${tipo_evento}</strong></p>` : ''}
              ${data_evento ? `<p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data / periodo</span><strong style="color:#1A1610;">${data_evento}</strong></p>` : ''}
              ${note ? `<p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Note / richieste</span><span style="color:#1A1610;line-height:1.7;">${note}</span></p>` : ''}
              <p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Consenso marketing</span><strong style="color:${consenso_marketing ? '#2E7D32' : '#999'};">${consenso_marketing ? '✓ Sì' : '✗ No'}</strong></p>
            </td></tr>
          </table>
          <a href="mailto:${email}" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 28px;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.05em;">✉ Rispondi a ${nome}</a>
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">Boogie Bistrot — Sistema messaggi automatico</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await Promise.all([
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
          to: [{ email, name: nome }],
          subject: 'Abbiamo ricevuto la tua richiesta — Boogie Bistrot',
          htmlContent: emailUtenteHtml,
        }),
      }),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          sender: { name: 'Sito Boogie Bistrot', email: EMAIL_FROM },
          to: [{ email: EMAIL_RISTORANTE }],
          replyTo: { email, name: nome },
          subject: `🏢 Evento aziendale — ${nome}${cognome ? ' ' + cognome : ''} (${num_ospiti} ospiti)`,
          htmlContent: emailNotificaHtml,
        }),
      }),
    ])
  } catch (err) {
    console.error('Brevo error:', err)
    return { statusCode: 500, headers, body: 'Errore invio email' }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
}
