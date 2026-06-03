/**
 * migrate-media-to-r2.mjs
 * Migra le immagini ImageKit su Cloudflare R2 e aggiorna Airtable.
 *
 * Uso:
 *   AIRTABLE_TOKEN=xxx AIRTABLE_BASE_ID=xxx \
 *   R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx \
 *   R2_BUCKET=xxx R2_PUBLIC_URL=https://... \
 *   node migrate-media-to-r2.mjs [--dry-run]
 *
 * --dry-run  mostra cosa verrebbe fatto senza scrivere niente
 *
 * Tabelle migrate:
 *   Media  → campo "URL"
 *   Agenda → campo "FotoHero"
 *   Blog   → campo "FotoHero"
 */

import crypto from 'node:crypto'

const DRY_RUN = process.argv.includes('--dry-run')

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const R2_ACCOUNT_ID        = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID     = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET            = process.env.R2_BUCKET
const R2_PUBLIC_URL        = process.env.R2_PUBLIC_URL

const missing = ['AIRTABLE_TOKEN','AIRTABLE_BASE_ID','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET','R2_PUBLIC_URL']
  .filter(k => !process.env[k])
if (missing.length) {
  console.error('Variabili mancanti:', missing.join(', '))
  process.exit(1)
}

const AT_HEADERS = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── ImageKit helpers ─────────────────────────────────────────────────────────

function isImageKit(url) {
  return typeof url === 'string' && url.includes('ik.imagekit.io')
}

/** Rimuove le trasformazioni dal path per ottenere l'URL originale. */
function ikOriginalUrl(url) {
  return url
    .replace(/(https:\/\/ik\.imagekit\.io\/[^/]+)\/tr:[^/]+(?=\/)/, '$1')
    .replace(/(https:\/\/ik\.imagekit\.io\/[^/]+)\/tr:[^/]+$/, '$1')
}

/** Estrae un nome file ragionevole dall'URL ImageKit. */
function ikFileName(url) {
  try {
    const clean = ikOriginalUrl(url)
    const parts = new URL(clean).pathname.split('/').filter(Boolean)
    // Rimuove il segmento account (primo dopo il dominio)
    const name  = parts.slice(1).join('_') || `image-${Date.now()}`
    // Sanitizza
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  } catch {
    return `image-${Date.now()}.jpg`
  }
}

// ── AWS Signature V4 ─────────────────────────────────────────────────────────

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest()
}
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}
function toHex(buf) { return Buffer.from(buf).toString('hex') }

function sigV4Sign({ method, url, body, contentType }) {
  const region  = 'auto'
  const service = 's3'
  const now      = new Date()
  const dateTime = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '')
  const dateOnly = dateTime.slice(0, 8)
  const u            = new URL(url)
  const bodyHash     = sha256Hex(body)
  const canonHeaders = [`content-type:${contentType}`, `host:${u.host}`, `x-amz-content-sha256:${bodyHash}`, `x-amz-date:${dateTime}`].join('\n') + '\n'
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [method, u.pathname, '', canonHeaders, signedHeaders, bodyHash].join('\n')
  const credentialScope  = `${dateOnly}/${region}/${service}/aws4_request`
  const stringToSign     = ['AWS4-HMAC-SHA256', dateTime, credentialScope, sha256Hex(canonicalRequest)].join('\n')
  const signingKey = [dateOnly, region, service, 'aws4_request']
    .reduce((key, data) => hmacSha256(key, data), `AWS4${R2_SECRET_ACCESS_KEY}`)
  const signature = toHex(hmacSha256(signingKey, stringToSign))
  return {
    'Content-Type': contentType,
    'x-amz-date': dateTime,
    'x-amz-content-sha256': bodyHash,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

// ── R2 upload ────────────────────────────────────────────────────────────────

async function uploadToR2(buffer, fileName, contentType) {
  const key    = `media/${Date.now()}-${fileName}`
  const r2Url  = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
  const pubUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`

  const headers = sigV4Sign({ method: 'PUT', url: r2Url, body: buffer, contentType })
  const res = await fetch(r2Url, { method: 'PUT', headers, body: buffer })
  if (!res.ok) throw new Error(`R2 PUT fallito ${res.status}: ${await res.text()}`)
  return pubUrl
}

// ── Airtable helpers ─────────────────────────────────────────────────────────

async function getAllRecords(table, fields) {
  const records = []
  let offset = null
  const fieldParams = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&')
  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${fieldParams}&pageSize=100${offset ? `&offset=${offset}` : ''}`
    const res  = await fetch(url, { headers: AT_HEADERS })
    if (!res.ok) throw new Error(`Airtable fetch [${table}]: ${await res.text()}`)
    const data = await res.json()
    records.push(...data.records)
    offset = data.offset || null
  } while (offset)
  return records
}

