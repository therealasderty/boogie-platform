// netlify/functions/invia-campagna-mail.mjs
// Scheduled function — ogni giorno alle 10:00 (Europe/Rome)
// Invia le email di marketing in coda: max 200 al giorno (risparmio per transazionali).
//
// Schedule (da aggiungere in netlify.toml):
//   [functions.invia-campagna-mail]
//   schedule = "0 8 * * *"   ← 10:00 Europe/Rome = 08:00 UTC in estate
//
// Env vars richieste:
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID
//   BREVO_API_KEY
//   BREVO_SENDER_EMAIL  (default: info@boogiebistrot.com)
//   BREVO_SENDER_NAME   (default: Boogie Bistrot)
//   CRON_SECRET         (opzionale — protezione esecuzione manuale)

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { shell } = require('./_email.js')

const AT_TOKEN    = process.env.AIRTABLE_TOKEN
const AT_BASE     = process.env.AIRTABLE_BASE_ID
const T_CAMP      = 'CampagneMail'
const T_CONT      = 'CampagneMailContatti'
const AT_HEADERS  = { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' }

const BREVO_KEY      = process.env.BREVO_API_KEY
const SENDER_EMAIL   = process.env.BREVO_SENDER_EMAIL || 'info@boogiebistrot.com'
const SENDER_NAME    = process.env.BREVO_SENDER_NAME  || 'Boogie Bistrot'
const MAX_PER_GIORNO = 200

// ── HTML rendering ────────────────────────────────────────────────────────────

const F  = "'Raleway',Arial,sans-serif"
const CG = '#C4913A'
const CD = '#1A1610'
const CB = '#4A4030'

function renderBlocks(blocks = [], nome = '') {
  const sub = s => (s || '').replace(/\{nome\}/gi, nome || 'amico')
  return blocks.map(b => {
    switch (b.type) {
      case 'intestazione':
        return `<h2 style="font-family:${F};font-size:22px;font-weight:600;color:${CD};margin:0 0 20px;text-align:center;">${sub(b.testo)}</h2>`

      case 'testo':
        return `<p style="font-family:${F};font-size:15px;line-height:1.8;color:${CB};margin:0 0 20px;">${sub(b.contenuto).replace(/\n/g, '<br>')}</p>`

      case 'immagine': {
        if (!b.url) return ''
        const img = `<img src="${b.url}" alt="${b.alt || ''}" width="440" style="display:block;width:100%;max-width:440px;border:0;margin:0 auto 20px;">`
        return b.link ? `<a href="${b.link}" style="display:block;text-decoration:none;">${img}</a>` : img
      }

      case 'pulsante': {
        let bg = CG, color = CD, border = ''
        if (b.stile === 'dark')  { bg = CD;       color = 'white' }
        if (b.stile === 'light') { bg = '#F5F0E8'; color = CD; border = ';border:1px solid #D4C9B0' }
        return `<p style="text-align:center;margin:0 0 24px;"><a href="${b.href || '#'}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;padding:12px 28px;font-family:${F};font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px${border};">${b.testo || 'Clicca qui'}</a></p>`
      }

      case 'separatore':
        return `<hr style="border:none;border-top:1px solid #D4C9B0;margin:24px 0;">`

      default:
        return ''
    }
  }).join('\n')
}

function buildHtml(campagna, nome) {
  let blocks = []
  try { blocks = JSON.parse(campagna.template || '[]') } catch {}
  const body = renderBlocks(blocks, nome)
  return shell({ body })
}

// ── Airtable helpers ──────────────────────────────────────────────────────────

function atUrl(table) {
  return `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`
}

async function atPatch(table, id, fields) {
  const res = await fetch(`${atUrl(table)}/${id}`, {
    method:  'PATCH',
    headers: AT_HEADERS,
    body:    JSON.stringify({ fields }),
  })
  if (!res.ok) console.error(`PATCH ${table}/${id} fallito:`, await res.text())
}

// ── Brevo send ────────────────────────────────────────────────────────────────

async function sendBrevo(toEmail, toName, subject, htmlContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      sender:      { email: SENDER_EMAIL, name: SENDER_NAME },
      to:          [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Brevo ${res.status}: ${txt}`)
  }
  return res.json()
}

// ── Main ──────────────────────────────────────────────────────────────────────

export const handler = async () => {
  const oggi = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  console.log(`[invia-campagna-mail] ${oggi} — avvio, max ${MAX_PER_GIORNO} email`)

  try {
    // 1. Leggi contatti DaInviare con DataProgrammata <= oggi, ordina per data
    const params = new URLSearchParams({
      filterByFormula: `{Stato}='DaInviare'`,
      'sort[0][field]':     'DataProgrammata',
      'sort[0][direction]': 'asc',
      maxRecords: String(MAX_PER_GIORNO * 3), // buffer abbondante, filtriamo in JS
    })
    const res  = await fetch(`${atUrl(T_CONT)}?${params}`, { headers: AT_HEADERS })
    if (!res.ok) throw new Error(`Airtable contatti: ${await res.text()}`)
    const json = await res.json()

    const daInviare = (json.records || [])
      .filter(r => (r.fields['DataProgrammata'] || '') <= oggi)
      .slice(0, MAX_PER_GIORNO)

    if (!daInviare.length) {
      console.log('[invia-campagna-mail] Nessuna email da inviare oggi.')
      return { statusCode: 200 }
    }

    console.log(`[invia-campagna-mail] Da inviare: ${daInviare.length}`)

    // 2. Carica campagne necessarie (cache in-memory per evitare richieste duplicate)
    const campagneCache = {}
    const campagneIds = [...new Set(daInviare.map(r => r.fields['CampagnaId']))]
    await Promise.all(campagneIds.map(async (campagnaId) => {
      if (!campagnaId) return
      const res = await fetch(`${atUrl(T_CAMP)}/${campagnaId}`, { headers: AT_HEADERS })
      if (!res.ok) { console.error(`Campagna ${campagnaId} non trovata`); return }
      const data = await res.json()
      campagneCache[campagnaId] = {
        oggettoMail: data.fields['OggettoMail'] || '(nessun oggetto)',
        template:    data.fields['Template']    || '[]',
        titolo:      data.fields['Titolo']      || '',
      }
    }))

    // 3. Invia — sequenziale per non saturare il rate limit Brevo
    let inviati = 0, errori = 0
    const campagneTotaliInviati = {} // campagnaId → contatore

    for (const r of daInviare) {
      const campagnaId = r.fields['CampagnaId']
      const campagna   = campagneCache[campagnaId]
      if (!campagna) {
        await atPatch(T_CONT, r.id, { Stato: 'Errore', ErroreMsg: 'Campagna non trovata' })
        errori++
        continue
      }

      const email  = r.fields['Email'] || ''
      const nome   = r.fields['Nome']  || ''
      const html   = buildHtml(campagna, nome)

      try {
        await sendBrevo(email, nome, campagna.oggettoMail, html)
        await atPatch(T_CONT, r.id, {
          Stato:     'Inviato',
          DataInvio: new Date().toISOString(),
          ErroreMsg: '',
        })
        campagneTotaliInviati[campagnaId] = (campagneTotaliInviati[campagnaId] || 0) + 1
        inviati++
      } catch (e) {
        console.error(`[invia-campagna-mail] Errore invio a ${email}:`, e.message)
        await atPatch(T_CONT, r.id, {
          Stato:     'Errore',
          ErroreMsg: e.message.slice(0, 500),
        })
        errori++
      }

      // Piccola pausa tra un invio e l'altro per evitare burst
      await new Promise(r => setTimeout(r, 150))
    }

    // 4. Aggiorna TotaleInviati sulle campagne coinvolte
    await Promise.all(Object.entries(campagneTotaliInviati).map(([campagnaId, count]) =>
      fetch(`${atUrl(T_CAMP)}/${campagnaId}`, { headers: AT_HEADERS })
        .then(r => r.json())
        .then(data => {
          const attuale = data.fields['TotaleInviati'] || 0
          return atPatch(T_CAMP, campagnaId, { TotaleInviati: attuale + count })
        })
        .catch(e => console.error(`Aggiornamento TotaleInviati campagna ${campagnaId}:`, e.message))
    ))

    console.log(`[invia-campagna-mail] Completato: ${inviati} inviati, ${errori} errori`)
    return { statusCode: 200 }

  } catch (e) {
    console.error('[invia-campagna-mail] Errore fatale:', e)
    return { statusCode: 500 }
  }
}
