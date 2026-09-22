/**
 * Parser CSV contatti email marketing.
 * Formato ufficiale (header):
 *   Nome,Indirizzo,Sito Web,Email,Distanza (km),Ambito
 * Legacy (senza header):
 *   email,nome,azienda
 */

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(s => s.trim())
}

function normalizeHeader(h) {
  return String(h || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function sanitizeEmail(raw) {
  if (!raw) return ''
  let e = String(raw).trim()
  try { e = decodeURIComponent(e.replace(/\+/g, ' ')) } catch { /* keep */ }
  return e.replace(/\s+/g, '').toLowerCase()
}

function isValidEmail(email) {
  return Boolean(email && email.includes('@') && email.includes('.') && !email.includes(' '))
}

const HEADER_MAP = {
  'nome': 'azienda',
  'azienda': 'azienda',
  'indirizzo': 'indirizzo',
  'sito web': 'sitoWeb',
  'sitoweb': 'sitoWeb',
  'sito': 'sitoWeb',
  'email': 'email',
  'e-mail': 'email',
  'mail': 'email',
  'distanza (km)': 'distanzaKm',
  'distanza km': 'distanzaKm',
  'distanza': 'distanzaKm',
  'ambito': 'ambito',
}

/**
 * @param {string} text
 * @returns {{ contatti: Array<object>, scartati: number, formato: string }}
 */
export function parseContattiCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (!lines.length) return { contatti: [], scartati: 0, formato: 'vuoto' }

  const firstCells = parseCsvLine(lines[0]).map(normalizeHeader)
  const looksLikeHeader = firstCells.some(c => HEADER_MAP[c] === 'email' || c === 'email')
    && firstCells.some(c => ['nome', 'azienda', 'ambito', 'indirizzo', 'sito web'].includes(c) || HEADER_MAP[c])

  let formato = 'legacy'
  let startIdx = 0
  let colIndex = { email: 0, nome: 1, azienda: 2 }

  if (looksLikeHeader) {
    formato = 'aziende'
    startIdx = 1
    colIndex = {}
    firstCells.forEach((h, i) => {
      const key = HEADER_MAP[h]
      if (key) colIndex[key] = i
    })
    if (colIndex.email == null) {
      return { contatti: [], scartati: lines.length - 1, formato: 'header-senza-email' }
    }
  }

  const seen = new Set()
  const contatti = []
  let scartati = 0

  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    let email, nome, azienda, indirizzo, sitoWeb, distanzaKm, ambito

    if (formato === 'aziende') {
      email = cells[colIndex.email] || ''
      // Nel CSV aziende la colonna "Nome" è la ragione sociale
      azienda = colIndex.azienda != null ? (cells[colIndex.azienda] || '') : ''
      nome = azienda
      indirizzo = colIndex.indirizzo != null ? (cells[colIndex.indirizzo] || '') : ''
      sitoWeb = colIndex.sitoWeb != null ? (cells[colIndex.sitoWeb] || '') : ''
      distanzaKm = colIndex.distanzaKm != null ? (cells[colIndex.distanzaKm] || '') : ''
      ambito = colIndex.ambito != null ? (cells[colIndex.ambito] || '') : ''
    } else {
      email = cells[0] || ''
      nome = cells[1] || ''
      azienda = cells[2] || ''
      indirizzo = ''
      sitoWeb = ''
      distanzaKm = ''
      ambito = ''
    }

    email = sanitizeEmail(email)
    if (!isValidEmail(email)) { scartati++; continue }
    if (seen.has(email)) { scartati++; continue }
    seen.add(email)

    contatti.push({
      email,
      nome: (nome || '').trim(),
      azienda: (azienda || '').trim(),
      indirizzo: (indirizzo || '').trim(),
      sitoWeb: (sitoWeb || '').trim(),
      distanzaKm: (distanzaKm || '').trim(),
      ambito: (ambito || '').trim(),
    })
  }

  return { contatti, scartati, formato }
}
