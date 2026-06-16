import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormPrenotazioneMultiStep from '@/components/FormPrenotazioneMultiStep'
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Prenota un tavolo | Boogie Bistrot',
  description: 'Prenota il tuo tavolo al Boogie Bistrot di Colle Brianza. Cucina del territorio, pizza tradizionale nel forno a legna e birre locali.',
  alternates: {
    canonical: '/prenota',
  },
}

const HERO_IMAGE = 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1780389706247-media_Gigapixel_Clipboard_6ffcc1ba8102abd5c2884e838be666d36cd9af33fc28067dc6f619f13f020147-gigapixel-low-resolution-v2-2'

export default async function PrenotaPage() {
  return (
    <main>
      <PaginaHero
        titolo="Prenota un tavolo"
        sottotitolo="Boogie Bistrot"
        tagline="Riserva il tuo posto — ti aspettiamo"
        image={HERO_IMAGE}
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
