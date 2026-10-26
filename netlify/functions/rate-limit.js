// Finestra in-memory non sopravvive ai cold start delle Functions.
// Netlify Blobs non ha TTL: la scadenza è il timestamp salvato nel valore.

const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 3

function clientIp(event) {
  const headers = event.headers || {}
  const netlifyIp = headers['x-nf-client-connection-ip'] || headers['client-ip']
  if (netlifyIp) return String(netlifyIp).split(',')[0].trim()

  const forwarded = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || ''
  const parts = String(forwarded).split(',').map((part) => part.trim()).filter(Boolean)
  return parts[parts.length - 1] || 'unknown'
}

async function isRateLimited(scope, ip) {
  try {
    const { getStore } = require('@netlify/blobs')
    const store = getStore({ name: 'rate-limits', consistency: 'strong' })
    const key = `${scope}:${ip || 'unknown'}`
    const raw = await store.get(key, { type: 'json' })
    const now = Date.now()

    const count = raw && Number.isFinite(Number(raw.count)) ? Number(raw.count) : 0
    if (!raw || typeof raw.ts !== 'number' || now - raw.ts > WINDOW_MS) {
      await store.setJSON(key, { count: 1, ts: now })
      return false
    }
    if (count >= MAX_HITS) return true
    await store.setJSON(key, { count: count + 1, ts: raw.ts })
    return false
  } catch (err) {
    console.error('[rate-limit] fail open:', err && err.message)
    return false
  }
}

module.exports = { isRateLimited, clientIp }
