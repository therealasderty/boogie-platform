import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormPrenotazione from '@/components/FormPrenotazione'

export const metadata: Metadata = {
  title: 'Prenota un tavolo | Boogie Bistrot',
  description: 'Prenota il tuo tavolo al Boogie Bistrot di Colle Brianza. Cucina del territorio, pizza tradizionale nel forno a legna e birre locali.',
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
            <p className="text-black/50 leading-relaxed mb-10" style={{ fontSize: 'var(--text-lead)' }}>
              Scegli la data e l&apos;orario, compila i tuoi dati e invia la richiesta.
              Riceverai una conferma via email entro pochi minuti.
            </p>
            <FormPrenotazione />
          </FadeIn>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
