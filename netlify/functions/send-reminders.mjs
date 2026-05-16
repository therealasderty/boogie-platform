// netlify/functions/send-reminders.mjs
// Scheduled function — ogni mattina alle 09:30
// Recupera prenotazioni Confermata per oggi e invia email reminder con link cancellazione.
// Configura in netlify.toml:
//   [functions.send-reminders]
//   schedule = "30 9 * * *"

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE || 'Prenotazioni'
const BREVO_API_KEY    = process.env.BREVO_API_KEY
const EMAIL_FROM       = process.env.EMAIL_FROM
const SITO_URL         = process.env.SITO_URL || 'https://boogiebistrot.com'
const NETLIFY_URL      = process.env.NETLIFY_URL || 'https://shimmering-sundae-54b044.netlify.app'

export default async () => {
  const oggi = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // ── 1. Recupera prenotazioni confermate per oggi ─────────────────
  const formula = encodeURIComponent(`AND({Stato}='Confermata',DATETIME_FORMAT({Data},'YYYY-MM-DD')='${oggi}')`)
  let records = []
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?filterByFormula=${formula}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    )
    if (!res.ok) {
      console.error('Airtable error:', res.status, await res.text())
      return
    }
    const json = await res.json()
    records = json.records || []
  } catch (err) {
    console.error('Errore fetch Airtable:', err)
    return
  }

  console.log(`Reminder: trovate ${records.length} prenotazioni confermate per ${oggi}`)
  if (records.length === 0) return

  // ── 2. Invia reminder a ciascun cliente ──────────────────────────
  const brevoHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'api-key': BREVO_API_KEY,
  }

  let inviati = 0
  const errori = []

  for (const record of records) {
    const f     = record.fields
    const nome  = f['Nome']  || ''
    const email = f['Email'] || ''
    const ora   = f['Ora']   || ''
    if (!email) continue

    // Logica saluto: < 15:00 → "A dopo", >= 15:00 → "A stasera"
    const oraNum = parseInt((ora.split(':')[0]) || '0', 10)
    const saluto = oraNum < 15 ? 'A dopo' : 'A stasera'

    // Link cancellazione pubblico (GET, no JWT)
    const cancelLink = `${NETLIFY_URL}/.netlify/functions/cancella-prenotazione?id=${record.id}`

    try {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
          to: [{ email, name: nome }],
          subject: 'Ci vediamo dopo al Boogie? 🍷',
          htmlContent: buildReminderHtml({ nome, ora, cancelLink, saluto }),
        }),
      })
      if (r.ok) {
        inviati++
        console.log(`Reminder inviato a ${email} (ore ${ora}, saluto: ${saluto})`)
      } else {
        console.error(`Errore Brevo per ${email}:`, r.status, await r.text())
        errori.push(email)
      }
    } catch (err) {
      console.error(`Errore invio reminder a ${email}:`, err)
      errori.push(email)
    }
  }

  console.log(`Reminder completati: ${inviati} inviati, ${errori.length} errori`)
}

function buildReminderHtml({ nome, ora, cancelLink, saluto }) {
  // Usa solo il primo nome per il tono più informale
  const primoNome = nome.split(' ')[0] || nome
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Raleway',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
        <tr><td style="padding:40px 40px 20px;">
          <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 20px;border:0;">
          <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;line-height:1.3;">Ti aspettiamo oggi alle ${ora} 🍷</h1>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Ciao <strong>${primoNome}</strong>,<br>
            ti scriviamo per il tuo tavolo di oggi alle <strong>${ora}</strong>.
          </p>
          <p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">
            Se hai avuto un imprevisto e non riesci più a passare, nessun problema, ma per favore faccelo sapere cliccando qui sotto: ci aiuti a liberare il posto per chi è in lista d'attesa.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:36px;">
            <tr><td align="center">
              <a href="${cancelLink}"
                 style="display:inline-block;background:#eece9d;color:#1A1610;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">
                Non riesco a venire
              </a>
            </td></tr>
          </table>
          <p style="font-size:16px;color:#4A4030;line-height:1.7;margin:0 0 4px;font-weight:500;">${saluto}!</p>
          <p style="font-size:15px;color:#8B6F47;line-height:1.6;margin:0;">Alessandra &amp; Chiara</p>
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;">
          <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">
            Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>
            Hai ricevuto questa email perché hai una prenotazione confermata per oggi.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
