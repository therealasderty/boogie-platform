import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'

export const metadata: Metadata = {
  title: 'Galleria Foto | Boogie Bistrot Colle Brianza | Ristorante con Giardino',
  description: 'Sfoglia la galleria del Boogie Bistrot di Colle Brianza: il giardino estivo, la sala interna, i piatti e l\'atmosfera unica del nostro ristorante.',
  openGraph: {
    title: 'Galleria Foto | Boogie Bistrot Colle Brianza | Ristorante con Giardino',
    description: 'Sfoglia la galleria del Boogie Bistrot di Colle Brianza: il giardino estivo, la sala interna, i piatti e l\'atmosfera unica del nostro ristorante.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}
import SezioneIntro from '@/components/SezioneIntro'
import MosaicoFoto from '@/components/MosaicoFoto'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMedia } from '@/lib/media'

export default async function GalleriaPage() {
  const mediaGalleria = await fetchMedia('galleria')
  const immagini = mediaGalleria.map(m => ({ src: m.url, alt: m.alt || m.nome }))

  return (
    <main>
      <PaginaHero
        titolo="Galleria Fotografica"
        sottotitolo="La location"
        tagline="Il giardino, le sale, i piatti — scorri la nostra storia per immagini"
        image="/images/hero/1.webp"
      />
      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Galleria' },
        ]}
        label="I nostri spazi"
        titolo="Un luogo che vale una visita, prima ancora di sedersi a tavola"
        testo="<p>Il Boogie Bistrot è prima di tutto un luogo. Un giardino che cambia con le stagioni, sale interne che raccontano una storia, angoli curati in ogni dettaglio. Queste foto sono un assaggio di quello che ti aspetta.</p><br/><p>Dal tavolo sotto il pergolato alla sala con il camino in inverno: ogni spazio ha la sua personalità, ogni visita la sua atmosfera.</p>"
        immagini={[
          { src: '/images/hero/2.avif', alt: 'Il giardino di Boogie Bistrot' },
          { src: '/images/hero/1.webp', alt: 'Le sale interne' },
        ]}
      />
      <MosaicoFoto immagini={immagini.length > 0 ? immagini : undefined} />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
