/**
 * Genera URL thumbnail via ImageKit (trasformazioni gratuite, zero crediti).
 * Funziona solo su URL ImageKit — restituisce l'originale per altri domini.
 * Non richiede credenziali — solo trasformazione stringa URL.
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
