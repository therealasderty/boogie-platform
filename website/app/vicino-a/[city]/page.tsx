import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import SezioneMenu from '@/components/SezioneMenu'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchLocalita, fetchLocalitaBySlug } from '@/lib/localita'
import { fetchMedia } from '@/lib/media'
import { fetchEventi } from '@/lib/agenda'

export const revalidate = 259200

const MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2783.5923879393986!2d9.35971967649393!3d45.759317071080446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786a7b703fbd1af%3A0x557d2a719fe1678a!2sBoogie%20Bistrot!5e0!3m2!1sit!2sit!4v1776238958687!5m2!1sit!2sit'

export async function generateStaticParams() {
  try {
    const localita = await fetchLocalita()
    return localita.map(l => ({ city: l.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params
  const localita = await fetchLocalitaBySlug(city)
  if (!localita) return {}

  const title = localita.metaTitle || `Ristorante vicino a ${localita.citta} | Boogie Bistrot`
  const description = localita.metaDescription || `Boogie Bistrot, il ristorante con giardino più vicino a ${localita.citta}. Cucina del territorio, pizza tradizionale nel forno a legna ed eventi tutto l'anno a Colle Brianza.`

  return {
    title,
    description,
    alternates: { canonical: `https://boogiebistrot.com/vicino-a/${localita.slug}` },
    openGraph: {
      title,
      description,
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
    },
  }
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  const [localita, fotoLocation, fotoCarta, tuttiEventi] = await Promise.all([
    fetchLocalitaBySlug(city),
    fetchMedia('location'),
    fetchMedia('carta'),
    fetchEventi(),
  ])
  if (!localita) notFound()

  const heroImage = fotoCarta.length > 0
    ? fotoCarta[0].url
    : '/images/hero/1.webp'

  const serviziEventi = localita
    ? tuttiEventi.filter(e => e.slug && localita.serviziAttivi.includes(e.slug) && e.stato === 'attivo')
    : []

  const fotoCarousel = fotoLocation.length > 0
    ? fotoLocation.map(f => ({ src: f.url, alt: f.alt || 'Boogie Bistrot' }))
    : [{ src: '/images/hero/1.webp', alt: 'Boogie Bistrot' }, { src: '/images/hero/2.avif', alt: 'Il giardino' }]
  const directionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(localita.citta + ', LC')}/Boogie+Bistrot+Colle+Brianza`

  return (
    <main>
      <PaginaHero
        titolo={`Ristorante vicino a ${localita.citta}`}
        sottotitolo="Boogie Bistrot · Colle Brianza (LC)"
        tagline={`A ${localita.tempoGuida ? `${localita.tempoGuida} minuti` : 'pochi minuti'} da ${localita.citta}, nel verde della Brianza lecchese.`}
        image={heroImage}
      />

      {/* Intro 50/50 */}
      <SezioneIntro
        inverti
        fotoContenuta
        immagini={fotoCarousel}
        label="Chi siamo"
        titolo="L'essenza della cucina del territorio in una location storica con giardino"
        testo={`<p>Dal 2019, nel cuore verde di <strong>Colle Brianza</strong>, il Boogie Bistrot è un punto di riferimento gastronomico che unisce tradizione del territorio e innovazione culinaria — a ${localita.tempoGuida ? `<strong>${localita.tempoGuida} minuti</strong> da` : 'pochi minuti da'} <strong>${localita.citta}</strong>. La nostra cucina, reinterpretata con creatività e passione, trova la sua casa in una <strong>location storica immersa nel verde della provincia di Lecco</strong>, dove ogni piatto racconta una storia di territorio e autenticità.</p><br/><p>L'esperienza si compone di tante sfaccettature: dai piatti della <strong>cucina del territorio</strong> preparati con ingredienti freschi selezionati dai produttori locali, alle <strong>pizze a lunga lievitazione cotte nel forno a legna</strong>, fino alle <a href='/eventi-speciali'>serate ed eventi speciali</a> che animano il locale durante tutto l'anno.</p><br/><p>Nella bella stagione il <strong>giardino</strong> diventa un'oasi di tranquillità dove gustare pranzi e cene all'aperto, circondati dal panorama collinare della Brianza. In inverno, le sale interne accolgono gli ospiti in un'atmosfera calda e conviviale, ideale per cene romantiche o serate in compagnia.</p>`}
      />

      {/* Sezione menu */}
      <SezioneMenu />

      {/* Appuntamenti */}
      {serviziEventi.length > 0 && (
        <section className="py-16 px-6 md:px-14 bg-surface-warm">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                I nostri appuntamenti
              </span>
              <h2
                className="font-semibold text-neutral-900 leading-snug mt-4 mb-8"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Gli appuntamenti al Boogie
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviziEventi.map(evento => (
                  <a
                    key={evento.slug}
                    href={`/eventi-speciali/${evento.slug}`}
                    className="group relative overflow-hidden rounded-card bg-neutral-900 flex flex-col"
                    style={{ height: 280 }}
                  >
                    {/* Foto */}
                    {evento.fotoHero && (
                      <div className="absolute inset-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evento.fotoHero}
                          alt={evento.titolo}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

                    {/* Contenuto */}
                    <div className="relative mt-auto p-6 flex flex-col gap-2">
                      <h3 className="font-semibold text-white leading-snug" style={{ fontSize: 'var(--text-body)' }}>
                        {evento.titolo}
                      </h3>
                      {evento.descrizioneBreve && (
                        <p className="text-white/60 font-light leading-snug line-clamp-2" style={{ fontSize: 'var(--text-meta)' }}>
                          {evento.descrizioneBreve}
                        </p>
                      )}
                      <span className="mt-1 inline-flex items-center gap-1 text-brand font-medium" style={{ fontSize: 'var(--text-meta)' }}>
                        Scopri di più
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Mappa + indicazioni */}
      <section className="py-16 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="mb-8">
              <span
                className="uppercase text-white/30 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                Come raggiungerci
              </span>
              <h2
                className="font-semibold text-white leading-snug mt-4"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Da {localita.citta} a Colle Brianza
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-white/50 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                  Via Europa, 2 — Colle Brianza (LC)
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors"
                  style={{ fontSize: 'var(--text-meta)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  Indicazioni da {localita.citta}
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-card" style={{ height: 400 }}>
              <iframe
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Boogie Bistrot su Google Maps"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
