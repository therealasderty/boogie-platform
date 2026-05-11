import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import MenuCarta from '@/components/MenuCarta'
import AltreSpecialita from '@/components/AltreSpecialita'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMenuSpecialita } from '@/lib/menu'
import { fetchMedia } from '@/lib/media'
import { openGraphImageUrl } from '@/lib/imagekit-delivery'

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('carta')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: 'Specialità della Cucina Brianzola | Boogie Bistrot Colle Brianza',
    description: 'Menu alla carta del Boogie Bistrot: scopri i piatti della tradizione brianzola rivisitati con creatività. Cucina di qualità in location con giardino.',
    openGraph: {
      title: 'Specialità della Cucina Brianzola | Boogie Bistrot Colle Brianza',
      description: 'Menu alla carta del Boogie Bistrot: scopri i piatti della tradizione brianzola rivisitati con creatività. Cucina di qualità in location con giardino.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Specialità alla carta — Boogie Bistrot' }],
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

const CATEGORIE_INCLUSE = ['antipasti', 'primi', 'secondi']

function includiSezione(titolo: string) {
  const t = titolo.toLowerCase()
  return CATEGORIE_INCLUSE.some(c => t.includes(c))
}

function pickFirst<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n)
}

export default async function SpecialitaAllaCartaPage() {
  const [sezioni, mediaCarta] = await Promise.all([
    fetchMenuSpecialita(),
    fetchMedia('carta'),
  ])

  const immaginiCarta = mediaCarta.length > 0
    ? mediaCarta.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : [
        { src: '/images/hero/1.webp', alt: 'Specialità alla carta' },
        { src: '/images/hero/2.avif', alt: 'Cucina Boogie Bistrot' },
      ]

  const vociPerIntro = sezioni
    .filter(s => includiSezione(s.titolo))
    .flatMap(s => s.voci)
  const campioni = pickFirst(vociPerIntro, 3)
  const nomiPiatti = campioni.length > 0
    ? campioni.map(v => `<strong>${v.nome}</strong>`).join(', ')
    : '<strong>antipasti, primi e secondi</strong>'

  const testo = `<p>Nel cuore di Colle Brianza, il Boogie Bistrot ti invita a scoprire l'<strong>autentica cucina brianzola rivisitata</strong> con un tocco contemporaneo. La nostra carta celebra i sapori del territorio, con <strong>ingredienti freschi selezionati dai migliori produttori locali</strong>.</p><br/><p>Ogni piatto racconta una storia di passione e ricerca. Dalla nostra carta: ${nomiPiatti} — e tante altre proposte che si evolvono con le stagioni, mantenendo sempre quel legame speciale con la tradizione.</p><br/><p>Vivi questa esperienza unica in una location storica con <strong>ampio giardino</strong>, dove anche nelle sere d'estate potrai godere della naturale frescura che caratterizza il nostro ristorante in Brianza. Lasciati conquistare dai sapori autentici e dall'atmosfera accogliente che fanno del Boogie Bistrot uno dei ristoranti più apprezzati della zona.</p>`

  return (
    <main>

      <PaginaHero
        titolo="Specialità alla Carta"
        sottotitolo="I nostri menù"
        tagline="Piatti unici tradizionali rivisitati"
        image={immaginiCarta[0].src}
      />

      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Menù', href: '/#menu' },
          { label: 'Specialità alla Carta' },
        ]}
        label="La nostra cucina"
        titolo="Tradizione brianzola e creatività: l'essenza del nostro menu"
        testo={testo}
        immagini={immaginiCarta.length > 1 ? immaginiCarta.slice(1) : immaginiCarta}
      />

      <MenuCarta sezioni={sezioni} />

      <AltreSpecialita />

      <SezioneFAQ />

      <SezioneContatti />

      <Footer />

    </main>
  )
}
