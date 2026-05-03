const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

const CLOUDINARY_UPLOAD_MARKER = '/image/upload/'

/**
 * Per immagini hero da Cloudinary (upload): inserisce trasformazioni delivery così il file
 * scaricato da `next/image` è già limitato in pixel e peso (LCP).
 * Per altri URL remoti usa fetch + trasformazioni. Path locali "/" invariati.
 */
export function optimizeHeroImageSrc(
  src: string,
  opts: { maxWidth?: number } = {}
): string {
  const maxWidth = opts.maxWidth ?? 1920
  if (!src || src.startsWith('/') || src.startsWith('data:')) return src

  try {
    const u = new URL(src)
    if (!u.hostname.includes('res.cloudinary.com')) {
      return cloudinaryUrl(src, { width: maxWidth, quality: 78 })
    }

    const path = u.pathname
    const i = path.indexOf(CLOUDINARY_UPLOAD_MARKER)
    if (i === -1) {
      return cloudinaryUrl(src, { width: maxWidth, quality: 78 })
    }

    const rest = path.slice(i + CLOUDINARY_UPLOAD_MARKER.length)
    const firstSeg = rest.split('/')[0] || ''
    if (firstSeg.includes(',') || /^w_\d/.test(firstSeg)) {
      return src
    }

    const transforms = `w_${maxWidth},c_limit,q_auto:good,f_auto`
    const newPath =
      path.slice(0, i + CLOUDINARY_UPLOAD_MARKER.length) + transforms + '/' + rest
    u.pathname = newPath
    return u.toString()
  } catch {
    return cloudinaryUrl(src, { width: maxWidth, quality: 78 })
  }
}

/**
 * Restituisce l'URL ottimizzato tramite Cloudinary (modalità fetch).
 * Se NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME non è configurato, restituisce l'URL originale.
 * Gli URL locali (che iniziano con "/") vengono lasciati invariati — Next.js li ottimizza nativamente.
 */
export function cloudinaryUrl(
  src: string,
  options: { width?: number; quality?: number } = {}
): string {
  if (!CLOUD_NAME) return src
  if (!src || src.startsWith('/') || src.startsWith('data:')) return src

  const { width = 1200, quality = 80 } = options

  const transforms = `f_auto,q_${quality},w_${width}`
  const encoded = encodeURIComponent(src)
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms}/${encoded}`
}
