import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'

export const revalidate = 86400
import MenuLista from '@/components/MenuLista'
import AltreSpecialita from '@/components/AltreSpecialita'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMenuCocktails } from '@/lib/menu'
import { fetchMedia } from '@/lib/media'
import { openGraphImageUrl } from '@/lib/imagekit-delivery'

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('cocktail')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: 'Cocktail e Aperitivi | Boogie Bistrot Colle Brianza',
    description: 'Aperitivi, long drink e signature cocktail preparati al momento al Boogie Bistrot di Colle Brianza. Scopri la nostra selezione di drink e vieni a trovarci.',
    openGraph: {
      title: 'Cocktail e Aperitivi | Boogie Bistrot Colle Brianza',
      description: 'Aperitivi, long drink e signature cocktail preparati al momento al Boogie Bistrot di Colle Brianza. Scopri la nostra selezione di drink e vieni a trovarci.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Cocktails — Boogie Bistrot' }],
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

export default async function CocktailsPage() {
  const [sezioni, mediaCocktails] = await Promise.all([
    fetchMenuCocktails(),
    fetchMedia('cocktail'),
  ])

  const immagini = mediaCocktails.length > 0
    ? mediaCocktails.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : [
        { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Cocktails Boogie Bistrot' },
        { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Il bar di Boogie' },
      ]

  return (
    <main>
      <PaginaHero
        titolo="Cocktails"
        sottotitolo="I nostri menù"
        tagline="Aperitivi, long drink e signature cocktail preparati al momento"
        image={immagini[0].src}
      />
      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Menù', href: '/#menu' },
          { label: 'Cocktails' },
        ]}
        label="Il nostro bar"
        titolo="L'essenza del Boogie in ogni sorso"
        testo="<p>La nostra passione per i <strong>cocktail</strong> si esprime in ogni bicchiere. Al Boogie Bistrot di Colle Brianza, la nostra selezione di drink è stata curata con attenzione per offrirti un'esperienza piacevole sia in <strong>aperitivo</strong> che per concludere la serata dopo cena. Proponiamo <strong>grandi classici della mixology</strong> e alcune preparazioni esclusive, realizzate con <strong>ingredienti di qualità</strong> e servite con cura.</p><br/><p>Ogni cocktail nella nostra carta è pensato per accompagnare perfettamente il tuo momento di relax, che sia prima di gustare le specialità della nostra cucina o per concludere la serata in compagnia. La <strong>freschezza degli ingredienti</strong> e la <strong>precisione nella preparazione</strong> sono i principi che guidano il nostro servizio al bar.</p><br/><p>Dall'iconico <strong>Gin Tonic</strong> al tradizionale <strong>Milano-Torino</strong>, ogni drink racconta una storia. Il nostro staff è pronto a consigliarti il cocktail più adatto ai tuoi gusti o a preparare, su richiesta, anche drink che non compaiono nella nostra selezione.</p>"
        immagini={immagini.length > 1 ? immagini.slice(1) : immagini}
      />
      <MenuLista sezioni={sezioni} />
      <AltreSpecialita escludi="/menu/cocktails" />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
