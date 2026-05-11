/**
 * URL ImageKit con trasformazioni nel path (meno byte rispetto all’originale).
 * Usato dal loader globale `next/image` e da meta/OG dove serve un URL diretto.
 */

const IK_PREFIX = /^https:\/\/ik\.imagekit\.io\/[^/]+\//

function stripImageKitPathTransforms(url: string): string {
  return url
    .replace(/(https:\/\/ik\.imagekit\.io\/[^/]+)\/tr:[^/]+(?=\/)/, '$1')
    .replace(/(https:\/\/ik\.imagekit\.io\/[^/]+)\/tr:[^/]+$/, '$1')
}

/** Immagine condivisa social / meta: larghezza fissa, qualità moderata. */
export function openGraphImageUrl(url: string): string {
  if (!url?.startsWith('http')) return url
  if (!url.includes('ik.imagekit.io')) return url
  return imageKitUrlWithTransforms(url, 1200, 70)
}

export function imageKitUrlWithTransforms(
  src: string,
  width: number,
  quality = 75
): string {
  if (!src?.includes('ik.imagekit.io')) return src

  try {
    const parsed = new URL(src)
    if (parsed.hostname !== 'ik.imagekit.io') return src

    const base = stripImageKitPathTransforms(src)
    const w = Math.min(Math.max(width, 1), 3840)
    // Allinea la qualità a PageSpeed: leggermente sotto il default Next (~75)
    const qIn = quality ?? 70
    const q = Math.min(Math.max(Math.round(qIn * 0.94), 48), 72)

    return base.replace(IK_PREFIX, (m) => `${m}tr:w-${w},q-${q},f-auto,fo-auto/`)
  } catch {
    return src
  }
}
