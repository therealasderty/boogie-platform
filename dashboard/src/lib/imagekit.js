/**
 * ImageKit — helper upload e ottimizzazione immagini.
 * Sostituisce Cloudinary (zero crediti, trasformazioni gratuite via URL).
 */

const IK_URL         = import.meta.env.VITE_IMAGEKIT_URL          // https://ik.imagekit.io/ntd5nq5ml
const IK_PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY  // private_xxx

/**
 * Carica un file o Blob su ImageKit.
 * @param {File|Blob} file
 * @param {string} [folder]  es. "media" o "social_posts"
 * @returns {Promise<string>} URL pubblico del file
 */
export async function uploadToImageKit(file, folder = 'media') {
  if (!IK_PRIVATE_KEY) throw new Error('VITE_IMAGEKIT_PRIVATE_KEY non configurata')

  const auth     = btoa(`${IK_PRIVATE_KEY}:`)
  const fileName = file.name || `upload-${Date.now()}.jpg`

  const fd = new FormData()
  fd.append('file', file, fileName)
  fd.append('fileName', fileName)
  fd.append('folder', folder)

  const res  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method:  'POST',
    headers: { 'Authorization': `Basic ${auth}` },
    body:    fd,
  })
  const data = await res.json()
  if (!res.ok || data.message) throw new Error(data.message || `Upload fallito: ${res.status}`)
  return data.url
}

/**
 * Genera URL thumbnail via ImageKit (trasformazioni gratuite, zero crediti).
 * Funziona solo su URL ImageKit — restituisce l'originale per altri domini.
 */
export function imagekitThumb(url, width = 200) {
  if (!url) return url
  if (!url.includes('ik.imagekit.io')) return url
  // Inserisce /tr:w-200,fo-auto/ dopo l'ID account
  return url.replace(
    /^(https:\/\/ik\.imagekit\.io\/[^/]+\/)/,
    `$1tr:w-${width},fo-auto/`
  )
}
