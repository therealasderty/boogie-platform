/**
 * Utility Cloudinary condivisa — usata da SocialStudioPanel e MediaPanel.
 * Genera URL ridimensionato/ottimizzato da un URL Cloudinary originale.
 */
export function cloudinaryThumb(url, width = 200) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
}
