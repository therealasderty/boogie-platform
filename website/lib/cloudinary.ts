// Le immagini del sito vengono ottimizzate nativamente da Next.js <Image>
// tramite remotePatterns in next.config.ts — nessun proxy Cloudinary necessario.
// Cloudinary è usato solo nel dashboard per l'upload delle slide social.

export function optimizeHeroImageSrc(src: string): string {
  return src ?? ''
}

export function cloudinaryUrl(src: string): string {
  return src ?? ''
}
