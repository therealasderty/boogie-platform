/**
 * Loader globale per `next/image`.
 *
 * - URL ImageKit (vecchie immagini): trasformazione via ImageKit CDN
 * - Tutti gli altri URL esterni (R2, Airtable…):
 *     produzione → Netlify Image CDN (zero egress da R2, ottimizzazione WebP/AVIF)
 *     sviluppo   → URL originale (Netlify Image CDN non disponibile con `next dev`)
 */

import { imageKitUrlWithTransforms } from './lib/imagekit-delivery'

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (!src) return src
  if (src.startsWith('/') && !src.startsWith('//')) return src
  if (!src.startsWith('http')) return src

  // Vecchie immagini ImageKit — mantieni trasformazione
  if (src.includes('ik.imagekit.io')) {
    return imageKitUrlWithTransforms(src, width, quality)
  }

  // R2 e altri URL esterni — Netlify Image CDN in produzione
  if (process.env.NODE_ENV === 'production') {
    const q = Math.min(Math.max(Math.round((quality ?? 75) * 0.94), 48), 72)
    return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=${q}&fm=webp`
  }

  // Sviluppo: URL originale
  return src
}
