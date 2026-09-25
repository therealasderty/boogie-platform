// netlify/functions/invia-campagna-mail.mjs
// Funzione HTTP (chiamabile dal dashboard) — invio lotto campagne.
// Il cron giornaliero è in `cron-invia-campagna-mail.js` (schedule separato:
// le scheduled function Netlify NON accettano HTTP in produzione).
//
// Env vars richieste:
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID
//   BREVO_API_KEY
//   BREVO_SENDER_EMAIL  (default: info@boogiebistrot.com)
//   BREVO_SENDER_NAME   (default: Boogie Bistrot)

import { createRequire } from 'module'

// verifyToken è CJS: caricalo in modo resilient (import.meta può mancare se bundlato male)
function loadVerifyToken() {
  try {
    const req = createRequire(typeof import.meta?.url === 'string' ? import.meta.url : process.cwd() + '/package.json')
    return req('./verifyToken')
  } catch (e) {
    console.warn('[invia-campagna-mail] verifyToken load fail:', e.message)
    return null
  }
}

/** Shell minima per template non-marketing (evita require di _email.js). */
function shell({ body = '' } = {}) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;background:${CBG};font-family:${F};">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid ${CG};">
<tr><td style="padding:40px 40px 20px;font-family:${F};">${body}</td></tr>
<tr><td style="padding:16px 40px 32px;border-top:1px solid ${CLINE};font-size:11px;color:#B0A898;">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</td></tr>
</table></td></tr></table></body></html>`
}

const AT_TOKEN    = process.env.AIRTABLE_TOKEN
const AT_BASE     = process.env.AIRTABLE_BASE_ID
const T_CAMP      = 'CampagneMail'
const T_CONT      = 'CampagneMailContatti'
const AT_HEADERS  = { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' }

const BREVO_KEY      = process.env.BREVO_API_KEY
const SENDER_EMAIL   = process.env.BREVO_SENDER_EMAIL || 'info@boogiebistrot.com'
const SENDER_NAME    = process.env.BREVO_SENDER_NAME  || 'Boogie Bistrot'
const MAX_PER_GIORNO = 250

// ── HTML rendering ────────────────────────────────────────────────────────────

const F  = "'Raleway',Arial,sans-serif"
const CG = '#C4913A'
const CD = '#1A1610'
const CB = '#4A4030'
const CMUTED = '#8B6F47'
const CBG = '#F5F0E8'
const CLINE = '#D4C9B0'
const LOGO_URL = 'https://boogiebistrot.com/logo-email.png'
const LOGO_DARK = 'https://boogiebistrot.com/logo-email.png'
const LAYOUT_TYPES = new Set(['preheader', 'header-scuro', 'footer-ricco'])

function renderBlock(b, nome = '') {
  const sub = s => (s || '').replace(/\{nome\}/gi, nome || 'amico')
  switch (b.type) {
    case 'intestazione':
      return `<h2 style="font-family:${F};font-size:28px;font-weight:600;color:${CD};margin:0 0 20px;text-align:left;line-height:1.3;">${sub(b.testo)}</h2>`
    case 'intestazione-piccola':
      return `<h3 style="font-family:${F};font-size:16px;font-weight:600;color:${CD};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">${sub(b.testo)}</h3>`
    case 'testo':
      return `<p style="font-family:${F};font-size:15px;line-height:1.8;color:${CB};margin:0 0 20px;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p>`
    case 'immagine': {
      if (!b.url) return ''
      const img = `<img src="${b.url}" alt="${b.alt || ''}" width="536" style="display:block;width:100%;max-width:536px;border:0;margin:0 auto 20px;border-radius:4px;">`
      return b.link ? `<a href="${b.link}" style="display:block;text-decoration:none;">${img}</a>` : img
    }
    case 'hero': {
      if (!b.url) return ''
      const img = `<img src="${b.url}" alt="${b.alt || ''}" width="600" height="300" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;border:0;">`
      const inner = b.link
        ? `<a href="${b.link}" style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;text-decoration:none;">${img}</a>`
        : img
      return `<div style="display:block;overflow:hidden;position:relative;width:100%;padding-bottom:50%;height:0;background:${CBG};">${inner}</div>`
    }
    case 'mosaico': {
      const slots = Array.from({ length: 4 }, (_, i) => (b.immagini && b.immagini[i]) || { url: '', alt: '', link: '' })
      if (!slots.some(s => s.url)) return ''
      const cell = (slot, pad) => {
        const frame = (inner) =>
          `<div style="display:block;overflow:hidden;position:relative;width:100%;padding-bottom:66.67%;height:0;border-radius:2px;background:${CBG};">${inner}</div>`
        let inner
        if (slot.url) {
          const img = `<img src="${slot.url}" alt="${slot.alt || ''}" width="268" height="179" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;border:0;">`
          inner = slot.link ? `<a href="${slot.link}" style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;text-decoration:none;">${img}</a>` : img
        } else {
          inner = '&nbsp;'
        }
        return `<td width="50%" valign="top" style="width:50%;${pad}">${frame(inner)}</td>`
      }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;">
<tr>${cell(slots[0], 'padding:0 3px 3px 0;')}${cell(slots[1], 'padding:0 0 3px 3px;')}</tr>
<tr>${cell(slots[2], 'padding:3px 3px 0 0;')}${cell(slots[3], 'padding:3px 0 0 3px;')}</tr>
</table>`
    }
    case 'evidenza':
      return `<table cellpadding="0" cellspacing="0" width="100%" style="background:${CBG};border-left:3px solid ${CG};margin-bottom:24px;"><tr><td style="padding:16px 20px;"><p style="font-family:${F};font-size:15px;line-height:1.7;color:${CB};margin:0;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p></td></tr></table>`
    case 'lista': {
      const voci = (b.voci || '').split('\n').filter(v => v.trim())
      const rows = voci.map((v, i) => {
        const isLast = i === voci.length - 1
        return `<tr><td style="padding:0 0 ${isLast ? '0' : '8px'};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CBG};border:1px solid ${CLINE};border-radius:6px;border-collapse:separate;">
<tr>
<td width="36" valign="top" style="width:36px;padding:14px 0 14px 14px;font-family:${F};font-size:15px;line-height:1.5;color:${CG};font-weight:700;">✓</td>
<td valign="top" style="padding:14px 16px 14px 4px;font-family:${F};font-size:15px;line-height:1.55;color:${CD};">${sub(v.trim())}</td>
</tr>
</table>
</td></tr>`
      }).join('')
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>`
    }
    case 'box-4': {
      const voci = (b.voci || '').split('\n').map(v => v.trim()).filter(Boolean).slice(0, 4)
      while (voci.length < 4) voci.push('')
      const cellHtml = (testo, pad) => {
        let inner
        if (!testo) {
          inner = '&nbsp;'
        } else {
          const parts = testo.split(/\s+[—–-]\s+/)
          if (parts.length >= 2) {
            const titolo = sub(parts[0].replace(/^✓\s*/, ''))
            const resto = sub(parts.slice(1).join(' — '))
            inner = `<p style="font-family:${F};font-size:14px;font-weight:600;color:${CD};margin:0 0 6px;line-height:1.35;">${titolo}</p><p style="font-family:${F};font-size:13px;line-height:1.55;color:${CB};margin:0;">${resto}</p>`
          } else {
            inner = `<p style="font-family:${F};font-size:14px;line-height:1.55;color:${CB};margin:0;">${sub(testo.replace(/^✓\s*/, ''))}</p>`
          }
        }
        return `<td width="50%" valign="top" style="width:50%;${pad}"><div style="background:${CBG};border-radius:4px;padding:14px 16px;">${inner}</div></td>`
      }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;">
<tr>${cellHtml(voci[0], 'padding:0 5px 5px 0;')}${cellHtml(voci[1], 'padding:0 0 5px 5px;')}</tr>
<tr>${cellHtml(voci[2], 'padding:5px 5px 0 0;')}${cellHtml(voci[3], 'padding:5px 0 0 5px;')}</tr>
</table>`
    }
    case 'pulsante': {
      let bg = CG, color = CD, border = ''
      if (b.stile === 'dark')  { bg = CD;   color = 'white' }
      if (b.stile === 'light') { bg = CBG;  border = ';border:1px solid ' + CLINE }
      return `<p style="text-align:center;margin:0 0 24px;"><a href="${b.href || '#'}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;padding:14px 32px;font-family:${F};font-size:14px;font-weight:600;letter-spacing:0.04em;border-radius:4px${border};">${b.testo || 'Clicca qui'}</a></p>`
    }
    case 'contatti-diretti': {
      const sito = (b.sito || 'https://boogiebistrot.com').trim()
      const tel = (b.telefono || '').trim()
      const em = (b.email || '').trim()
      const intro = sub(b.testo || 'Oppure contattaci direttamente:')
      const sitoLabel = sito.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Sito'
      const box = (label, valueHtml, pad) =>
        `<td width="33.33%" valign="top" style="width:33.33%;${pad}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CBG};border:1px solid ${CLINE};border-radius:6px;border-collapse:separate;">
<tr><td align="center" style="padding:16px 10px;">
<p style="font-family:${F};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${CG};margin:0 0 8px;">${label}</p>
${valueHtml}
</td></tr>
</table>
</td>`
      const sitoHtml = sito
        ? `<a href="${sito}" style="font-family:${F};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;">${sitoLabel}</a>`
        : `<span style="font-family:${F};font-size:13px;color:${CMUTED};">—</span>`
      const mailHtml = em
        ? `<a href="mailto:${em}" style="font-family:${F};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;word-break:break-all;">${em}</a>`
        : `<span style="font-family:${F};font-size:13px;color:${CMUTED};">—</span>`
      const telHtml = tel
        ? `<a href="tel:${tel.replace(/\s/g, '')}" style="font-family:${F};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;">${tel}</a>`
        : `<span style="font-family:${F};font-size:13px;color:${CMUTED};">—</span>`
      return `${intro ? `<p style="text-align:center;font-family:${F};font-size:14px;line-height:1.6;color:${CB};margin:0 0 14px;">${intro}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;">
<tr>
${box('Sito', sitoHtml, 'padding:0 4px 0 0;')}
${box('Email', mailHtml, 'padding:0 2px;')}
${box('Telefono', telHtml, 'padding:0 0 0 4px;')}
</tr>
</table>`
    }
    case 'separatore':
      return `<hr style="border:none;border-top:1px solid ${CLINE};margin:24px 0;">`
    default:
      return ''
  }
}

function renderHeaderScuro(b) {
  let logo = b?.logoUrl || LOGO_DARK
  if (!logo || logo.includes('logo-white')) logo = LOGO_DARK
  const indirizzo = (b?.indirizzo || 'Via Europa, 2 — Colle Brianza (LC)').trim()
  const addr = indirizzo
    ? `<p style="margin:10px 0 0;font-family:${F};font-size:12px;line-height:1.4;color:${CD};letter-spacing:0.02em;">${indirizzo}</p>`
    : ''
  return `<tr><td align="center" style="padding:20px 24px 16px;background:#eece9d;"><img src="${logo}" alt="Boogie Bistrot" width="72" style="display:block;width:72px;height:auto;border:0;margin:0 auto;">${addr}</td></tr>`
}

function renderFooterRicco(b) {
  const lines = (b?.testo || 'Boogie Bistrot\nVia Europa, 2 — Colle Brianza (LC)')
    .split('\n').map(l => l.trim()).filter(Boolean).join('<br>')
  const links = []
  if (b?.sito) links.push(`<a href="${b.sito}" style="color:${CD};text-decoration:underline;">boogiebistrot.com</a>`)
  if (b?.instagram) links.push(`<a href="${b.instagram}" style="color:${CD};text-decoration:underline;">Instagram</a>`)
  const unsub = b?.unsubscribe !== false
    ? `<br><a href="{{unsubscribe}}" style="color:${CB};text-decoration:underline;">Non vuoi più ricevere comunicazioni?</a>`
    : ''
  return `<tr><td align="center" style="padding:22px 32px;background:#eece9d;font-size:12px;color:${CD};text-align:center;font-family:${F};line-height:1.7;">${lines}${links.length ? `<br>${links.join(' &nbsp;·&nbsp; ')}` : ''}${unsub}</td></tr>`
}

function buildHtml(campagna, nome) {
  let blocks = []
  try { blocks = JSON.parse(campagna.template || '[]') } catch {}

  const preheader = blocks.find(b => b.type === 'preheader')
  const header = blocks.find(b => b.type === 'header-scuro')
  const footer = blocks.find(b => b.type === 'footer-ricco')
  const content = blocks.filter(b => !LAYOUT_TYPES.has(b.type))
  const marketing = Boolean(header || footer || content.some(b => b.type === 'hero'))

  if (!marketing) {
    const body = content.map(b => renderBlock(b, nome)).join('\n')
    return shell({ body })
  }

  const rows = []
  if (header) rows.push(renderHeaderScuro(header))
  for (const b of content) {
    if (b.type === 'hero') {
      rows.push(`<tr><td style="padding:0;font-family:${F};">${renderBlock(b, nome)}</td></tr>`)
    } else {
      rows.push(`<tr><td style="padding:16px 32px 0;font-family:${F};">${renderBlock(b, nome)}</td></tr>`)
    }
  }
  rows.push(`<tr><td style="padding:8px 0 0;"></td></tr>`)
  rows.push(footer ? renderFooterRicco(footer) : `<tr><td align="center" style="padding:22px 32px;background:#eece9d;font-size:12px;color:${CD};text-align:center;font-family:${F};">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</td></tr>`)

  const pre = preheader?.testo
    ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader.testo}</div>`
    : ''

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;background:#f2ede4;font-family:${F};">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;border-radius:6px;overflow:hidden;">
${rows.join('\n')}
</table></td></tr></table></body></html>`
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

function oggiRome() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()) // YYYY-MM-DD
}

/**
 * Invia fino a `limit` email con DataProgrammata <= oggi per campagne InCorso/Programmata.
 * @param {{ limit?: number, campagnaId?: string }} opts
 */
export async function runInvioCampagna(opts = {}) {
  if (!BREVO_KEY) throw new Error('BREVO_API_KEY mancante nelle env Netlify')
  if (!AT_TOKEN || !AT_BASE) throw new Error('AIRTABLE_TOKEN / AIRTABLE_BASE_ID mancanti')

  const limit = Math.min(Math.max(1, Number(opts.limit) || MAX_PER_GIORNO), MAX_PER_GIORNO)
  const onlyCampagna = (opts.campagnaId || '').trim() || null
  const oggi = oggiRome()

  console.log(`[invia-campagna-mail] ${oggi} — avvio, max ${limit} email` +
    (onlyCampagna ? ` (campagna ${onlyCampagna})` : ''))

  const formulaParts = [
    `{Stato}='DaInviare'`,
    `{CampagnaId}!='global'`,
  ]
  if (onlyCampagna) formulaParts.push(`{CampagnaId}='${onlyCampagna}'`)

  const params = new URLSearchParams({
    filterByFormula: `AND(${formulaParts.join(',')})`,
    'sort[0][field]':     'DataProgrammata',
    'sort[0][direction]': 'asc',
    maxRecords: String(limit * 5),
  })
  const res  = await fetch(`${atUrl(T_CONT)}?${params}`, { headers: AT_HEADERS })
  if (!res.ok) throw new Error(`Airtable contatti: ${await res.text()}`)
  const json = await res.json()

  const candidati = (json.records || [])
    .filter(r => (r.fields['DataProgrammata'] || '') <= oggi)

  if (!candidati.length) {
    console.log('[invia-campagna-mail] Nessuna email da inviare oggi.')
    return { inviati: 0, errori: 0, rimanentiOggi: 0 }
  }

  const campagneCache = {}
  const campagneIds = [...new Set(candidati.map(r => r.fields['CampagnaId']).filter(Boolean))]
  await Promise.all(campagneIds.map(async (campagnaId) => {
    const cres = await fetch(`${atUrl(T_CAMP)}/${campagnaId}`, { headers: AT_HEADERS })
    if (!cres.ok) { console.error(`Campagna ${campagnaId} non trovata`); return }
    const data = await cres.json()
    campagneCache[campagnaId] = {
      id:          campagnaId,
      stato:       data.fields['Stato'] || 'Bozza',
      oggettoMail: data.fields['OggettoMail'] || '(nessun oggetto)',
      template:    data.fields['Template'] || '[]',
      titolo:      data.fields['Titolo'] || '',
      totaleInviati: data.fields['TotaleInviati'] || 0,
    }
  }))

  const ATTIVE = new Set(['InCorso', 'Programmata'])
  const daInviare = candidati
    .filter(r => {
      const c = campagneCache[r.fields['CampagnaId']]
      return c && ATTIVE.has(c.stato)
    })
    .slice(0, limit)

  if (!daInviare.length) {
    console.log('[invia-campagna-mail] Contatti in coda ma nessuna campagna InCorso/Programmata.')
    return { inviati: 0, errori: 0, rimanentiOggi: candidati.length }
  }

  console.log(`[invia-campagna-mail] Da inviare: ${daInviare.length}`)

  let inviati = 0, errori = 0
  const campagneTotaliInviati = {}

  for (const r of daInviare) {
    const campagnaId = r.fields['CampagnaId']
    const campagna   = campagneCache[campagnaId]
    if (!campagna) {
      await atPatch(T_CONT, r.id, { Stato: 'Errore', ErroreMsg: 'Campagna non trovata' })
      errori++
      continue
    }

    const email  = r.fields['Email'] || ''
    const nome   = r.fields['Nome'] || r.fields['Azienda'] || ''
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

    await new Promise(r => setTimeout(r, 80))
  }

  await Promise.all(Object.entries(campagneTotaliInviati).map(([campagnaId, count]) => {
    const c = campagneCache[campagnaId]
    const attuale = (c?.totaleInviati || 0) + count
    if (c) c.totaleInviati = attuale
    return atPatch(T_CAMP, campagnaId, { TotaleInviati: attuale })
      .catch(e => console.error(`Aggiornamento TotaleInviati campagna ${campagnaId}:`, e.message))
  }))

  const campagneDaVerificare = new Set([
    ...Object.keys(campagneTotaliInviati),
    ...campagneIds.filter(id => ATTIVE.has(campagneCache[id]?.stato)),
  ])
  await Promise.all([...campagneDaVerificare].map(async (campagnaId) => {
    const c = campagneCache[campagnaId]
    if (!c || !ATTIVE.has(c.stato)) return
    const check = new URLSearchParams({
      filterByFormula: `AND({CampagnaId}='${campagnaId}',{Stato}='DaInviare')`,
      maxRecords: '1',
    })
    const cres = await fetch(`${atUrl(T_CONT)}?${check}`, { headers: AT_HEADERS })
    if (!cres.ok) return
    const cjson = await cres.json()
    if ((cjson.records || []).length === 0) {
      console.log(`[invia-campagna-mail] Campagna ${campagnaId} completata`)
      await atPatch(T_CAMP, campagnaId, { Stato: 'Completata' })
    }
  }))

  const rimanentiOggi = Math.max(0, candidati.filter(r => {
    const c = campagneCache[r.fields['CampagnaId']]
    return c && ATTIVE.has(c.stato)
  }).length - inviati)

  console.log(`[invia-campagna-mail] Completato: ${inviati} inviati, ${errori} errori`)
  return { inviati, errori, rimanentiOggi, oggi }
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (event = {}) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  const isSchedule = (event.headers?.['x-netlify-event'] || event.headers?.['X-Netlify-Event'] || '') === 'schedule'
  if (!isSchedule && event.httpMethod) {
    try {
      const vt = loadVerifyToken()
      if (vt && !vt.verifyToken(event)) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
      }
    } catch (e) {
      console.warn('[invia-campagna-mail] verifyToken non disponibile:', e.message)
    }
  }

  let opts = {}
  try {
    if (event.body) opts = JSON.parse(event.body)
  } catch { /* ignore */ }
  if (event.queryStringParameters?.campagnaId) opts.campagnaId = event.queryStringParameters.campagnaId
  if (event.queryStringParameters?.limit) opts.limit = Number(event.queryStringParameters.limit)

  try {
    const result = await runInvioCampagna(opts)
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, ...result }),
    }
  } catch (e) {
    console.error('[invia-campagna-mail] Errore fatale:', e)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: e.message }),
    }
  }
}
