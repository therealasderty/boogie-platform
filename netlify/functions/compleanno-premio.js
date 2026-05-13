// netlify/functions/compleanno-premio.js
// Cron giornaliero ore 8:00 — invia email regalo a chi compie gli anni nei prossimi 7 giorni.
// Dedup via attributo Brevo ANNO_ULTIMO_COMPLEANNO (stringa es. "2026") — un invio per anno.
// Trigger manuale: GET ?token=CRON_SECRET[&target_dates=YYYY-MM-DD,YYYY-MM-DD]

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // POST senza token = Netlify Scheduler (autorizzato)
  // GET con token   = trigger manuale
  const CRON_SECRET = process.env.CRON_SECRET;
  const isNetlifyScheduler = event.httpMethod === 'POST';
  if (!isNetlifyScheduler) {
    const tokenRicevuto = (event.queryStringParameters || {}).token;
    if (CRON_SECRET && tokenRicevuto !== CRON_SECRET) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
    }
  }

  const BREVO_API_KEY    = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID    = parseInt(process.env.BREVO_LIST_ID) || 3;
  const EMAIL_FROM       = process.env.EMAIL_FROM;
  const EMAIL_RISTORANTE = process.env.EMAIL_RISTORANTE;

  if (!BREVO_API_KEY || !EMAIL_FROM) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configurazione mancante' }) };
  }

  const brevoHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': BREVO_API_KEY,
  };

  const oggi       = new Date();
  const annoCorrente = String(oggi.getFullYear());
  const targetDatesParam = (event.queryStringParameters || {}).target_dates;

  // ── Costruisci il set MM-DD da controllare ───────────────────────
  // Cron: prossimi 7 giorni (rolling window). Manuale: date specificate.
  const giorniSet = new Set();
  if (targetDatesParam) {
    for (const dateStr of targetDatesParam.split(',').map(s => s.trim()).filter(Boolean)) {
      const d = new Date(dateStr + 'T12:00:00Z');
      if (!isNaN(d.getTime())) {
        giorniSet.add(`${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
      }
    }
  } else {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(oggi);
      d.setDate(oggi.getDate() + i);
      giorniSet.add(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }

  // ── Carica tutti i contatti dalla lista con paginazione ──────────
  let tuttiContatti = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    try {
      const res = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${BREVO_LIST_ID}/contacts?limit=${limit}&offset=${offset}&sort=desc`,
        { headers: brevoHeaders }
      );
      if (!res.ok) {
        console.error('Brevo list error:', res.status, await res.text());
        break;
      }
      const json = await res.json();
      const batch = json.contacts || [];
      tuttiContatti = tuttiContatti.concat(batch);
      if (batch.length < limit) break;
      offset += limit;
    } catch (err) {
      console.error('Errore fetch contatti Brevo:', err);
      break;
    }
  }

  // ── Filtra chi compie gli anni nei prossimi 7 giorni ─────────────
  // Salta chi ha già ricevuto l'email quest'anno (ANNO_ULTIMO_COMPLEANNO === annoCorrente)
  const compleanni = tuttiContatti.filter(c => {
    const dob = c.attributes?.BIRTHDAY ?? c.attributes?.DATE_OF_BIRTH;
    if (!dob) return false;
    let d;
    if (typeof dob === 'number') d = new Date(dob * 1000);
    else d = new Date(String(dob) + 'T12:00:00Z');
    if (isNaN(d.getTime())) return false;
    const mmdd = `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (!giorniSet.has(mmdd)) return false;
    if (c.attributes?.ANNO_ULTIMO_COMPLEANNO === annoCorrente) return false; // già inviato
    return true;
  });

  console.log(`Contatti totali: ${tuttiContatti.length} | Da inviare: ${compleanni.length}`);

  // ── Invia email regalo a ciascuno ────────────────────────────────
  let inviati = 0;
  const errori = [];

  for (const contatto of compleanni) {
    const email = contatto.email;
    const nome  = contatto.attributes?.FIRSTNAME || 'caro ospite';
    const dob   = contatto.attributes?.BIRTHDAY ?? contatto.attributes?.DATE_OF_BIRTH;

    // Calcola data compleanno quest'anno per le date di validità
    let birthdayDate;
    if (typeof dob === 'number') birthdayDate = new Date(dob * 1000);
    else birthdayDate = new Date(String(dob) + 'T12:00:00Z');
    const birthday = new Date(oggi.getFullYear(), birthdayDate.getUTCMonth(), birthdayDate.getUTCDate());
    if (birthday < oggi) birthday.setFullYear(oggi.getFullYear() + 1);
    const fineValidita = new Date(birthday);
    fineValidita.setDate(birthday.getDate() + 6);
    const validitaDal = birthday.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    const validitaAl  = fineValidita.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

    const emailHtml = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot — Un regalo per te</p>
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 8px;font-weight:400;">Il tuo compleanno sta arrivando, ${nome}! 🎂</h1>
          <p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">Ti inviamo in anticipo il tuo regalo per la settimana del compleanno.</p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            In occasione del tuo compleanno vogliamo offrirti un piccolo omaggio:<br>
            <strong>un drink a scelta dalla nostra lista</strong>, tutto per te.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B6F47;">Il tuo regalo</p>
              <p style="margin:0;font-size:16px;color:#1A1610;font-weight:bold;">🥂 Un drink a scelta dalla nostra lista</p>
              <p style="margin:8px 0 0;font-size:12px;color:#8B6F47;line-height:1.6;">Valido nella settimana del tuo compleanno, da <strong>${validitaDal}</strong> a <strong>${validitaAl}</strong>. Mostra questa email al nostro staff al momento dell'arrivo.</p>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Prenota il tuo tavolo su <a href="https://boogiebistrot.com/prenota" style="color:#C4913A;">boogiebistrot.com</a> e vieni a festeggiare con noi.<br>
            Non vediamo l'ora di brindare insieme!
          </p>
          <p style="font-size:13px;color:#8B6F47;line-height:1.6;">Per info: <a href="mailto:${EMAIL_RISTORANTE}" style="color:#C4913A;">${EMAIL_RISTORANTE}</a></p>
          <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            Hai ricevuto questa email perché sei iscritto al programma Fidelity o hai prenotato presso di noi.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
          to: [{ email, name: nome }],
          subject: `🎂 Il tuo compleanno sta arrivando, ${nome}: c'è un drink per te`,
          htmlContent: emailHtml,
        }),
      });
      if (res.ok) {
        inviati++;
        // Marca come inviato quest'anno per evitare duplicati
        fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: brevoHeaders,
          body: JSON.stringify({ attributes: { ANNO_ULTIMO_COMPLEANNO: annoCorrente } }),
        }).catch(err => console.error(`Errore update ANNO_ULTIMO_COMPLEANNO per ${email}:`, err));
      } else {
        const errBody = await res.text();
        console.error(`Errore Brevo per ${email}:`, res.status, errBody);
        errori.push(email);
      }
    } catch (err) {
      console.error(`Errore invio email compleanno a ${email}:`, err);
      errori.push(email);
    }
  }

  const risultato = {
    success: true,
    data: oggi.toISOString().split('T')[0],
    modalita: targetDatesParam ? 'manuale' : 'cron-giornaliero',
    giorniControlloMmdd: [...giorniSet],
    contattiTotali: tuttiContatti.length,
    compleanni: compleanni.length,
    inviati,
    errori,
  };

  console.log('Compleanno premio risultato:', JSON.stringify(risultato));
  return { statusCode: 200, headers, body: JSON.stringify(risultato) };
};
