/**
 * migrate-to-imagekit.mjs
 * Migra le foto Cloudinary su ImageKit e aggiorna i record Airtable.
 *
 * Uso:
 *   node migrate-to-imagekit.mjs
 *
 * Richiede Node.js 18+ (fetch nativo).
 */

// Node.js 24 ha FormData e Blob globali — nessun import necessario

// ── Credenziali ──────────────────────────────────────────────────────────────

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const IK_PRIVATE_KEY   = process.env.IK_PRIVATE_KEY
const IK_URL           = 'https://ik.imagekit.io/ntd5nq5ml'

const AT_HEADERS = {
  'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type':  'application/json',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isCloudinary(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com')
}

/** Rimuove le trasformazioni dall'URL Cloudinary per scaricare l'originale. */
function stripTransforms(url) {
  // Es: .../upload/w_120,c_fill,q_auto,f_auto/v1234/foto.jpg → .../upload/v1234/foto.jpg
  return url.replace(/\/upload\/(?:[^/]*[_,][^/]*\/)+/, '/upload/')
}

/** Estrae il nome file dall'URL Cloudinary (ultimo segmento senza versione). */
function extractFilename(url) {
  const clean   = stripTransforms(url)
  const parts   = clean.split('/')
  const last    = parts[parts.length - 1]          // es. "foto.jpg"
  const noQuery = last.split('?')[0]
  return noQuery || `image-${Date.now()}.jpg`
}

/** Scarica un'immagine e restituisce { blob, contentType }. */
async function downloadImage(url) {
  const original = stripTransforms(url)
  console.log(`   ↓ Download: ${original}`)
  const res = await fetch(original, { headers: { 'User-Agent': 'boogie-migrator/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${original}`)
  const blob        = await res.blob()
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return { blob, contentType }
}

/** Carica un blob su ImageKit e restituisce l'URL pubblico. */
async function uploadToImageKit(blob, fileName, contentType) {
  const auth = Buffer.from(`${IK_PRIVATE_KEY}:`).toString('base64')
  const fd   = new FormData()
  fd.append('file', new Blob([await blob.arrayBuffer()], { type: contentType }), fileName)
  fd.append('fileName', fileName)
  fd.append('folder', 'media')

  const res  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method:  'POST',
    headers: { 'Authorization': `Basic ${auth}` },
    body:    fd,
  })
  const data = await res.json()
  if (!res.ok || data.message) throw new Error(data.message || `Upload fallito: ${res.status}`)
  console.log(`   ↑ ImageKit: ${data.url}`)
  return data.url
}

/** Aggiorna il campo URL di un record Airtable. */
async function updateAirtableUrl(recordId, newUrl) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media/${recordId}`,
    {
      method:  'PATCH',
      headers: AT_HEADERS,
      body:    JSON.stringify({ fields: { 'URL': newUrl } }),
    }
  )
  if (!res.ok) throw new Error(`Airtable PATCH fallito: ${await res.text()}`)
}

/** Legge tutti i record della tabella Media con paginazione. */
async function getAllMediaRecords() {
  const records = []
  let offset    = null

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Media?fields[]=URL&fields[]=Nome&pageSize=100${offset ? `&offset=${offset}` : ''}`
    const res  = await fetch(url, { headers: AT_HEADERS })
    if (!res.ok) throw new Error(`Airtable fetch fallito: ${await res.text()}`)
    const data = await res.json()
    records.push(...data.records)
    offset = data.offset || null
  } while (offset)

  return records
}

/** Pausa per evitare rate limiting. */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Migrazione Cloudinary → ImageKit ===\n')

  console.log('Recupero record Media da Airtable…')
  const records = await getAllMediaRecords()
  console.log(`Trovati ${records.length} record totali.\n`)

  const damigrare = records.filter(r => isCloudinary(r.fields['URL']))
  console.log(`Record con URL Cloudinary: ${damigrare.length}\n`)

  if (damigrare.length === 0) {
    console.log('Nessuna migrazione necessaria.')
    return
  }

  let ok = 0, errori = 0
  const falliti = []

  for (let i = 0; i < damigrare.length; i++) {
    const rec  = damigrare[i]
    const nome = rec.fields['Nome'] || rec.id
    const url  = rec.fields['URL']

    console.log(`[${i + 1}/${damigrare.length}] ${nome}`)
    console.log(`   Cloudinary: ${url}`)

    try {
      const fileName          = extractFilename(url)
      const { blob, contentType } = await downloadImage(url)
      const newUrl            = await uploadToImageKit(blob, fileName, contentType)
      await updateAirtableUrl(rec.id, newUrl)
      console.log(`   ✓ Migrato\n`)
      ok++
    } catch (e) {
      console.error(`   ✗ Errore: ${e.message}\n`)
      errori++
      falliti.push({ nome, url, errore: e.message })
    }

    // Pausa tra upload per non stressare le API
    if (i < damigrare.length - 1) await sleep(500)
  }

  console.log(`\n=== Completato ===`)
  console.log(`✓ Migrati: ${ok}`)
  console.log(`✗ Errori:  ${errori}`)

  if (falliti.length > 0) {
    console.log('\nRecord falliti:')
    falliti.forEach(f => console.log(`  - ${f.nome}: ${f.errore}`))
  }
}

main().catch(e => { console.error('Errore fatale:', e); process.exit(1) })
