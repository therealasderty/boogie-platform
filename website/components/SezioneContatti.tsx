import { fetchMedia } from '@/lib/media'
import SezioneContattiClient from './SezioneContattiClient'

export default async function SezioneContatti() {
  let fotoSrc = '/images/hero/2.avif'
  let fotoAlt = 'Boogie Bistrot'

  try {
    const [location, chiSiamo] = await Promise.all([
      fetchMedia('location'),
      fetchMedia('chi-siamo'),
    ])
    const pool = [...location, ...chiSiamo].filter(m => m.url)
    if (pool.length > 0) {
      // Seed giornaliero deterministico: stessa foto per tutto il giorno, cambia ogni mezzanotte
      const seed = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''), 10)
      const scelta = pool[seed % pool.length]
      fotoSrc = scelta.url
      fotoAlt = scelta.alt || 'Boogie Bistrot'
    }
  } catch {}

  return <SezioneContattiClient fotoSrc={fotoSrc} fotoAlt={fotoAlt} />
}
