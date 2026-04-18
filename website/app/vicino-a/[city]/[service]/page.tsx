import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import BlocchiRenderer from '@/components/BlocchiRenderer'
import FormPrenotazioneEvento from '@/components/FormPrenotazioneEvento'
import SetEventoTitolo from '@/components/SetEventoTitolo'
import { fetchLocalita, fetchLocalitaBySlug, fetchIntroServizio } from '@/lib/localita'
import { fetchEventoBySlug } from '@/lib/agenda'
import { fetchMedia } from '@/lib/media'

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function prossimaOccorrenza(evento: { ricorrenza: string; giornoSettimana: string; giorniEsclusione: string }): string {
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
  if (evento.ricorrenza === 'settimanale') {
    const giorni = (evento.giornoSettimana || '').split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    if (giorni.length === 0) return ''
    for (let i = 0; i <= 7; i++) {
      const d = new Date(oggi); d.setDate(d.getDate() + i)
      if (giorni.includes(d.getDay())) return localDateStr(d)
    }
  } else if (evento.ricorrenza === 'giornaliera') {
    const esclusi = (evento.giorniEsclusione || '').split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    for (let i = 0; i <= 7; i++) {
      const d = new Date(oggi); d.setDate(d.getDate() + i)
      if (!esclusi.includes(d.getDay())) return localDateStr(d)
    }
  }
  return ''
}

const GIORNI_LABEL_L     = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_BREVI_L     = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const ORDINE_SETT_L      = [1, 2, 3, 4, 5, 6, 0]

function fmtGiorni(str: string): string {
  const nums = str.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (!nums.length) return ''
  const sorted = ORDINE_SETT_L.filter(g => nums.includes(g))
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETT_L.indexOf(sorted[j + 1]) === ORDINE_SETT_L.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL_L[chunk[0]] : `${GIORNI_LABEL_L[chunk[0]]}–${GIORNI_LABEL_L[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

function formatBadgeRicorrente(evento: { ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; orario: string; orarioFine: string }): string {
  let giorni = ''
  if (evento.ricorrenza === 'giornaliera') {
    const esclusi = evento.giorniEsclusione ? evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n)) : []
    const attivi = ORDINE_SETT_L.filter(g => !esclusi.includes(g))
    if (attivi.length) {
      const primo = GIORNI_LABEL_L[attivi[0]]
      const ultimo = GIORNI_LABEL_L[attivi[attivi.length - 1]]
      giorni = primo === ultimo ? primo : `${primo}–${ultimo}`
      const esclusoNelRange = esclusi.filter(n => GIORNI_BREVI_L[n])
      const escNomi = esclusoNelRange.map(n => GIORNI_BREVI_L[n]).filter(Boolean)
      if (escNomi.length) giorni += ` (escluso ${escNomi.join(', ')})`
    }
  } else if (evento.ricorrenza === 'settimanale' && evento.giornoSettimana) {
    giorni = fmtGiorni(evento.giornoSettimana)
    if (evento.giorniEsclusione) {
      const esclusi = evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI_L[n])
      if (esclusi.length) giorni += ` (escluso ${esclusi.map(n => GIORNI_BREVI_L[n]).join(', ')})`
    }
  }
  const orario = evento.orario ? ` · ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}` : ''
  return giorni ? `${giorni}${orario}` : ''
}

const MAPS_EMBED ='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2783.5923879393986!2d9.35971967649393!3d45.759317071080446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4786a7b703fbd1af%3A0x557d2a719fe1678a!2sBoogie%20Bistrot!5e0!3m2!1sit!2sit!4v1776238958687!5m2!1sit!2sit'

export const revalidate = 300

export async function generateStaticParams() {
  try {
    const localita = await fetchLocalita()
    return localita.flatMap(l =>
      l.serviziAttivi.map(s => ({ city: l.slug, service: s }))
    )
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; service: string }> }
): Promise<Metadata> {
  const { city, service } = await params
  const [localita, evento] = await Promise.all([
    fetchLocalitaBySlug(city),
    fetchEventoBySlug(service),
  ])
  if (!localita || !evento) return {}

  const title = localita.metaTitle || `${evento.titolo} vicino a ${localita.citta} | Boogie Bistrot`
  const description = localita.metaDescription
    || `${evento.titolo} al Boogie Bistrot di Colle Brianza, a pochi minuti da ${localita.citta}. ${evento.descrizioneBreve || ''}`

  return {
    title,
    description,
    alternates: {
      canonical: `https://boogiebistrot.com/vicino-a/${localita.slug}/${service}`,
    },
    openGraph: {
      title,
      description,
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
      ...(evento.fotoHero ? { images: [{ url: evento.fotoHero }] } : {}),
    },
  }
}

