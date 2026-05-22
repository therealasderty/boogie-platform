// netlify/functions/prenota.js

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase().replace(/,/g, '.');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhoneForBrevo(raw) {
  const input = String(raw || '').trim();
  if (!input) return null;

  let cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = `+${cleaned.slice(2)}`;
  if (!cleaned.startsWith('+')) {
    cleaned = cleaned.startsWith('0') ? `+39${cleaned.slice(1)}` : `+39${cleaned}`;
  }

  if (!/^\+\d{8,15}$/.test(cleaned)) return null;
  return cleaned;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE || 'Prenotazioni';
  const BREVO_API_KEY    = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID    = parseInt(process.env.BREVO_LIST_ID) || 3;
  const EMAIL_RISTORANTE = process.env.EMAIL_RISTORANTE;
  const EMAIL_FROM       = process.env.EMAIL_FROM;
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const SITO_URL         = process.env.SITO_URL || 'https://boogiebistrot.com';
  const NETLIFY_URL      = process.env.NETLIFY_URL || 'https://shimmering-sundae-54b044.netlify.app';
  const BREVO_DEBUG_LOGS = process.env.BREVO_DEBUG_LOGS === '1';

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: 'Invalid JSON' };
  }

  // ── 0. Leggi configurazione conferma manuale ─────────────────────
  let confermaManualeDays = new Set();
  try {
    const configRes = await fetch(`${NETLIFY_URL}/.netlify/functions/get-configurazione`);
    if (configRes.ok) {
      const configJson = await configRes.json();
      const val = configJson.config?.conferma_manuale_giorni ?? '';
      if (val) val.split(',').forEach(d => { const n = parseInt(d.trim()); if (!isNaN(n)) confermaManualeDays.add(n); });
    }
  } catch (err) {
    console.error('Errore lettura configurazione:', err);
  }

  const { nome, cognome, data: dataPrenotazione, ora, persone, email: emailRaw, telefono, note, preferenza, evento, data_nascita, consenso_privacy, consenso_marketing } = data;
  const email = normalizeEmail(emailRaw);

  if (!nome || !dataPrenotazione || !ora || !persone || !email || !telefono || !consenso_privacy) {
    return { statusCode: 400, headers, body: 'Campi obbligatori mancanti' };
  }

  if (!isValidEmail(email)) {
    return { statusCode: 400, headers, body: 'Indirizzo email non valido' };
  }

  const nomeCompleto = cognome ? nome + ' ' + cognome : nome;

  const dataFormattata = new Date(dataPrenotazione + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Determina se questa prenotazione richiede conferma manuale
  const giornoSettimana = new Date(dataPrenotazione + 'T12:00:00').getDay();
  const richiedeConferma = confermaManualeDays.has(giornoSettimana);

  // ── 1. Salva su Airtable Prenotazioni ────────────────────────────
  let recordId;
  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          'Nome':               nomeCompleto,
          'Data':               dataPrenotazione,
          'Ora':                ora,
          'Persone':            parseInt(persone),
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
          'Stato':              richiedeConferma ? 'In attesa' : 'Confermata',
        }
      })
    });

    if (!airtableRes.ok) {
      console.error('Airtable error:', await airtableRes.text());
      return { statusCode: 500, headers, body: 'Errore salvataggio prenotazione' };
    }

    const airtableData = await airtableRes.json();
    recordId = airtableData.id;
  } catch (err) {
    console.error('Airtable fetch error:', err);
    return { statusCode: 500, headers, body: 'Errore connessione Airtable' };
  }

  // ── 2. Aggiungi/aggiorna contatto su Brevo ──────────────────────
  try {
    const normalizedPhone = normalizePhoneForBrevo(telefono);
    const brevoPayload = {
      email,
      attributes: {
        FIRSTNAME: nome,
        LASTNAME: cognome || '',
        ...(normalizedPhone ? { SMS: normalizedPhone } : {}),
        BIRTHDAY: data_nascita || undefined,
        CONSENSO_MARKETING: consenso_marketing ? true : false,
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    };

    if (BREVO_DEBUG_LOGS) {
      console.log('[Brevo] upsert contact (prenota-fn):', {
        email,
        normalizedPhone,
        attributes: brevoPayload.attributes,
        listIds: brevoPayload.listIds,
      });
    }

    const brevoContactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify(brevoPayload)
    });
    const brevoContactText = await brevoContactRes.text().catch(() => '');
    if (BREVO_DEBUG_LOGS || !brevoContactRes.ok) {
      console.log('[Brevo] response (prenota-fn):', { status: brevoContactRes.status, ok: brevoContactRes.ok, body: brevoContactText });
    }
  } catch (err) {
    console.error('Brevo contact error:', err);
  }

  // ── 3. Notifica Telegram ─────────────────────────────────────────
  const preferenzaEmoji = preferenza === 'Pizza' ? '🍕' : preferenza === 'Cucina' ? '🍽️' : '';

  try {
    const testo = richiedeConferma
      ? `⏳ *Nuova richiesta di prenotazione (da confermare)*\n\n` +
        (evento ? `🎉 *Evento:* ${evento}\n` : '') +
        `👤 *Nome:* ${nomeCompleto}\n` +
        `📅 *Data:* ${dataFormattata}\n` +
        `🕐 *Ora:* ${ora}\n` +
        `👥 *Persone:* ${persone}\n` +
        (preferenza ? `${preferenzaEmoji} *Preferenza:* ${preferenza}\n` : '') +
        `📞 *Telefono:* ${telefono}\n` +
        `📧 *Email:* ${email}` +
        (note ? `\n📝 *Note:* ${note}` : '') +
        `\n\n👉 Conferma dal dashboard o dall'email ricevuta`
      : `✅ *Nuova prenotazione confermata!*\n\n` +
        (evento ? `🎉 *Evento:* ${evento}\n` : '') +
        `👤 *Nome:* ${nomeCompleto}\n` +
        `📅 *Data:* ${dataFormattata}\n` +
        `🕐 *Ora:* ${ora}\n` +
        `👥 *Persone:* ${persone}\n` +
        (preferenza ? `${preferenzaEmoji} *Preferenza:* ${preferenza}\n` : '') +
        `📞 *Telefono:* ${telefono}\n` +
        `📧 *Email:* ${email}` +
        (note ? `\n📝 *Note:* ${note}` : '');

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: testo, parse_mode: 'Markdown' })
    });
  } catch (err) {
    console.error('Telegram error:', err);
  }

  // ── 4. Link calendario (per email cliente) ───────────────────────
  let googleCalLink = '';
  const icsLink = `${NETLIFY_URL}/.netlify/functions/ics?data=${dataPrenotazione}&ora=${encodeURIComponent(ora)}&nome=${encodeURIComponent(nome)}&persone=${persone}`;

  if (dataPrenotazione && ora) {
    const [anno, mese, giorno] = dataPrenotazione.split('-');
    const [ore, minuti] = ora.split(':');
    const dtStart = `${anno}${mese}${giorno}T${ore}${minuti}00`;
    const oraFine = parseInt(ore) + 2;
    const dtEnd = `${anno}${mese}${giorno}T${String(oraFine).padStart(2, '0')}${minuti}00`;
    const titoloCalendar = encodeURIComponent('Cena al Boogie Bistrot');
    const luogo    = encodeURIComponent('Via Europa 2, 23886 Colle Brianza LC');
    const dettagli = encodeURIComponent(`Prenotazione per ${persone} ${parseInt(persone) === 1 ? 'persona' : 'persone'} alle ${ora}.${preferenza ? ' Preferenza: ' + preferenza : ''}`);
    googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titoloCalendar}&dates=${dtStart}/${dtEnd}&location=${luogo}&details=${dettagli}&ctz=Europe/Rome`;
  }

  // ── 5a. Email cliente — richiesta ricevuta (se richiede conferma) ─
  const emailAttesaHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Raleway',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 20px;border:0;">
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 8px;font-weight:400;">Richiesta ricevuta! 📩</h1>
          <p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">Ti confermeremo la disponibilità a breve.</p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ciao <strong>${nome}</strong>,<br>
            abbiamo ricevuto la tua richiesta di prenotazione. Nei prossimi minuti riceverai una conferma via email non appena avremo verificato la disponibilità.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              ${evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Evento</span><strong>${evento}</strong></p>` : ''}
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data richiesta</span><strong>${dataFormattata}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ora</span><strong>${ora}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ospiti</span><strong>${persone} ${parseInt(persone) === 1 ? 'persona' : 'persone'}</strong></p>
              ${preferenza ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Preferenza</span><strong>${preferenza}</strong></p>` : ''}
              ${note ? `<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Note</span><strong>${note}</strong></p>` : ''}
            </td></tr>
          </table>
          <p style="font-size:13px;color:#8B6F47;line-height:1.6;margin:0 0 8px;">
            Per informazioni scrivici a <a href="mailto:${EMAIL_RISTORANTE}" style="color:#C4913A;">${EMAIL_RISTORANTE}</a>.
          </p>
          <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── 5b. Email cliente — conferma immediata ────────────────────────
  const emailUtenteHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Raleway',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 20px;border:0;">
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 8px;font-weight:400;">Prenotazione confermata! 🎉</h1>
          <p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">Il tuo tavolo è riservato.</p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ciao <strong>${nome}</strong>,<br>
            siamo lieti di confermarti la prenotazione. Non vediamo l'ora di accoglierti!
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              ${evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Evento</span><strong>${evento}</strong></p>` : ''}
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data</span><strong>${dataFormattata}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ora</span><strong>${ora}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ospiti</span><strong>${persone} ${parseInt(persone) === 1 ? 'persona' : 'persone'}</strong></p>
              ${preferenza ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Preferenza</span><strong>${preferenza}</strong></p>` : ''}
              ${note ? `<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Note</span><strong>${note}</strong></p>` : ''}
            </td></tr>
          </table>
          <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Aggiungi al calendario</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding-right:10px;">
                <a href="${googleCalLink}" target="_blank" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">📅 Google Calendar</a>
              </td>
              <td>
                <a href="${icsLink}" style="display:inline-block;background:#F5F0E8;color:#1A1610;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;border:1px solid #D4C9B0;">🍎 Apple Calendar</a>
              </td>
            </tr>
          </table>
          <p style="font-size:13px;color:#8B6F47;line-height:1.6;margin:0 0 8px;">
            Per modifiche o disdette scrivici a <a href="mailto:${EMAIL_RISTORANTE}" style="color:#C4913A;">${EMAIL_RISTORANTE}</a>.
          </p>
          <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            ${consenso_marketing ? `Sei iscritto alla nostra newsletter. Per cancellare l'iscrizione scrivi a ${EMAIL_RISTORANTE}` : ''}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── 6. Email notifica ristorante ─────────────────────────────────
  const confermaLink = `${SITO_URL}/conferma-prenotazione?id=${recordId}`;
  const emailNotificaHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Raleway',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid ${richiedeConferma ? '#E67E22' : '#C4913A'};">
        <tr><td style="padding:40px 40px 20px;">
          <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 8px;border:0;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Gestionale</p>
          <h1 style="font-size:22px;color:#1A1610;margin:0 0 6px;font-weight:400;">${richiedeConferma ? '⏳ Nuova richiesta da confermare' : '✅ Nuova prenotazione confermata'}</h1>
          <p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">Ricevuta il ${new Date().toLocaleString('it-IT')}</p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              ${evento ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Evento</span><strong>🎉 ${evento}</strong></p>` : ''}
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Nome</span><strong>${nomeCompleto}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Data</span><strong>${dataFormattata}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Ora</span><strong>${ora}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Persone</span><strong>${persone}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Email</span><strong>${email}</strong></p>
              <p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Telefono</span><strong>${telefono}</strong></p>
              ${preferenza ? `<p style="margin:0 0 10px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Preferenza</span><strong>${preferenza}</strong></p>` : ''}
              ${note ? `<p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Note</span><strong>${note}</strong></p>` : ''}
            </td></tr>
          </table>
          ${richiedeConferma ? `
          <p style="font-size:14px;color:#4A4030;line-height:1.6;margin:0 0 16px;">
            Clicca il bottone per confermare la prenotazione e inviare l'email al cliente. Puoi aggiungere un messaggio personalizzato.
          </p>
          <a href="${confermaLink}" target="_blank" style="display:inline-block;background:#C4913A;color:white;text-decoration:none;padding:14px 28px;font-family:'Raleway',Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.05em;border-radius:4px;margin-bottom:24px;">✅ Conferma prenotazione</a>
          ` : ''}
        </td></tr>
        <tr><td style="padding:16px 40px 24px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;">Boogie Bistrot — Sistema prenotazioni automatico</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const brevoHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY };

  try {
    const resUtente = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: brevoHeaders,
      body: JSON.stringify({
        sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
        to: [{ email, name: nomeCompleto }],
        subject: richiedeConferma
          ? evento
            ? `Richiesta ricevuta — ${evento} · ${dataFormattata} ore ${ora}`
            : `Richiesta ricevuta — ${dataFormattata} ore ${ora}`
          : evento
            ? `Prenotazione confermata! — ${evento} · ${dataFormattata} ore ${ora}`
            : `Prenotazione confermata! — ${dataFormattata} ore ${ora}`,
        htmlContent: richiedeConferma ? emailAttesaHtml : emailUtenteHtml,
      })
    });
    const resUtenteBody = await resUtente.json();
    console.log('Brevo utente status:', resUtente.status, JSON.stringify(resUtenteBody));

    const resRistorante = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: brevoHeaders,
      body: JSON.stringify({
        sender: { name: 'Sistema Prenotazioni', email: EMAIL_FROM },
        to: [{ email: EMAIL_RISTORANTE }],
        subject: richiedeConferma
          ? evento
            ? `⏳ ${evento} — ${nomeCompleto} · ${dataFormattata} ore ${ora} (${persone} pers.)`
            : `⏳ Da confermare: ${nomeCompleto} — ${dataFormattata} ore ${ora} (${persone} pers.)`
          : evento
            ? `🎉 ${evento} — ${nomeCompleto} · ${dataFormattata} ore ${ora} (${persone} pers.)`
            : `✅ Nuova prenotazione: ${nomeCompleto} — ${dataFormattata} ore ${ora} (${persone} pers.)`,
        htmlContent: emailNotificaHtml,
      })
    });
    const resRistoranteBody = await resRistorante.json();
    console.log('Brevo ristorante status:', resRistorante.status, JSON.stringify(resRistoranteBody));
  } catch (err) {
    console.error('Brevo error:', err);
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
