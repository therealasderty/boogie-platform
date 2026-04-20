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
  const [mediaLocation, mediaCarta] = await Promise.all([
    fetchMedia('location'),
    fetchMedia('carta'),
  ])
  const immaginiLocation = mediaLocation.map(m => ({ src: m.url, alt: m.alt || m.nome }))
  const immaginiCarta = mediaCarta.map(m => ({ src: m.url, alt: m.alt || m.nome }))

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
        nascondiImmagineMobile
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Galleria' },
        ]}
        label="I nostri spazi"
        titolo="Un viaggio visivo nel cuore del Boogie Bistrot"
        testo="<p>Ti diamo il benvenuto nella nostra galleria fotografica. Queste immagini ti faranno scoprire il <strong>Boogie Bistrot</strong> in ogni suo aspetto: dai piatti della nostra cucina, che unisce <strong>tradizione brianzola e creatività</strong>, agli spazi della nostra location storica a Colle Brianza.</p><br/><p>Sfogliando queste foto, potrai vedere il nostro <strong>giardino</strong>, particolarmente apprezzato nelle serate estive per la sua naturale frescura, e i nostri piatti più amati.</p><br/><p>Le immagini parlano spesso più delle parole... ma <strong>l'esperienza dal vivo è ancora meglio!</strong></p>"
        immagini={[
          { src: '/images/hero/2.avif', alt: 'Il giardino di Boogie Bistrot' },
          { src: '/images/hero/1.webp', alt: 'Le sale interne' },
        ]}
      />
      {/* Galleria fotografica — su desktop usa tag location + carta */}
      <MosaicoFoto immagini={[...immaginiLocation, ...immaginiCarta].length > 0 ? [...immaginiLocation, ...immaginiCarta] : undefined} />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
