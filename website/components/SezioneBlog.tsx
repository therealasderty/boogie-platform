import Image from 'next/image'
import Link from 'next/link'
import FadeIn from '@/components/FadeIn'
import { fetchEventi } from '@/lib/agenda'
import { fetchArticoli } from '@/lib/blog'

const ARTICOLI_FALLBACK = [
  {
    titolo: 'Girorisotti: la tradizione del risotto brianzolo reinterpretata ogni giovedì',
    intro: 'Ogni settimana una nuova ricetta, ingredienti di stagione e il calore di una cucina che non smette mai di sorprendere. Scopri la storia del nostro appuntamento più amato.',
    image: '/images/hero/1.webp',
    href: '/blog/girorisotti',
    label: 'Cucina',
  },
  {
    titolo: 'Pranzo di lavoro a Colle Brianza: come staccare davvero dalla routine',
    intro: "Un'ora lontano dall'ufficio, nel verde della Brianza lecchese. Perché il pranzo non è solo nutrimento, ma un momento da vivere con calma.",
    image: '/images/hero/2.avif',
    href: '/blog/pranzo-di-lavoro',
    label: 'Location',
  },
]

export default async function SezioneBlog() {
  const [eventi, articoliBlog] = await Promise.all([fetchEventi(), fetchArticoli()])

  // Priorità 1: articoli blog pubblicati
  const blogCards = articoliBlog.slice(0, 4)
  const usaBlog = blogCards.length > 0

  // Priorità 2: eventi con foto e descrizione breve
  const oggi = new Date().toISOString().split('T')[0]
  const eventiCard = usaBlog ? [] : eventi
    .filter(e => e.fotoHero && e.descrizioneBreve && e.stato === 'attivo')
    .sort((a, b) => {
      const aFuturo = !a.ricorrente && a.data && a.data >= oggi
      const bFuturo = !b.ricorrente && b.data && b.data >= oggi
      if (aFuturo && !bFuturo) return -1
      if (!aFuturo && bFuturo) return 1
      return 0
    })
    .slice(0, 4)

  const usaFallback = !usaBlog && eventiCard.length === 0

  return (
    <section className="py-20 md:py-28 bg-surface-warm">
      <div className="max-w-7xl mx-auto px-6 md:px-14">

        {/* Header */}
        <FadeIn className="flex items-end justify-between mb-12">
          <div>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              {usaBlog ? 'Dal blog' : usaFallback ? 'Dal blog' : 'In evidenza'}
            </span>
            <h2
              className="font-semibold text-neutral-900 leading-snug mt-4"
              style={{ fontSize: 'var(--text-section)' }}
            >
              {usaBlog ? 'Storie e sapori' : usaFallback ? 'Storie e sapori' : 'News & eventi'}
            </h2>
          </div>
          {(usaBlog || usaFallback) && (
            <Link
              href="/blog"
              className="hidden md:inline-flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-medium"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Tutti gli articoli
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
          {!usaBlog && !usaFallback && (
            <Link
              href="/eventi-speciali"
              className="hidden md:inline-flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-medium"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Tutti gli eventi
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </FadeIn>

        {/* Cards blog reali */}
        {usaBlog && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogCards.map((a, i) => (
              <FadeIn key={a.id} delay={i * 0.1}>
                <article className="group flex flex-col bg-white rounded-card overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  {a.fotoHero && (
                    <div className="relative h-60 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.fotoHero}
                        alt={a.titolo}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {a.categoria && (
                        <span
                          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-black/60 font-medium px-3 py-1 rounded-pill"
                          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                        >
                          {a.categoria}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 p-7 flex-1">
                    <h3 className="font-semibold text-neutral-900 leading-snug" style={{ fontSize: 'var(--text-lead)' }}>
                      {a.titolo}
                    </h3>
                    {a.descrizioneBreve && (
                      <p className="text-neutral-500 font-light leading-relaxed flex-1" style={{ fontSize: 'var(--text-meta)' }}>
                        {a.descrizioneBreve}
                      </p>
                    )}
                    <Link
                      href={`/blog/${a.slug}`}
                      className="mt-3 self-start inline-flex items-center gap-2 font-medium text-black/70 hover:text-black transition-colors"
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
            ))}
          </div>
        )}

        {/* Cards eventi */}
        {!usaBlog && !usaFallback && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventiCard.map((e, i) => {
              const href = e.slug ? `/eventi-speciali/${e.slug}` : '/eventi-speciali'
              return (
                <FadeIn key={i} delay={i * 0.1}>
                <article className="group flex flex-col bg-white rounded-card overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <div className="relative h-60 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.fotoHero}
                      alt={e.titolo}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <span
                      className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-black/60 font-medium px-3 py-1 rounded-pill"
                      style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                    >
                      {e.ricorrente ? 'Appuntamento fisso' : 'Prossimamente'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 p-7 flex-1">
                    <h3
                      className="font-semibold text-neutral-900 leading-snug"
                      style={{ fontSize: 'var(--text-lead)' }}
                    >
                      {e.titolo}
                    </h3>
                    <p
                      className="text-neutral-500 font-light leading-relaxed flex-1"
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {e.descrizioneBreve}
                    </p>
                    <Link
                      href={href}
                      className="mt-3 self-start inline-flex items-center gap-2 font-medium text-black/70 hover:text-black transition-colors"
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      Scopri di più
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

        {/* Cards fallback blog */}
        {usaFallback && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARTICOLI_FALLBACK.map((a, i) => (
              <FadeIn key={a.href} delay={i * 0.1}>
              <article className="group flex flex-col bg-white rounded-card overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="relative h-60 overflow-hidden">
                  <Image
                    src={a.image}
                    alt={a.titolo}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <span
                    className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-black/60 font-medium px-3 py-1 rounded-pill"
                    style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                  >
                    {a.label}
                  </span>
                </div>
                <div className="flex flex-col gap-3 p-7 flex-1">
                  <h3
                    className="font-semibold text-neutral-900 leading-snug"
                    style={{ fontSize: 'var(--text-lead)' }}
                  >
                    {a.titolo}
                  </h3>
                  <p
                    className="text-neutral-500 font-light leading-relaxed flex-1"
                    style={{ fontSize: 'var(--text-meta)' }}
                  >
                    {a.intro}
                  </p>
                  <Link
                    href={a.href}
                    className="mt-3 self-start inline-flex items-center gap-2 font-medium text-black/70 hover:text-black transition-colors"
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
            ))}
          </div>
        )}

        {/* Link mobile */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href={usaBlog || usaFallback ? '/blog' : '/eventi-speciali'}
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-black transition-colors font-medium"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            {usaBlog || usaFallback ? 'Tutti gli articoli' : 'Tutti gli eventi'}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
