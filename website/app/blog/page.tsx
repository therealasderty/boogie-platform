import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchArticoli } from '@/lib/blog'

/** 3 giorni — deve essere letterale per Next (vedi invalid-page-config) */
export const revalidate = 259_200

export const metadata: Metadata = {
  title: 'Blog | Boogie Bistrot Colle Brianza',
  description: 'Storie, curiosità ed eventi dal Boogie Bistrot di Colle Brianza. Cucina del territorio, pizza tradizionale, birre locali e serate speciali.',
  openGraph: {
    title: 'Blog | Boogie Bistrot Colle Brianza',
    description: 'Storie, ricette e curiosità dal Boogie Bistrot di Colle Brianza.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

export default async function BlogPage() {
  const articoli = await fetchArticoli()

  return (
    <main>
      <PaginaHero
        titolo="Storie e sapori"
        sottotitolo="Blog"
        tagline="Racconti dalla cucina, dalla cantina e dal giardino."
        image="/images/hero/2.avif"
      />

      <section className="py-20 md:py-28" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-14">

          {articoli.length === 0 ? (
            <FadeIn>
              <p className="text-white/40 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                Nessun articolo disponibile al momento.
              </p>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articoli.map((a, i) => {
                const data = a.dataPubblicazione
                  ? (() => {
                      const d = new Date(a.dataPubblicazione + 'T00:00:00')
                      return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
                    })()
                  : null

                return (
                  <FadeIn key={a.id} delay={i * 0.07}>
                    <article className="group flex flex-col bg-white/5 border border-white/10 rounded-card overflow-hidden hover:border-white/20 transition-colors">
                      {a.fotoHero && (
                        <div className="relative h-52 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.fotoHero}
                            alt={a.titolo}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          {a.categoria && (
                            <span
                              className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white/80 font-medium px-3 py-1 rounded-pill"
                              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                            >
                              {a.categoria}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col gap-3 p-6 flex-1">
                        {data && (
                          <span className="text-white/30 font-light" style={{ fontSize: 'var(--text-label)' }}>
                            {data}
                          </span>
                        )}
                        <h2
                          className="font-semibold text-white leading-snug"
                          style={{ fontSize: 'var(--text-lead)' }}
                        >
                          {a.titolo}
                        </h2>
                        {a.descrizioneBreve && (
                          <p
                            className="text-white/50 font-light leading-relaxed flex-1"
                            style={{ fontSize: 'var(--text-meta)' }}
                          >
                            {a.descrizioneBreve}
                          </p>
                        )}
                        <Link
                          href={`/blog/${a.slug}`}
                          className="mt-2 self-start inline-flex items-center gap-2 font-medium text-brand hover:text-brand-hover transition-colors"
                          style={{ fontSize: 'var(--text-meta)' }}
                        >
                          Leggi l&apos;articolo
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </div>
                    </article>
                  </FadeIn>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
