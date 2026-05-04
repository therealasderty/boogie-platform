import Image, { type ImageProps } from 'next/image'
import { cloudinaryUrl } from '@/lib/cloudinary'

// Shimmer placeholder SVG come blurDataURL (usato per immagini esterne)
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1a1a1a" offset="20%" />
      <stop stop-color="#2a2a2a" offset="50%" />
      <stop stop-color="#1a1a1a" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1a1a1a" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(unescape(encodeURIComponent(str)))

const blurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(16, 9))}`

type SmartImageProps = Omit<ImageProps, 'src' | 'alt' | 'blurDataURL'> & {
  src: string
  alt: string  // obbligatorio per SEO
  width: number
  height: number
  cloudinaryWidth?: number
  cloudinaryQuality?: number
}

export default function SmartImage({
  src,
  alt,
  width,
  height,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudinaryWidth: _cw,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cloudinaryQuality: _cq,
  ...props
}: SmartImageProps) {
  const optimizedSrc = cloudinaryUrl(src)

  // Per URL esterni usa placeholder shimmer; per path locali Next.js gestisce autonomamente
  const isExternal = src.startsWith('http')

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      placeholder={isExternal ? 'blur' : 'empty'}
      blurDataURL={isExternal ? blurDataURL : undefined}
      {...props}
    />
  )
}
