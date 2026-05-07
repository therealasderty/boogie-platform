// netlify/functions/upload-slide.js
// Carica una slide social su Cloudflare R2.
// Il browser invia il file come base64; questa funzione firma la richiesta
// con AWS Signature V4 (R2 è S3-compatibile) e fa il PUT direttamente sull'oggetto.
//
// Env vars richieste (Netlify → Site configuration → Environment variables):
//   R2_ACCOUNT_ID        — Cloudflare account ID (visibile in dashboard.cloudflare.com)
//   R2_ACCESS_KEY_ID     — R2 API Token → Access Key ID
//   R2_SECRET_ACCESS_KEY — R2 API Token → Secret Access Key
//   R2_BUCKET            — nome del bucket, es. "boogie-social"
//   R2_PUBLIC_URL        — URL pubblico del bucket, es. "https://social.boogiebistrot.com"
//                          (o il dominio r2.dev se non hai custom domain)
//
// Endpoint: POST /.netlify/functions/upload-slide
// Body:     { fileName: string, contentType: string, fileBase64: string }
// Risposta: { url: string }

const crypto = require('node:crypto')

const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET            = process.env.R2_BUCKET
const R2_PUBLIC_URL        = process.env.R2_PUBLIC_URL

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── AWS Signature V4 ────────────────────────────────────────────────────────

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest()
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function toHex(buf) {
  return Buffer.from(buf).toString('hex')
}

function sigV4Sign({ method, url, body, contentType, accessKeyId, secretAccessKey }) {
  const region  = 'auto'
  const service = 's3'

  const now      = new Date()
  const dateTime = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '')  // YYYYMMDDTHHMMSSZñ
  const dateOnly = dateTime.slice(0, 8)

  const u           = new URL(url)
  const bodyHash    = sha256Hex(body)
  const canonHeaders = [
    `content-type:${contentType}`,
    `host:${u.host}`,
    `x-amz-content-sha256:${bodyHash}`,
    `x-amz-date:${dateTime}`,
  ].join('\n') + '\n'
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    method,
    u.pathname,
    '',          // query string vuota
    canonHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n')

  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`
  const stringToSign    = [
    'AWS4-HMAC-SHA256',
    dateTime,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const signingKey = [dateOnly, region, service, 'aws4_request']
    .reduce((key, data) => hmacSha256(key, data), `AWS4${secretAccessKey}`)

  const signature = toHex(hmacSha256(signingKey, stringToSign))

  return {
    'Content-Type':           contentType,
    'x-amz-date':             dateTime,
    'x-amz-content-sha256':   bodyHash,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' }
  }

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Env vars R2 non configurate' }) }
  }

  let fileName, contentType, fileBase64
  try {
    ;({ fileName, contentType, fileBase64 } = JSON.parse(event.body || '{}'))
    if (!fileName || !fileBase64) throw new Error('fileName e fileBase64 sono obbligatori')
  } catch (e) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message }) }
  }

  const ct     = contentType || 'image/png'
  const key    = `social_posts/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const r2Url  = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
  const pubUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`

  const fileBuffer = Buffer.from(fileBase64, 'base64')

  const headers = sigV4Sign({
    method:          'PUT',
    url:             r2Url,
    body:            fileBuffer,
    contentType:     ct,
    accessKeyId:     R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  })

  const res = await fetch(r2Url, { method: 'PUT', headers, body: fileBuffer })

  if (!res.ok) {
    const text = await res.text()
    return { statusCode: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `R2 upload fallito: ${res.status}`, detail: text }) }
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: pubUrl }),
  }
}
