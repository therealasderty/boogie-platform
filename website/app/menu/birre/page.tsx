import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'

export const revalidate = 86400
import MenuLista from '@/components/MenuLista'
import AltreSpecialita from '@/components/AltreSpecialita'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMenuBirre } from '@/lib/menu'
import { fetchMedia } from '@/lib/media'
import { openGraphImageUrl } from '@/lib/imagekit-delivery'

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('birra')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: 'Birre Artigianali | Boogie Bistrot Colle Brianza | Selezione di Microbirrifici Locali',
    description: 'Scopri la selezione di birre artigianali del Boogie Bistrot a Colle Brianza: microbirrifici locali e internazionali scelti per accompagnare i nostri piatti tradizionali e le pizze a lunga lievitazione.',
    openGraph: {
      title: 'Birre Artigianali | Boogie Bistrot Colle Brianza | Selezione di Microbirrifici Locali',
      description: 'Scopri la selezione di birre artigianali del Boogie Bistrot a Colle Brianza: microbirrifici locali e internazionali scelti per accompagnare i nostri piatti tradizionali e le pizze a lunga lievitazione.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Le birre di Boogie Bistrot' }],
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

export default async function BirrePage() {
  const [sezioni, mediaBirre] = await Promise.all([
    fetchMenuBirre(),
    fetchMedia('birra'),
  ])

  const immagini = mediaBirre.length > 0
    ? mediaBirre.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : [
        { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Le birre di Boogie Bistrot' },
        { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Selezione birre' },
      ]

  return (
    <main>
      <PaginaHero
        titolo="Le Birre"
        sottotitolo="I nostri menù"
        tagline="Birre selezionate con cura dalla Lombardia e oltre"
        image={immagini[0].src}
      />
      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Menù', href: '/#menu' },
          { label: 'Le Birre' },
        ]}
        label="La nostra selezione"
        titolo="Qualità e ricerca: le nostre fondamenta"
        testo="<p>La nostra passione per la <strong>birra artigianale</strong> si esprime in ogni sorso. Al Boogie Bistrot di Colle Brianza, la selezione di birre è stata curata con attenzione per offrire un'esperienza autentica agli amanti del luppolo e a chi desidera scoprire nuove proposte. Abbiamo scelto etichette che raccontano storie di territori, maestria e tradizione, privilegiando <strong>microbirrifici locali lombardi</strong> e specialità internazionali che meglio si sposano con i sapori della nostra cucina.</p><br/><p>Dalla <strong>bionda leggera e dissetante</strong> alla <strong>scura corposa e strutturata</strong>, ogni birra nella nostra carta è stata selezionata per la sua personalità unica e la capacità di creare abbinamenti memorabili con i nostri piatti. Le nostre <strong>pizze a lunga lievitazione cotte nel forno a legna</strong> trovano nelle birre artigianali il compagno ideale per un'esperienza gastronomica completa.</p><br/><p>Ogni bottiglia e spillatura è stata scelta per raccontare una storia e creare un'emozione. Che tu sia un appassionato o semplicemente curioso, la nostra selezione saprà stupirti con etichette che spaziano dalle <strong>birre chiare</strong> alle <strong>ambrate</strong>, dalle <strong>IPA aromatiche</strong> alle <strong>Stout dal carattere deciso</strong>.</p>"
        immagini={immagini.length > 1 ? immagini.slice(1) : immagini}
      />
      <MenuLista sezioni={sezioni} />
      <AltreSpecialita escludi="/menu/birre" />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