async function patchRecord(table, recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`,
    { method: 'PATCH', headers: AT_HEADERS, body: JSON.stringify({ fields }) }
  )
  if (!res.ok) throw new Error(`Airtable PATCH [${table}/${recordId}]: ${await res.text()}`)
}

// ── Migrazione per tabella ───────────────────────────────────────────────────

async function migrateTable(tableName, fieldName) {
  console.log(`\n── ${tableName} (${fieldName}) ──`)
  const records = await getAllRecords(tableName, [fieldName])
  const toMigrate = records.filter(r => isImageKit(r.fields[fieldName]))
  console.log(`  Totale: ${records.length} | Da migrare: ${toMigrate.length}`)

  let ok = 0, skipped = 0, errors = 0

  for (const rec of toMigrate) {
    const ikUrl  = rec.fields[fieldName]
    const origUrl = ikOriginalUrl(ikUrl)
    const fileName = ikFileName(ikUrl)

    if (DRY_RUN) {
      console.log(`  [dry] ${rec.id}: ${origUrl.slice(-60)} → media/${fileName}`)
      skipped++
      continue
    }

    try {
      // 1. Scarica originale da ImageKit (User-Agent richiesto per evitare 503)
      const dlRes = await fetch(origUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(90_000),
      })
      if (!dlRes.ok) throw new Error(`Download fallito ${dlRes.status} [${origUrl.slice(-80)}]`)
      const contentType = dlRes.headers.get('content-type') || 'image/jpeg'
      const buffer = Buffer.from(await dlRes.arrayBuffer())

      // 2. Carica su R2
      const r2Url = await uploadToR2(buffer, fileName, contentType)

      // 3. Aggiorna Airtable
      await patchRecord(tableName, rec.id, { [fieldName]: r2Url })

      console.log(`  ✓ ${rec.id}: ${r2Url.split('/').slice(-1)[0]}`)
      ok++
    } catch (e) {
      console.error(`  ✗ ${rec.id}: ${e.message}`)
      errors++
    }

    await sleep(300) // rispetta rate limit Airtable (5 req/s)
  }

  console.log(`  → OK: ${ok}, Saltati: ${skipped}, Errori: ${errors}`)
  return { ok, errors }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`=== Migrazione ImageKit → R2 ${DRY_RUN ? '[DRY RUN]' : ''} ===`)
  console.log(`  Bucket: ${R2_BUCKET}`)
  console.log(`  CDN:    ${R2_PUBLIC_URL}\n`)

  const tables = [
    { name: 'Media',  field: 'URL' },
    { name: 'Agenda', field: 'FotoHero' },
    { name: 'Blog',   field: 'FotoHero' },
  ]

  let totalOk = 0, totalErrors = 0

  for (const t of tables) {
    try {
      const { ok, errors } = await migrateTable(t.name, t.field)
      totalOk     += ok
      totalErrors += errors
    } catch (e) {
      console.error(`  Errore tabella ${t.name}: ${e.message}`)
    }
  }

  console.log(`\n=== Completato ===`)
  console.log(`✓ Migrati: ${totalOk}`)
  if (totalErrors > 0) console.log(`✗ Errori:  ${totalErrors}`)
  if (DRY_RUN) console.log('\nRilancia senza --dry-run per eseguire la migrazione.')
}

main().catch(e => { console.error('Errore fatale:', e); process.exit(1) })
