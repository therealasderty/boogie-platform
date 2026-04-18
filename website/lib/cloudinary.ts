const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

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
