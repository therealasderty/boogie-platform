import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import MenuLista from '@/components/MenuLista'
import AltreSpecialita from '@/components/AltreSpecialita'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMenuPizza } from '@/lib/menu'
import { fetchMedia } from '@/lib/media'
import { openGraphImageUrl } from '@/lib/imagekit-delivery'

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('pizza')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: 'Pizza Artigianale a Lunga Lievitazione | Boogie Bistrot Colle Brianza',
    description: 'Pizza artigianale al Boogie Bistrot di Colle Brianza: impasto a lunga lievitazione, forno a legna e ingredienti freschi selezionati. Prenota un tavolo!',
    openGraph: {
      title: 'Pizza Artigianale a Lunga Lievitazione | Boogie Bistrot Colle Brianza',
      description: 'Pizza artigianale al Boogie Bistrot di Colle Brianza: impasto a lunga lievitazione, forno a legna e ingredienti freschi selezionati. Prenota un tavolo!',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'La pizza di Boogie Bistrot' }],
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

export default async function PizzaPage() {
  const [sezioni, mediaPizza] = await Promise.all([
    fetchMenuPizza(),
    fetchMedia('pizza'),
  ])

  const immagini = mediaPizza.length > 0
    ? mediaPizza.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : [
        { src: '/images/hero/2.avif', alt: 'La pizza di Boogie Bistrot' },
        { src: '/images/hero/1.webp', alt: 'Il forno a legna' },
      ]

  return (
    <main>
      <PaginaHero
        titolo="La Pizza"
        sottotitolo="I nostri menù"
        tagline="Impasto a lunga lievitazione, cotto nel forno a legna"
        image={immagini[0].src}
      />
      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Menù', href: '/#menu' },
          { label: 'La Pizza' },
        ]}
        label="La nostra pizza"
        titolo="La nostra passione per la pizza si esprime in ogni morso"
        testo="<p>Al Boogie Bistrot di Colle Brianza, il nostro <strong>maestro pizzaiolo con oltre 20 anni di esperienza</strong> lavora sapientemente l'impasto e lo cuoce alla perfezione nel nostro <strong>forno a legna tradizionale</strong>.</p><br/><p>Selezioniamo con cura <strong>ingredienti di prima qualità</strong>, privilegiando <strong>prodotti locali della Brianza</strong>. La nostra pizza ha conquistato i palati più esigenti grazie all'<strong>impasto croccante fuori e soffice dentro</strong>, che esalta i sapori dei condimenti freschi di stagione.</p><br/><p>Vieni a scoprire il gusto autentico della nostra <strong>pizza artigianale</strong> nella cornice naturale di Colle Brianza.</p>"
        immagini={immagini.length > 1 ? immagini.slice(1) : immagini}
      />
      <MenuLista sezioni={sezioni} />
      <AltreSpecialita escludi="/menu/pizza" />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
