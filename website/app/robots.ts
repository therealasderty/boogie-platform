import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/design/', '/conferma-prenotazione', '/feedback'],
    },
    sitemap: 'https://boogiebistrot.com/sitemap.xml',
  }
}
