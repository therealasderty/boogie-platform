import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import SezioneFAQAccordion from '@/components/SezioneFAQAccordion'
import { fetchFaq } from '@/lib/faq'
import { fetchMedia } from '@/lib/media'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Domande frequenti | Boogie Bistrot',
  description: 'Trova le risposte alle domande più comuni su Boogie Bistrot: prenotazioni, parcheggio, eventi privati, menu e molto altro.',
}

export default async function FaqPage() {
  const [faq, media] = await Promise.all([fetchFaq(), fetchMedia('location')])
  const heroImage = media.length > 0
    ? media[Math.floor(Math.random() * media.length)].url
    : '/images/hero/sala-boogie-bistrot-colle-brianza.webp'

  return (
    <main>
      <PaginaHero
        titolo="Domande frequenti"
        sottotitolo="FAQ"
        image={heroImage}
      />

      <section className="py-20 md:py-28" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto px-6 md:px-14">
          <span
            className="uppercase text-white/30 font-medium"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            Domande frequenti
          </span>
          <h2
            className="font-semibold text-white leading-snug mt-4 mb-12"
            style={{ fontSize: 'var(--text-section)' }}
          >
            Tutto quello che vuoi sapere
          </h2>

          {faq.length > 0 ? (
            <SezioneFAQAccordion faq={faq} />
          ) : (
            <p className="text-white/40 font-light" style={{ fontSize: 'var(--text-meta)' }}>
              Nessuna domanda disponibile al momento.
            </p>
          )}

          <p className="text-white/40 font-light mt-12 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Non trovi risposta? Scrivici a{' '}
            <a href="mailto:info@boogiebistrot.com" className="text-white/60 hover:text-white transition-colors underline underline-offset-2">
              info@boogiebistrot.com
            </a>
          </p>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