export default async function CityServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>
}) {
  const { city, service } = await params

  const [localita, evento, introServizio] = await Promise.all([
    fetchLocalitaBySlug(city),
    fetchEventoBySlug(service),
    fetchIntroServizio(city, service),
  ])

  // 404 se città non esiste, servizio non esiste, o servizio non è attivo per questa città
  if (!localita || !evento || !localita.serviziAttivi.includes(service)) notFound()

  const tagMedia = evento.tagFotoIntro ? await fetchMedia(evento.tagFotoIntro) : []
  const introImages = tagMedia.map(m => ({ src: m.url, alt: m.alt || evento.titolo }))

  const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']
  const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']
  const dataFormattata = evento.data ? (() => {
    const d = new Date(evento.data + 'T00:00:00')
    return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
  })() : null
  const heroBadge = evento.ricorrente
    ? (formatBadgeRicorrente(evento) || null)
    : dataFormattata
      ? (evento.orario
          ? `${dataFormattata} · ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}`
          : dataFormattata)
      : null

  const directionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(localita.citta + ', LC')}/Boogie+Bistrot+Colle+Brianza`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${evento.titolo} vicino a ${localita.citta}`,
    description: evento.descrizione || evento.descrizioneBreve || undefined,
    location: {
      '@type': 'Place',
      name: 'Boogie Bistrot',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Colle Brianza',
        addressCountry: 'IT',
      },
    },
    organizer: { '@type': 'Organization', name: 'Boogie Bistrot' },
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SetEventoTitolo titolo={evento.titolo} />
      <PaginaHero
        titolo={`${evento.titolo} vicino a ${localita.citta}`}
        sottotitolo={`A ${localita.tempoGuida ? `${localita.tempoGuida} minuti` : 'pochi minuti'} da ${localita.citta}`}
        badge={heroBadge || undefined}
        image={evento.fotoHero || '/images/hero/1.webp'}
      />

      {(introServizio || introImages.length > 0) && (
        <SezioneIntro
          inverti
          fotoContenuta
          label={evento.ricorrente ? 'Appuntamento fisso' : 'Evento speciale'}
          titolo={evento.titoloIntro || evento.titolo}
          testo={introServizio || evento.testoIntro || ''}
          immagini={introImages}
        />
      )}

      <section className="py-20 px-6 md:px-14 bg-neutral-100">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <BlocchiRenderer
              blocchi={evento.blocchi}
              data={evento.data}
              orario={evento.orario || undefined}
              orarioFine={evento.orarioFine || undefined}
              eventoTitolo={`${evento.titolo} vicino a ${localita.citta}`}
            />
          </FadeIn>
        </div>
      </section>

      {/* Form prenotazione — sfondo scuro */}
      <section id="prenota" className="text-white py-16 px-6 md:px-14" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn>
              <h3 className="font-raleway font-semibold text-white mb-2" style={{ fontSize: '1.75rem' }}>
                Prenota per l&apos;appuntamento {evento.titolo}
              </h3>
              <p className="text-text-faint mb-6 mt-1" style={{ fontSize: 'var(--text-meta)' }}>
                Vuoi prenotare a cena o a pranzo per un altro giorno?{' '}
                <Link href="/prenota" className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors">
                  Vai alla pagina prenotazioni
                </Link>
              </p>
              {evento.ricorrente
                ? <FormPrenotazioneEvento
                    data={prossimaOccorrenza(evento) || localDateStr(new Date())}
                    orario={evento.orario || undefined}
                    orarioFine={evento.orarioFine || undefined}
                    titolo={evento.titolo}
                    ricorrente
                  />
                : evento.data
                  ? <FormPrenotazioneEvento
                      data={evento.data}
                      orario={evento.orario || undefined}
                      orarioFine={evento.orarioFine || undefined}
                      titolo={evento.titolo}
                    />
                  : <Link
                      href="/prenota"
                      className="inline-block bg-brand hover:bg-brand-hover text-black font-semibold px-8 py-3.5 rounded-btn transition-colors"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      Prenota un tavolo
                    </Link>
              }
          </FadeIn>
        </div>
      </section>

      {/* Mappa */}
      <section className="py-16 px-6 md:px-14" style={{ backgroundColor: '#1a1a1a' }}>
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
