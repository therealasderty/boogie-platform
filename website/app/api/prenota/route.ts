import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE   || 'Prenotazioni'
const BREVO_API_KEY    = process.env.BREVO_API_KEY
const BREVO_LIST_ID    = parseInt(process.env.BREVO_LIST_ID || '3')
const EMAIL_RISTORANTE = process.env.EMAIL_RISTORANTE
const EMAIL_FROM       = process.env.EMAIL_FROM
const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const SITO_URL         = process.env.SITO_URL || 'https://boogiebistrot.com'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ success: false }, { status: 400 }) }

  const { nome, cognome, data, ora, persone, email, telefono, note, preferenza, evento,
          data_nascita, consenso_privacy, consenso_marketing } = body as Record<string, unknown>

  if (!nome || !data || !ora || !persone || !email || !telefono || !consenso_privacy) {
    return NextResponse.json({ success: false, error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const nomeCompleto = cognome ? `${nome} ${cognome}` : String(nome)
  const dataFormattata = new Date(String(data) + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── 1. Salva su Airtable ─────────────────────────────────────────
  let recordId: string | undefined
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Nome':               nomeCompleto,
            'Data':               data,
            'Ora':                ora,
            'Persone':            parseInt(String(persone)),
            'Email':              email,
            'Telefono':           telefono,
            'Note':               note || '',
            'Preferenza':         preferenza || '',
            'Evento':             evento || '',
            'Canale':             'Sito web',
            'Data Nascita':       data_nascita || '',
            'Consenso Privacy':   consenso_privacy,
            'Consenso Marketing': consenso_marketing,
            'Timestamp':          new Date().toISOString(),
            'Stato':              'In attesa',
          },
        }),
      }
    )
    if (!res.ok) {
      console.error('Airtable error:', await res.text())
      return NextResponse.json({ success: false, error: 'Errore salvataggio' }, { status: 500 })
    }
    recordId = (await res.json()).id
  } catch (err) {
    console.error('Airtable fetch error:', err)
    return NextResponse.json({ success: false, error: 'Errore connessione' }, { status: 500 })
  }

  const linkConferma = `${SITO_URL}/conferma-prenotazione?id=${recordId}`

  // ── 2. Telegram ──────────────────────────────────────────────────
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    const testo =
      `🔔 *Nuova richiesta di prenotazione!*\n\n` +
      (evento ? `🎉 *Evento:* ${evento}\n` : '') +
      `👤 *Nome:* ${nomeCompleto}\n` +
      `📅 *Data:* ${dataFormattata}\n` +
      `🕐 *Ora:* ${ora}\n` +
      `👥 *Persone:* ${persone}\n` +
      `📞 *Telefono:* ${telefono}\n` +
      `📧 *Email:* ${email}` +
      (note ? `\n📝 *Note:* ${note}` : '') +
      `\n\n✅ [Conferma prenotazione](${linkConferma})`
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: testo, parse_mode: 'Markdown' }),
    }).catch(e => console.error('Telegram error:', e))
  }

  // ── 3. Brevo contatto ────────────────────────────────────────────
  if (BREVO_API_KEY) {
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: nome, LASTNAME: cognome || '', SMS: telefono || '', CONSENSO_MARKETING: !!consenso_marketing, ...(data_nascita ? { DATE_OF_BIRTH: data_nascita } : {}) },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    }).catch(e => console.error('Brevo contact error:', e))
  }

  // ── 4. Email utente ──────────────────────────────────────────────
  if (BREVO_API_KEY && EMAIL_FROM) {
    const htmlUtente = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
<tr><td style="padding:40px 40px 20px;">
<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot${evento ? ' · ' + evento : ''}</p>
<h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;">Richiesta ricevuta ✓</h1>
<p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">Ciao <strong>${nome}</strong>,<br>abbiamo ricevuto la tua richiesta. Riceverai entro pochi minuti una <strong>conferma definitiva</strong>.</p>
<table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;"><tr><td style="padding:20px 24px;">
${evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Evento</span><strong>${evento}</strong></p>` : ''}
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data</span><strong>${dataFormattata}</strong></p>
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ora</span><strong>${ora}</strong></p>
<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ospiti</span><strong>${persone} ${parseInt(String(persone)) === 1 ? 'persona' : 'persone'}</strong></p>
</td></tr></table>
<p style="font-size:13px;color:#8B6F47;">Per informazioni: <a href="mailto:${EMAIL_RISTORANTE}" style="color:#C4913A;">${EMAIL_RISTORANTE}</a></p>
</td></tr></table></td></tr></table></body></html>`

    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
        to: [{ email, name: nomeCompleto }],
        subject: evento
          ? `Richiesta ricevuta — ${evento} · ${dataFormattata} ore ${ora}`
          : `Richiesta di prenotazione ricevuta — ${dataFormattata} ore ${ora}`,
        htmlContent: htmlUtente,
      }),
    }).catch(e => console.error('Brevo email error:', e))

    // Notifica ristorante
    if (EMAIL_RISTORANTE) {
      const htmlRist = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
<tr><td style="padding:40px 40px 20px;">
<h1 style="font-size:22px;color:#1A1610;margin:0 0 6px;font-weight:400;">🔔 Nuova richiesta di prenotazione</h1>
<table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin:20px 0;"><tr><td style="padding:20px 24px;">
${evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Evento</span><strong>🎉 ${evento}</strong></p>` : ''}
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Nome</span><strong>${nomeCompleto}</strong></p>
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data</span><strong>${dataFormattata}</strong></p>
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ora</span><strong>${ora}</strong></p>
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Persone</span><strong>${persone}</strong></p>
<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Email</span><strong>${email}</strong></p>
<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Telefono</span><strong>${telefono}</strong></p>
</td></tr></table>
<a href="${linkConferma}" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:bold;">✓ CONFERMA PRENOTAZIONE</a>
</td></tr></table></td></tr></table></body></html>`

      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: 'Sistema Prenotazioni', email: EMAIL_FROM },
          to: [{ email: EMAIL_RISTORANTE }],
          subject: evento
            ? `🎉 ${evento} — ${nomeCompleto} · ${dataFormattata} ore ${ora} (${persone} pers.)`
            : `🔔 Nuova richiesta: ${nomeCompleto} — ${dataFormattata} ore ${ora} (${persone} pers.)`,
          htmlContent: htmlRist,
        }),
      }).catch(e => console.error('Brevo ristorante error:', e))
    }
  }

  return NextResponse.json({ success: true })
}
