import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormPrenotazioneMultiStep from '@/components/FormPrenotazioneMultiStep'

export const metadata: Metadata = {
  title: 'Prenota un tavolo | Boogie Bistrot',
  description: 'Prenota il tuo tavolo al Boogie Bistrot di Colle Brianza. Cucina del territorio, pizza tradizionale nel forno a legna e birre locali.',
  // canonical esplicita: entrambe le varianti A/B vivono sullo stesso URL.
  // Evita penalizzazioni duplicate se in futuro si usasse un URL separato.
  alternates: {
    canonical: '/prenota',
  },
}

export default function PrenotaPage() {
  return (
    <main>
      <PaginaHero
        titolo="Prenota un tavolo"
        sottotitolo="Boogie Bistrot"
        tagline="Riserva il tuo posto — ti aspettiamo"
        image="/images/hero/1.webp"
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
