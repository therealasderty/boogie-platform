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
export const revalidate = 259200

import SezioneIntro from '@/components/SezioneIntro'
import MosaicoFoto from '@/components/MosaicoFoto'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMedia } from '@/lib/media'

const FALLBACK_IMMAGINI = [
  { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Il giardino di Boogie Bistrot' },
  { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Le sale interne' },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default async function GalleriaPage() {
  const [mediaLocation, mediaCarta, mediaGalleria] = await Promise.all([
    fetchMedia('location'),
    fetchMedia('carta'),
    fetchMedia('galleria'),
  ])
  const immaginiLocation = mediaLocation.map(m => ({ src: m.url, alt: m.alt || m.nome }))
  const immaginiCarta = mediaCarta.map(m => ({ src: m.url, alt: m.alt || m.nome }))
  const immaginiGalleria = mediaGalleria.map(m => ({ src: m.url, alt: m.alt || m.nome }))

  const seen = new Set<string>()
  const tutteLeImmagini = shuffle(
    [...immaginiLocation, ...immaginiCarta, ...immaginiGalleria].filter(m => seen.has(m.src) ? false : (seen.add(m.src), true))
  )
  const heroImage = tutteLeImmagini[0]?.src ?? '/images/hero/giardino-boogie-bistrot-colle-brianza.avif'
  const immaginiCarousel = tutteLeImmagini.length > 0 ? tutteLeImmagini.slice(0, 4) : FALLBACK_IMMAGINI

  return (
    <main>
      <PaginaHero
        titolo="Galleria Fotografica"
        sottotitolo="La location"
        tagline="Il giardino, le sale, i piatti — scorri la nostra storia per immagini"
        image={heroImage}
      />
      <SezioneIntro
        inverti
        fotoContenuta
        nascondiImmagineMobile
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Galleria' },
        ]}
        label="I nostri spazi"
        titolo="Un viaggio visivo nel cuore del Boogie Bistrot"
        testo="<p>Ti diamo il benvenuto nella nostra galleria fotografica. Queste immagini ti faranno scoprire il <strong>Boogie Bistrot</strong> in ogni suo aspetto: dai piatti della nostra cucina, che unisce <strong>tradizione brianzola e creatività</strong>, agli spazi della nostra location storica a Colle Brianza.</p><br/><p>Sfogliando queste foto, potrai vedere il nostro <strong>giardino</strong>, particolarmente apprezzato nelle serate estive per la sua naturale frescura, e i nostri piatti più amati.</p><br/><p>Le immagini parlano spesso più delle parole... ma <strong>l'esperienza dal vivo è ancora meglio!</strong></p>"
        immagini={immaginiCarousel}
      />
      {/* Galleria fotografica — su desktop usa tag location + carta */}
      <MosaicoFoto immagini={tutteLeImmagini.length > 0 ? tutteLeImmagini : undefined} />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
