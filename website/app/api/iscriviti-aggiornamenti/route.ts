import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY    = process.env.BREVO_API_KEY
const BREVO_LIST_ID    = process.env.BREVO_LIST_ID_EVENTI
const EMAIL_FROM       = process.env.EMAIL_FROM
const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const SITO_BASE        = 'https://boogiebistrot.com'
const BREVO_DEBUG_LOGS = process.env.BREVO_DEBUG_LOGS === '1'

// Rate limiting in-memory: max 3 iscrizioni per IP ogni 10 minuti
const ipLog = new Map<string, number[]>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const maxRequests = 3
  const timestamps = (ipLog.get(ip) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= maxRequests) return true
  ipLog.set(ip, [...timestamps, now])
  return false
}

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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra qualche minuto.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { nome, cognome, email, telefono, dataNascita, eventoTitolo, website } = body

  // Anti-spam: honeypot deve essere vuoto
  if (website) {
    return NextResponse.json({ success: true })
  }

  if (!email || !nome) {
    return NextResponse.json({ error: 'Email e nome sono obbligatori' }, { status: 400 })
  }

  // Salva su Airtable ListaAttesa (priorità: funziona sempre indipendentemente da Brevo)
  if (AIRTABLE_TOKEN && AIRTABLE_BASE_ID) {
    fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('ListaAttesa')}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            Nome:   `${nome}${cognome ? ' ' + cognome : ''}`,
            Email:  email,
            Evento: eventoTitolo,
            Data:   new Date().toISOString().split('T')[0],
          },
        }),
      }
    ).catch(e => console.error('Airtable ListaAttesa error:', e))
  }

  // Brevo: opzionale — se mancante o in errore, logga e prosegui
  if (BREVO_API_KEY && BREVO_LIST_ID) {
    try {
      const normalizedPhone = normalizePhoneForBrevo(telefono)
      const attributes: Record<string, string> = {
        FIRSTNAME: String(nome),
        LASTNAME:  String(cognome || ''),
        EVENTO:    String(eventoTitolo || ''),
        ...(normalizedPhone ? { SMS: normalizedPhone } : {}),
      }
      if (dataNascita) attributes.BIRTHDAY = String(dataNascita)

      const brevoPayload = {
        email,
        attributes,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true,
      }

      if (BREVO_DEBUG_LOGS) {
        console.log('[Brevo] upsert contact (iscriviti-aggiornamenti):', {
          email,
          normalizedPhone,
          attributes: brevoPayload.attributes,
          listIds: brevoPayload.listIds,
        })
      }

      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(brevoPayload),
      })

      // 201 = creato, 204 = già esistente aggiornato — entrambi ok
      if (!res.ok && res.status !== 204) {
        const err = await res.text()
        console.error('[Brevo] errore aggiunta contatto:', err)
      } else {
        if (BREVO_DEBUG_LOGS) {
          const text = await res.text().catch(() => '')
          console.log('[Brevo] response (iscriviti-aggiornamenti):', { status: res.status, ok: res.ok, body: text })
        }

        // Email di conferma — solo se Brevo ha accettato il contatto
        if (EMAIL_FROM) {
          const eventoLink = `${SITO_BASE}/eventi-speciali`
          const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
<tr><td style="padding:40px 40px 32px;">
<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Boogie Bistrot · ${eventoTitolo}</p>
<h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;">Sei nella lista ✓</h1>
<p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">Ciao <strong>${nome}</strong>,<br>ti abbiamo registrato nella lista di attesa per <strong>${eventoTitolo}</strong>. Ti avviseremo non appena sarà di nuovo disponibile.</p>
<a href="${eventoLink}" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:14px 32px;font-size:14px;letter-spacing:0.05em;">Scopri gli altri eventi</a>
<p style="font-size:12px;color:#8B6F47;margin:32px 0 0;">Boogie Bistrot · Colle Brianza</p>
</td></tr></table></td></tr></table></body></html>`

          fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'Boogie Bistrot', email: EMAIL_FROM },
              to: [{ email, name: `${nome}${cognome ? ' ' + cognome : ''}` }],
              subject: `Sei nella lista — ${eventoTitolo}`,
              htmlContent: html,
            }),
          }).catch(e => console.error('Brevo conferma error:', e))
        }
      }
    } catch (e) {
      console.error('[Brevo] fetch error:', e)
    }
  } else {
    console.warn('[iscriviti-aggiornamenti] BREVO_API_KEY o BREVO_LIST_ID_EVENTI non configurati — skip Brevo')
  }

  return NextResponse.json({ success: true })
}
