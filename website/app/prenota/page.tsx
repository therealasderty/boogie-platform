import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormPrenotazioneMultiStep from '@/components/FormPrenotazioneMultiStep'
import { fetchMedia } from '@/lib/media'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Prenota un tavolo | Boogie Bistrot',
  description: 'Prenota il tuo tavolo al Boogie Bistrot di Colle Brianza. Cucina del territorio, pizza tradizionale nel forno a legna e birre locali.',
  alternates: {
    canonical: '/prenota',
  },
}

export default async function PrenotaPage() {
  const media = await fetchMedia('location')
  const heroImage = media[0]?.url || '/images/hero/sala-boogie-bistrot-colle-brianza.webp'

  return (
    <main>
      <PaginaHero
        titolo="Prenota un tavolo"
        sottotitolo="Boogie Bistrot"
        tagline="Riserva il tuo posto — ti aspettiamo"
        image={heroImage}
      />

      <section className="py-20 px-6 md:px-14 bg-white">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <FormPrenotazioneMultiStep />
          </FadeIn>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
