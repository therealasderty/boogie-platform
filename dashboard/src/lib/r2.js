/**
 * r2.js — upload slide social su Cloudflare R2 tramite Netlify Function.
 * Sostituisce uploadToImageKit per i post del Social Studio.
 *
 * Il file non viene mai esposto direttamente al browser: passa per
 * /.netlify/functions/upload-slide che firma con AWS SigV4 server-side.
 */

const UPLOAD_ENDPOINT = '/.netlify/functions/upload-slide'

/**
 * Carica un File o Blob su R2.
 * @param {File|Blob} file
 * @returns {Promise<string>} URL pubblico permanente (con TTL 7gg lato R2)
 */
export async function uploadToR2(file) {
  const fileName = file.name || `slide-${Date.now()}.png`

  // Converti in base64
  const arrayBuffer = await file.arrayBuffer()
  const fileBase64  = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const res = await fetch(UPLOAD_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fileName,
      contentType: file.type || 'image/png',
      fileBase64,
    }),
  })

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || `Upload R2 fallito: ${res.status}`)
  return data.url
}
