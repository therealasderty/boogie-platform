/**
 * r2-media.js — upload immagini media (permanenti) su Cloudflare R2.
 * Stessa logica di r2.js ma usa /.netlify/functions/upload-media (prefisso media/).
 */

import { authFetch } from './authFetch'

const UPLOAD_ENDPOINT = '/.netlify/functions/upload-media'

/**
 * Carica un File o Blob su R2 nella cartella media/ (permanente, nessuna scadenza).
 * @param {File|Blob} file
 * @returns {Promise<string>} URL pubblico permanente
 */
export async function uploadMediaToR2(file) {
  const fileName = file.name || `media-${Date.now()}.jpg`

  const arrayBuffer = await file.arrayBuffer()
  const bytes       = new Uint8Array(arrayBuffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const fileBase64 = btoa(binary)

  const res = await authFetch(UPLOAD_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fileName, contentType: file.type || 'image/jpeg', fileBase64 }),
  })

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || `Upload R2 fallito: ${res.status}`)
  return data.url
}
