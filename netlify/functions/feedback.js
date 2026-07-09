// netlify/functions/feedback.js
// Chiamata ogni giorno alle 11:00 da cron-job.org
// Cerca prenotazioni di ieri con stato "Confermata" e manda email feedback

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // Protezione con chiave API per evitare chiamate non autorizzate
  const API_KEY = process.env.FEEDBACK_API_KEY;
  const requestKey = event.headers['x-api-key'] || event.queryStringParameters?.key;
  if (API_KEY && requestKey !== API_KEY) {
    return { statusCode: 401, headers, body: 'Unauthorized' };
  }

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE || 'Prenotazioni';
  const BREVO_API_KEY    = process.env.BREVO_API_KEY;
  const EMAIL_FROM       = process.env.EMAIL_FROM;
  const SITO_URL         = process.env.SITO_URL || 'https://boogiebistrot.com';

  // Calcola la data di ieri
  const ieri = new Date();
  ieri.setDate(ieri.getDate() - 1);
  const dataIeri = ieri.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log('Cerco prenotazioni del:', dataIeri);

  try {
    // ── Fetch prenotazioni di ieri confermate ──────────────────────────
    const filterPren = encodeURIComponent(
      `AND(DATETIME_FORMAT({Data},'YYYY-MM-DD')="${dataIeri}", {Stato}="Confermata")`
    );
    const urlPren = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${filterPren}&fields[]=Nome&fields[]=Email&fields[]=Data&fields[]=Ora`;

    // ── Fetch WiFi clienti con Ultima visita = ieri ────────────────────
    const filterWifi = encodeURIComponent(
      `DATETIME_FORMAT({Ultima visita},'YYYY-MM-DD')="${dataIeri}"`
    );
    const urlWifi = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti?filterByFormula=${filterWifi}&fields[]=Nome&fields[]=Email`;

    const [resPren, resWifi] = await Promise.all([
      fetch(urlPren, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }),
      fetch(urlWifi, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }),
    ]);

    if (!resPren.ok) {
      console.error('Airtable prenotazioni error:', await resPren.text());
      return { statusCode: 500, headers, body: 'Errore Airtable prenotazioni' };
    }

    const jsonPren = await resPren.json();
    const prenotazioni = jsonPren.records || [];
    console.log('Prenotazioni trovate:', prenotazioni.length);

    const jsonWifi = resWifi.ok ? await resWifi.json() : { records: [] };
    const wifiClienti = jsonWifi.records || [];
    console.log('WiFi clienti trovati:', wifiClienti.length);

    // ── Costruisci mappa email → { nome, dataFormattata } ─────────────
    // Le prenotazioni hanno priorità; i WiFi aggiungono chi non ha prenotato
    const clientiMap = new Map(); // email → { nome, dataFormattata }

    const dataFormattataIeri = new Date(dataIeri + 'T12:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    for (const record of prenotazioni) {
      const email = (record.fields['Email'] || '').toLowerCase().trim();
      const nome  = (record.fields['Nome'] || '').split(' ')[0];
      const data  = record.fields['Data'] || '';
      if (!email) continue;
      const dataFormattata = data
        ? new Date(data + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
        : dataFormattataIeri;
      if (!clientiMap.has(email)) {
        clientiMap.set(email, { nome, dataFormattata });
      }
    }

    for (const record of wifiClienti) {
      const email = (record.fields['Email'] || '').toLowerCase().trim();
      const nome  = (record.fields['Nome'] || '').split(' ')[0];
      if (!email) continue;
      if (!clientiMap.has(email)) {
        clientiMap.set(email, { nome, dataFormattata: dataFormattataIeri });
      }
    }

    if (clientiMap.size === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, message: 'Nessun cliente ieri' }) };
    }

    // Deduplica per email — manda una sola mail per cliente anche se ha più prenotazioni
    const emailInviate = new Set();
    let inviati = 0;

    for (const [email, { nome, dataFormattata: data }] of clientiMap) {

      if (emailInviate.has(email)) continue;
      emailInviate.add(email);

      const dataFormattata = data || dataFormattataIeri;

      const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJr9H7A7enhkcRimfhn3EqfVU';
      const TRIPADVISOR_REVIEW_URL = process.env.TRIPADVISOR_REVIEW_URL || 'https://www.tripadvisor.it/UserReviewEdit-g2717697-d17786536-Boogie_Bistrot-Colle_Brianza_Province_of_Lecco_Lombardy.html';

      const giornoIeri = ieri.getDate();
      const isGiornoPari = giornoIeri % 2 === 0;
      const linkPositivo = isGiornoPari ? GOOGLE_REVIEW_URL : TRIPADVISOR_REVIEW_URL;
      const labelPiattaforma = isGiornoPari ? 'su Google' : 'su TripAdvisor';
      const linkNegativo = `${SITO_URL}/feedback?nome=${encodeURIComponent(nome)}&data=${data}`;

      const emailHtml = `
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

          <!-- Pulsanti feedback -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${linkPositivo}" target="_blank"
                   style="display:block;background:#1A1610;color:white;text-decoration:none;padding:14px 16px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border-radius:4px;line-height:1.4;">
                  😊 È stata una bella serata<br>
                  <span style="font-size:11px;font-weight:400;opacity:0.7;letter-spacing:0;">Lascia una recensione ${labelPiattaforma}</span>
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
</html>`;

      try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
            to: [{ email, name: nome }],
            subject: `Come è andata ${dataFormattata}? 😊`,
            htmlContent: emailHtml,
          })
        });
        inviati++;
        console.log('Email inviata a:', email);
      } catch (err) {
        console.error('Errore invio email a', email, ':', err.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sent: inviati, date: dataIeri }),
    };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: 'Errore server' };
  }
};
