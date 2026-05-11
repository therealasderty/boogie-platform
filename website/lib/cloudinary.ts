// Le immagini esterne passano da `next/image` con loader globale (`image-loader.ts`):
// su ImageKit si applicano trasformazioni nel path (meno banda). Cloudinary resta
// solo nel dashboard per le slide social.

export function optimizeHeroImageSrc(src: string): string {
  return src ?? ''
}

export function cloudinaryUrl(src: string): string {
  return src ?? ''
}
