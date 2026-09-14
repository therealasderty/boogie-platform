const crypto = require('crypto');

const TOKEN_TTL_S = 7 * 24 * 60 * 60

function credentials() {
  return {
    password: process.env.DASHBOARD_PASSWORD,
    secret: process.env.DASHBOARD_SECRET || 'boogie-secret-key',
  }
}

function createToken() {
  const { password, secret } = credentials()
  const issuedAt = Math.floor(Date.now() / 1000)
  const sig = crypto.createHmac('sha256', secret).update(`${password}.${issuedAt}`).digest('hex')
  return `${issuedAt}.${sig}`
}

function isValidToken(token) {
  if (!token) return false
  const { password, secret } = credentials()

  const parts = token.split('.')
  if (parts.length === 2 && /^\d+$/.test(parts[0])) {
    const issuedAt = Number(parts[0])
    const sig = parts[1]
    const expected = crypto.createHmac('sha256', secret).update(`${password}.${issuedAt}`).digest('hex')
    if (sig !== expected) return false
    const age = Math.floor(Date.now() / 1000) - issuedAt
    return age >= -60 && age <= TOKEN_TTL_S
  }

  // Token giornalieri precedenti al cambio di formato
  for (let offset = 0; offset <= 1; offset++) {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    const day = d.toISOString().split('T')[0]
    const expected = crypto.createHmac('sha256', secret).update(password + day).digest('hex')
    if (token === expected) return true
  }
  return false
}

function verifyToken(event) {
  const headers = event.headers || {}
  const auth = (headers.authorization || headers.Authorization || '').trim()
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (process.env.NETLIFY_DEV === 'true') return true
  return isValidToken(token)
}

module.exports = { verifyToken, createToken, isValidToken };
