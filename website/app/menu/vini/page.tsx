import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'

export const revalidate = 86400
import MenuLista from '@/components/MenuLista'
import AltreSpecialita from '@/components/AltreSpecialita'
import SezioneFAQ from '@/components/SezioneFAQ'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import { fetchMenuVini } from '@/lib/menu'
import { fetchMedia } from '@/lib/media'
import { openGraphImageUrl } from '@/lib/imagekit-delivery'

export async function generateMetadata(): Promise<Metadata> {
  const media = await fetchMedia('vino')
  const ogImage = openGraphImageUrl(media[0]?.url ?? '/og-image.jpg')
  return {
    title: 'Carta dei Vini | Boogie Bistrot Colle Brianza | Vini Italiani Selezionati',
    description: 'Esplora la carta dei vini del Boogie Bistrot di Colle Brianza: una selezione curata di etichette italiane e internazionali per accompagnare ogni piatto della tradizione brianzola.',
    openGraph: {
      title: 'Carta dei Vini | Boogie Bistrot Colle Brianza | Vini Italiani Selezionati',
      description: 'Esplora la carta dei vini del Boogie Bistrot di Colle Brianza: una selezione curata di etichette italiane e internazionali per accompagnare ogni piatto della tradizione brianzola.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Carta dei vini — Boogie Bistrot' }],
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

export default async function ViniPage() {
  const [sezioni, mediaVini] = await Promise.all([
    fetchMenuVini(),
    fetchMedia('vino'),
  ])

  const immagini = mediaVini.length > 0
    ? mediaVini.map(m => ({ src: m.url, alt: m.alt || m.nome }))
    : [
        { src: '/images/hero/2.avif', alt: 'Carta dei vini Boogie Bistrot' },
        { src: '/images/hero/1.webp', alt: 'La cantina' },
      ]

  return (
    <main>
      <PaginaHero
        titolo="Carta dei Vini"
        sottotitolo="I nostri menù"
        tagline="Una selezione curata tra territorio e grandi etichette"
        image={immagini[0].src}
      />
      <SezioneIntro
        inverti
        fotoContenuta
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Menù', href: '/#menu' },
          { label: 'Carta dei Vini' },
        ]}
        label="La nostra cantina"
        titolo="Le note più dolci sono racchiuse in un brindisi"
        testo="<p>La nostra passione per il vino si esprime in ogni calice. Al Boogie Bistrot di Colle Brianza, la <strong>carta dei vini</strong> è stata creata con la stessa cura e attenzione che dedichiamo a ogni piatto della nostra cucina. Abbiamo selezionato <strong>etichette che raccontano storie di territori e tradizioni</strong>, con particolare attenzione ai <strong>vini lombardi</strong> e alle eccellenze italiane che meglio si sposano con i sapori della nostra cucina brianzola.</p><br/><p>Dal momento dell'<strong>aperitivo</strong> fino al <strong>digestivo</strong>, ti accompagniamo in un percorso enologico che esalta ogni momento della tua esperienza gastronomica al Boogie Bistrot. Il nostro staff è pronto a consigliarti <strong>l'abbinamento perfetto</strong> per ogni piatto, dalle specialità della casa ai nostri primi piatti della tradizione brianzola rivisitata.</p><br/><p>Ogni bottiglia è stata scelta per raccontare una storia e creare un'emozione. Che tu sia un appassionato o un semplice curioso, la nostra selezione saprà stupirti con etichette che spaziano dalle <strong>bollicine di Franciacorta</strong> ai <strong>rossi strutturati</strong>, dai <strong>bianchi freschi e aromatici</strong> ai <strong>vini da meditazione</strong>.</p>"
        immagini={immagini.length > 1 ? immagini.slice(1) : immagini}
      />
      <MenuLista sezioni={sezioni} />
      <AltreSpecialita escludi="/menu/vini" />
      <SezioneFAQ />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
