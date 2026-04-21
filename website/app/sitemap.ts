import type { MetadataRoute } from 'next'
import { fetchEventi } from '@/lib/agenda'
import { fetchLocalita } from '@/lib/localita'

const BASE_URL = process.env.SITO_URL || 'https://boogiebistrot.com'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pagine statiche
  const statiche: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/eventi-speciali`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/eventi-aziendali`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/menu/pizza`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/menu/specialita`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/menu/vini`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/menu/birre`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/menu/cocktails`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/galleria`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // Pagine eventi con slug
  let eventiEntries: MetadataRoute.Sitemap = []
  try {
    const eventi = await fetchEventi()
    eventiEntries = eventi
      .filter(e => e.slug && e.stato === 'attivo')
      .map(e => ({
        url:             `${BASE_URL}/eventi-speciali/${e.slug}`,
        lastModified:    new Date(),
        changeFrequency: 'weekly' as const,
        priority:        0.8,
      }))
  } catch {}

  // Pagine eventi aziendali per città
  let eventiAziendaliEntries: MetadataRoute.Sitemap = []
  try {
    const localita = await fetchLocalita()
    eventiAziendaliEntries = localita.map(l => ({
      url:             `${BASE_URL}/eventi-aziendali/${l.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'monthly' as const,
      priority:        0.7,
    }))
  } catch {}

  // Pagine local SEO
  let localitaEntries: MetadataRoute.Sitemap = []
  try {
    const localita = await fetchLocalita()
    for (const l of localita) {
      // Pagina città
      localitaEntries.push({
        url:             `${BASE_URL}/vicino-a/${l.slug}`,
        lastModified:    new Date(),
        changeFrequency: 'monthly' as const,
        priority:        0.7,
      })
      // Pagine servizio per città
      for (const s of l.serviziAttivi) {
        localitaEntries.push({
          url:             `${BASE_URL}/vicino-a/${l.slug}/${s}`,
          lastModified:    new Date(),
          changeFrequency: 'monthly' as const,
          priority:        0.6,
        })
      }
    }
  } catch {}

  return [...statiche, ...eventiEntries, ...eventiAziendaliEntries, ...localitaEntries]
}
