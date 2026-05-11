/**
 * Loader globale per `next/image` — delega a `imageKitUrlWithTransforms`.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/images#imagekitio
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

  if (src.startsWith('/') && !src.startsWith('//')) {
    return src
  }

  if (!src.startsWith('http')) {
    return src
  }

  return imageKitUrlWithTransforms(src, width, quality)
}
