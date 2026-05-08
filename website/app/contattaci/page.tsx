import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormContatti from '@/components/FormContatti'
import { fetchOrari, fetchChiusure, buildOrariLines } from '@/lib/orari'
import { fetchMedia } from '@/lib/media'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Contattaci | Boogie Bistrot',
  description: 'Scrivici un messaggio, chiamaci o vieni a trovarci. Boogie Bistrot — Via Europa, 2, Colle Brianza (LC).',
}

const PHONES = [
  '+39 039 9260568',
  '+39 346 5813309',
]

const MAPS_HREF = 'https://maps.google.com/?q=Via+Europa+2+Colle+Brianza'

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
      <path d="M9 1.5a5.5 5.5 0 0 1 5.5 5.5c0 4-5.5 9.5-5.5 9.5S3.5 11 3.5 7A5.5 5.5 0 0 1 9 1.5Z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="9" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
      <path d="M2.5 4.5C2.5 3.4 3.4 2.5 4.5 2.5h1.5a1 1 0 0 1 .95.68l.8 2.4a1 1 0 0 1-.23 1.02L6.5 7.6a9.5 9.5 0 0 0 3.9 3.9l1-1.02a1 1 0 0 1 1.02-.23l2.4.8a1 1 0 0 1 .68.95V13.5A2 2 0 0 1 13.5 15.5C7.15 15.5 2.5 10.85 2.5 4.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default async function ContattaciPage() {
  const [orari, chiusure, mediaLocation] = await Promise.all([fetchOrari(), fetchChiusure(), fetchMedia('location')])
  const orariDisplay = buildOrariLines(orari, chiusure)
  const heroImage = mediaLocation[0]?.url ?? '/images/hero/1.webp'

  return (
    <main>
      <PaginaHero
        titolo="Contattaci"
        sottotitolo="Boogie Bistrot"
        tagline="Siamo qui — scrivici, chiamaci o vieni a trovarci"
        image={heroImage}
      />

      <section className="py-20 px-6 md:px-14 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

            {/* ── Form ── */}
            <FadeIn>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                Scrivici
              </span>
              <h2 className="font-raleway font-semibold text-neutral-900 mt-4 mb-2 leading-tight" style={{ fontSize: '2.25rem' }}>
                Inviaci un messaggio
              </h2>
              <div className="w-10 h-px bg-neutral-200 mb-8" />
              <FormContatti />
            </FadeIn>

            {/* ── Info ── */}
            <FadeIn delay={0.1}>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                Dove siamo
              </span>
              <h2 className="font-raleway font-semibold text-neutral-900 mt-4 mb-2 leading-tight" style={{ fontSize: '2.25rem' }}>
                Vieni a trovarci
              </h2>
              <div className="w-10 h-px bg-neutral-200 mb-8" />

              <div className="flex flex-col gap-7">

                {/* Indirizzo */}
                <div className="flex items-start gap-3 text-neutral-600">
                  <IconPin />
                  <div>
                    <a
                      href={MAPS_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-neutral-800 hover:text-brand transition-colors"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      Via Europa, 2 — Colle Brianza (LC)
                    </a>
                  </div>
                </div>

                {/* Telefoni */}
                <div className="flex items-start gap-3 text-neutral-600">
                  <IconPhone />
                  <div className="flex flex-col gap-1.5">
                    {PHONES.map(p => (
                      <a
                        key={p}
                        href={`tel:${p.replace(/\s/g, '')}`}
                        className="font-medium text-neutral-800 hover:text-brand transition-colors"
                        style={{ fontSize: 'var(--text-body)' }}
                      >
                        {p}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Orari */}
                <div className="flex items-start gap-3 text-neutral-600">
                  <IconClock />
                  <div>
                    <p className="font-medium text-neutral-800 mb-1.5" style={{ fontSize: 'var(--text-body)' }}>Orari</p>
                    <div className="flex flex-col gap-0.5">
                      {orariDisplay.righe.map((r, i) => (
                        <span key={i} className="font-light" style={{ fontSize: 'var(--text-body)' }}>{r}</span>
                      ))}
                    </div>
                    {orariDisplay.avvisoSettimana && (
                      <p className="text-brand/80 mt-2" style={{ fontSize: 'var(--text-meta)' }}>
                        ⚠ Orari modificati questa settimana — controlla il calendario
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Mappa statica / link */}
              <div className="mt-10 rounded-card overflow-hidden border border-neutral-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2783.592387939404!2d9.359719676493903!3d45.759317071080346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786a7b703fbd1af%3A0x557d2a719fe1678a!2sBoogie%20Bistrot!5e0!3m2!1sit!2sit!4v1776421231356!5m2!1sit!2sit"
                  width="100%"
                  height="250"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Boogie Bistrot su Google Maps"
                />
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
