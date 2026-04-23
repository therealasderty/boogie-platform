import { fetchMedia } from '@/lib/media'
import SezioneContattiClient from './SezioneContattiClient'

export default async function SezioneContatti() {
  let fotoSrc = '/images/hero/2.avif'
  let fotoAlt = 'Boogie Bistrot'

  try {
    const foto = await fetchMedia('location')
    if (foto.length > 0) {
      fotoSrc = foto[0].url
      fotoAlt = foto[0].alt || 'Boogie Bistrot'
    }
  } catch {}

  return <SezioneContattiClient fotoSrc={fotoSrc} fotoAlt={fotoAlt} />
}
