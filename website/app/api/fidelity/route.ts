import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '3')
const EMAIL_FROM    = process.env.EMAIL_FROM
const BREVO_DEBUG_LOGS = process.env.BREVO_DEBUG_LOGS === '1'

function normalizePhoneForBrevo(raw: unknown): string | null {
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

const brevoHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'api-key': BREVO_API_KEY!,
})

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ success: false }, { status: 400 }) }

  const { nome, cognome, email, telefono, data_nascita, consenso_privacy, consenso_marketing } =
    body as Record<string, unknown>

  if (!nome || !email || !consenso_privacy) {
    return NextResponse.json({ success: false, error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  if (!BREVO_API_KEY) {
    return NextResponse.json({ success: false, error: 'Configurazione mancante' }, { status: 500 })
  }

  // Controlla se già iscritto
  try {
    const checkRes = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(String(email))}`, {
      headers: brevoHeaders(),
    })
    if (checkRes.ok) {
      const existing = await checkRes.json()
      if (existing.attributes?.ISCRITTO_FIDELITY === true) {
        return NextResponse.json({ success: true, alreadyMember: true })
      }
    }
  } catch { /* contatto non trovato, procedi */ }

  // Crea o aggiorna contatto su Brevo
  const normalizedPhone = normalizePhoneForBrevo(telefono)
  const brevoPayload = {
    email,
    attributes: {
      FIRSTNAME: nome,
      LASTNAME: cognome || '',
      ...(normalizedPhone ? { SMS: normalizedPhone } : {}),
      ISCRITTO_FIDELITY: true,
      PUNTI_FIDELITY: 0,
      DATA_ISCRIZIONE_FIDELITY: new Date().toISOString().split('T')[0],
      ...(data_nascita ? { BIRTHDAY: String(data_nascita) } : {}),
      CONSENSO_MARKETING: !!consenso_marketing,
    },
    listIds: [BREVO_LIST_ID],
    updateEnabled: true,
  }

  if (BREVO_DEBUG_LOGS) {
    console.log('[Brevo] upsert contact (fidelity):', {
      email,
      normalizedPhone,
      attributes: brevoPayload.attributes,
      listIds: brevoPayload.listIds,
    })
  }

  const upsertRes = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: brevoHeaders(),
    body: JSON.stringify(brevoPayload),
  })

  const upsertText = await upsertRes.text().catch(() => '')
  if (BREVO_DEBUG_LOGS || !upsertRes.ok) {
    console.log('[Brevo] response (fidelity):', { status: upsertRes.status, ok: upsertRes.ok, body: upsertText })
  }

  if (!upsertRes.ok) {
    const upsertBody = (() => { try { return JSON.parse(upsertText || '{}') } catch { return {} } })()
    if (upsertRes.status !== 400 || upsertBody.code !== 'duplicate_parameter') {
      return NextResponse.json({ success: false }, { status: 500 })
    }
  }

  // Email di benvenuto
  if (EMAIL_FROM) {
    const emailHtml = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
<tr><td style="padding:40px 40px 20px;">
<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot — Fidelity</p>
<h1 style="font-size:24px;color:#1A1610;margin:0 0 20px;font-weight:400;">Benvenuto nel programma Fidelity! 🎉</h1>
<p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 20px;">Ciao <strong>${nome}</strong>,<br>sei ufficialmente iscritto al programma Fidelity di Boogie Bistrot.</p>
<table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:24px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0 0 8px;font-size:11px;color:#8B6F47;text-transform:uppercase;letter-spacing:0.08em;">Come funziona</p>
<p style="margin:0;font-size:14px;color:#1A1610;line-height:1.7;"><strong>Ogni euro speso vale 5 punti.</strong><br>I punti si accumulano ad ogni visita e potrai usarli per ottenere premi esclusivi.</p>
</td></tr></table>
<p style="font-size:13px;color:#8B6F47;">Il tuo saldo punti attuale: <strong style="color:#C4913A;">0 punti</strong></p>
</td></tr>
<tr><td style="padding:16px 40px 24px;border-top:1px solid #D4C9B0;">
<p style="font-size:11px;color:#B0A898;margin:0;">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</p>
</td></tr></table></td></tr></table></body></html>`

    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: brevoHeaders(),
      body: JSON.stringify({
        sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
        to: [{ email, name: String(nome) }],
        subject: '🎉 Benvenuto nel programma Fidelity — Boogie Bistrot',
        htmlContent: emailHtml,
      }),
    }).catch(e => console.error('Brevo email error:', e))
  }

  return NextResponse.json({ success: true, alreadyMember: false })
}
