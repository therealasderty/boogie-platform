// netlify/functions/cancella-prenotazione.js
//
// GET  ?id=RECORD_ID  — pubblico, usato dal link nell'email reminder
//   → aggiorna Airtable, invia email conferma cancellazione, notifica Telegram
//   → redirect 302 a /prenota/cancellata
//
// POST { id }         — autenticato (JWT), usato dalla dashboard

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE || 'Prenotazioni';
const BREVO_API_KEY    = process.env.BREVO_API_KEY;
const EMAIL_FROM       = process.env.EMAIL_FROM;
const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITO_URL         = process.env.SITO_URL || 'https://boogiebistrot.com';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // ── GET: link pubblico da email reminder ────────────────────────
  if (event.httpMethod === 'GET') {
    const { id } = event.queryStringParameters || {};
    if (!id) return redirect(`${SITO_URL}/prenota/cancellata`);

    // Recupera il record per avere nome, email, ora
    let record;
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${id}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      );
      if (!res.ok) return redirect(`${SITO_URL}/prenota/cancellata`);
      record = await res.json();
    } catch {
      return redirect(`${SITO_URL}/prenota/cancellata`);
    }

    const f = record.fields;

    // Idempotente: se già cancellata redirect direttamente
    if (f['Stato'] === 'Cancellata') {
      return redirect(`${SITO_URL}/prenota/cancellata`);
    }

    // Aggiorna Airtable → Cancellata
    try {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { Stato: 'Cancellata' } }),
        }
      );
    } catch (err) {
      console.error('Airtable PATCH error:', err);
    }

    const nome  = f['Nome']  || '';
    const email = f['Email'] || '';
    const ora   = f['Ora']   || '';

    // Notifica Telegram
    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const testo = `🔴 Prenotazione annullata — *${nome}* per le ${ora} (Oggi)`;
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: testo, parse_mode: 'Markdown' }),
        });
      } catch (err) {
        console.error('Telegram error:', err);
      }
    }

    // Email conferma cancellazione al cliente
    if (email && BREVO_API_KEY) {
      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
          body: JSON.stringify({
            sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
            to: [{ email, name: nome }],
            subject: 'Prenotazione annullata.',
            htmlContent: buildCancelHtml({ nome }),
          }),
        });
      } catch (err) {
        console.error('Brevo error:', err);
      }
    }

    return redirect(`${SITO_URL}/prenota/cancellata`);
  }

  // ── POST: chiamata autenticata dalla dashboard ──────────────────
  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  let data;
  try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { id } = data;
  if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID mancante' }) };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${id}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Stato: 'Cancellata' } }),
      }
    );
    if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};

// ── Helpers ─────────────────────────────────────────────────────────

function redirect(url) {
  return { statusCode: 302, headers: { ...headers, Location: url }, body: '' };
}

function buildCancelHtml({ nome }) {
  const primoNome = nome.split(' ')[0] || nome;
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Raleway',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 20px;border:0;">
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;">Prenotazione annullata.</h1>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ciao <strong>${primoNome}</strong>,<br>
            grazie per averci avvisato, abbiamo annullato il tuo tavolo per oggi.
          </p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ci spiace non averti qui, ma speriamo di recuperare presto.
          </p>
          <p style="font-size:15px;color:#8B6F47;line-height:1.6;margin:0;">Buona giornata,<br><span style="color:#4A4030;font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            Puoi prenotare di nuovo su <a href="https://boogiebistrot.com/prenota" style="color:#C4913A;">boogiebistrot.com/prenota</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
