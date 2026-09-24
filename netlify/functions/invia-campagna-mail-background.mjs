// netlify/functions/invia-campagna-mail-background.mjs
// Background function (fino a 15 min): invio lotto campagna senza timeout UI.
// POST { campagnaId?, limit? } — risponde 202 e continua in background.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (event = {}) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  try {
    const { verifyToken } = require('./verifyToken')
    if (!verifyToken(event)) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
    }
  } catch (e) {
    console.warn('[invia-campagna-mail-background] verifyToken:', e.message)
  }

  let opts = {}
  try { opts = JSON.parse(event.body || '{}') } catch { /* ignore */ }

  const limit = Math.min(Math.max(1, Number(opts.limit) || 200), 200)
  const campagnaId = (opts.campagnaId || '').trim() || undefined

  console.log(`[invia-campagna-mail-background] start limit=${limit} campagna=${campagnaId || 'all'}`)

  try {
    const { runInvioCampagna } = await import('./invia-campagna-mail.mjs')
    const result = await runInvioCampagna({ limit, campagnaId })
    console.log('[invia-campagna-mail-background] done', result)
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, ...result }),
    }
  } catch (e) {
    console.error('[invia-campagna-mail-background] errore:', e)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: e.message }),
    }
  }
}
