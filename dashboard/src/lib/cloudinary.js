/**
 * Migrato a ImageKit — cloudinaryThumb ora delega a imagekitThumb.
 * Le vecchie URL Cloudinary vengono restituite invariate (account sospeso).
 */
import { imagekitThumb } from './imagekit-thumb.js'

export function cloudinaryThumb(url, width = 200) {
  return imagekitThumb(url, width)
}
