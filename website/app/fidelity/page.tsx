import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'

export const metadata: Metadata = {
  title: 'Fidelity Card | Boogie Bistrot Colle Brianza | Premi e Vantaggi',
  description: 'Iscriviti alla Fidelity Card del Boogie Bistrot e accumula punti ad ogni visita. Premi, sconti e sorprese per i clienti più fedeli di Colle Brianza.',
  openGraph: {
    title: 'Fidelity Card | Boogie Bistrot Colle Brianza | Premi e Vantaggi',
    description: 'Iscriviti alla Fidelity Card del Boogie Bistrot e accumula punti ad ogni visita. Premi, sconti e sorprese per i clienti più fedeli di Colle Brianza.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormFidelity from '@/components/FormFidelity'
import { fetchMedia } from '@/lib/media'

const PREMI = [
  { punti: 2500,  premio: '2 Cocktail omaggio',                                                        icona: '🍹' },
  { punti: 5000,  premio: '2 Dolci a scelta',                                                          icona: '🍮' },
  { punti: 7500,  premio: '4 Pizze da asporto',                                                        icona: '🍕' },
  { punti: 10000, premio: '4 Pizze e 4 bibite al Boogie',                                              icona: '🍕' },
  { punti: 15000, premio: '2 portate + dolce a scelta dalla nostra carta (bevande escluse)',            icona: '🍽️' },
]

function formatPunti(n: number) {
  return n.toLocaleString('it-IT')
}

export default async function FidelityPage() {
  const mediaLocation = await fetchMedia('location')
  const heroImage = mediaLocation.length > 0
    ? mediaLocation[Math.floor(Math.random() * mediaLocation.length)].url
    : '/images/hero/giardino-boogie-bistrot-colle-brianza.avif'

  return (
    <main>
      <PaginaHero
        titolo="Programma Boogie Fidelity"
        sottotitolo="Fidelity Card"
        tagline="Il programma che premia ogni visita"
        image={heroImage}
      />

      {/* ── Introduzione ── */}
      <section className="py-20 px-6 md:px-14 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Come funziona
            </span>
            <h2 className="font-semibold text-neutral-900 mt-4 mb-5 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
              Boogie Fidelity: il programma che premia ogni visita
            </h2>
            <p className="text-neutral-500 font-light leading-relaxed mb-8" style={{ fontSize: 'var(--text-body)' }}>
              Inizia subito a raccogliere vantaggi. Il nostro programma fedeltà è pensato per premiarti ogni volta
              che scegli Boogie Bistrot. Con <strong className="text-neutral-700 font-medium">5 punti per ogni euro speso</strong>,
              potrai presto goderti spritz omaggio, dessert, sconti e persino cene complete.
              La registrazione è semplice e gratuita — più ci visiti, prima raggiungi il tuo prossimo premio!
            </p>

            {/* Callout punti */}
            <div className="flex items-center gap-5 rounded-card border border-brand/30 bg-brand/5 px-6 py-5">
              <div className="text-center flex-shrink-0">
                <span className="font-ivy font-normal text-brand leading-none" style={{ fontSize: '2.5rem' }}>5</span>
                <span className="block text-brand/70 font-medium uppercase mt-1" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>punti</span>
              </div>
              <div className="w-px h-10 bg-brand/20 flex-shrink-0" />
              <div>
                <span className="text-neutral-800 font-medium block" style={{ fontSize: 'var(--text-lead)' }}>= 1€ speso</span>
                <span className="text-neutral-500 font-light mt-1 block" style={{ fontSize: 'var(--text-meta)' }}>
                  Ad esempio: una cena da 40€ ti dà subito <strong className="text-neutral-700 font-medium">200 punti</strong>
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Catalogo premi ── */}
      <section className="py-20 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-white/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Catalogo premi
            </span>
            <h2 className="font-semibold text-white mt-4 mb-10 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
              Cosa puoi sbloccare
            </h2>
          </FadeIn>

          <div className="flex flex-col">
            {PREMI.map((p, i) => (
              <FadeIn key={p.punti} delay={i * 0.07}>
                <div className="flex items-center gap-5 py-5 border-b border-white/8">
                  <div className="flex-shrink-0 w-24 text-right">
                    <span className="font-ivy font-normal text-brand leading-none" style={{ fontSize: 'var(--text-section)' }}>
                      {formatPunti(p.punti)}
                    </span>
                    <span className="block text-brand/50 font-medium uppercase" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                      punti
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-px h-10 bg-white/10" />
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span style={{ fontSize: 'var(--text-lead)' }}>{p.icona}</span>
                    <span className="text-white/80 font-light leading-snug" style={{ fontSize: 'var(--text-body)' }}>
                      {p.premio}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form iscrizione ── */}
      <section id="iscriviti" className="py-20 px-6 md:px-14 bg-white">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Registrazione gratuita
            </span>
            <h2 className="font-semibold text-neutral-900 mt-4 mb-4 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
              Iscriviti ora
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-green-50 border border-green-200 text-green-700 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
                ✓ Completamente gratuita
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-neutral-100 border border-neutral-200 text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
                ✓ Nessun obbligo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-neutral-100 border border-neutral-200 text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
                ✓ Punti subito dalla prima visita
              </span>
            </div>
            <p className="text-neutral-500 font-light leading-relaxed mb-10" style={{ fontSize: 'var(--text-body)' }}>
              Compila il modulo qui sotto — bastano pochi secondi per attivare la tua card e iniziare ad accumulare punti.
            </p>
            <FormFidelity />
          </FadeIn>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
