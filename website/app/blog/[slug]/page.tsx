import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneMenu from '@/components/SezioneMenu'
import SezioneRecensioni from '@/components/SezioneRecensioni'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchArticoli, fetchArticoloBySlug } from '@/lib/blog'

/** 3 giorni — letterale richiesto da Next */
export const revalidate = 259_200

export async function generateStaticParams() {
  try {
    const articoli = await fetchArticoli()
    return articoli.filter(a => a.slug).map(a => ({ slug: a.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const articolo = await fetchArticoloBySlug(slug)
  if (!articolo) return {}

  const title = articolo.metaTitle || `${articolo.titolo} | Boogie Bistrot`
  const description = articolo.metaDescription || articolo.descrizioneBreve || `Leggi l'articolo "${articolo.titolo}" sul blog del Boogie Bistrot di Colle Brianza.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
      ...(articolo.fotoHero ? { images: [{ url: articolo.fotoHero }] } : {}),
      ...(articolo.dataPubblicazione ? { publishedTime: articolo.dataPubblicazione } : {}),
    },
  }
}

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

export default async function BlogSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const articolo = await fetchArticoloBySlug(slug)
  if (!articolo) notFound()

  const dataFormattata = articolo.dataPubblicazione
    ? (() => {
        const d = new Date(articolo.dataPubblicazione + 'T00:00:00')
        return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
      })()
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: articolo.titolo,
    description: articolo.descrizioneBreve || undefined,
    ...(articolo.dataPubblicazione ? { datePublished: articolo.dataPubblicazione } : {}),
    ...(articolo.fotoHero ? { image: articolo.fotoHero } : {}),
    ...(articolo.autore ? { author: { '@type': 'Person', name: articolo.autore } } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Boogie Bistrot',
    },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PaginaHero
        titolo={articolo.titolo}
        sottotitolo={articolo.categoria || 'Blog'}
        image={articolo.fotoHero || '/images/hero/giardino-boogie-bistrot-colle-brianza.avif'}
      />

      <section className="text-white py-20 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-3xl mx-auto">
          <FadeIn>

            <nav className="flex items-center gap-2 mb-12" style={{ fontSize: 'var(--text-meta)' }}>
              <Link href="/" className="text-text-faint hover:text-white transition-colors">Home</Link>
              <span className="text-text-faint">/</span>
              <Link href="/blog" className="text-text-faint hover:text-white transition-colors">Blog</Link>
              <span className="text-text-faint">/</span>
              <span className="text-text-muted">{articolo.titolo}</span>
            </nav>

            {/* Meta articolo */}
            {(dataFormattata || articolo.autore) && (
              <div className="flex items-center gap-4 mb-8" style={{ fontSize: 'var(--text-meta)' }}>
                {dataFormattata && (
                  <span className="text-white/40">{dataFormattata}</span>
                )}
                {articolo.autore && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-white/40">{articolo.autore}</span>
                  </>
                )}
              </div>
            )}

            {/* Contenuto rich text */}
            {articolo.contenuto ? (
              <div
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: articolo.contenuto }}
              />
            ) : (
              <p className="text-white/40 italic" style={{ fontSize: 'var(--text-meta)' }}>
                Contenuto non disponibile.
              </p>
            )}

            <div className="pt-12 border-t border-white/10 mt-12">
              <Link
                href="/blog"
                className="text-text-faint hover:text-white transition-colors"
                style={{ fontSize: 'var(--text-meta)' }}
              >
                ← Tutti gli articoli
              </Link>
            </div>

          </FadeIn>
        </div>
      </section>

      <div className="bg-surface-warm pt-16 md:pt-20 px-6 md:px-14">
        <div className="max-w-7xl mx-auto text-center">
          <span
            className="uppercase text-black/40 font-medium"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            Boogie Bistrot
          </span>
          <h2
            className="font-semibold text-neutral-900 mt-4"
            style={{ fontSize: 'var(--text-section)' }}
          >
            Cosa puoi trovare al Boogie
          </h2>
        </div>
      </div>
      <SezioneMenu />
      <SezioneRecensioni />
      <SezioneContatti />
      <Footer />
    </main>
  )
}
