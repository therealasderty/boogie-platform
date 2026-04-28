import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchEventi, fetchEventoBySlug, formatBadgeRicorrente } from '@/lib/agenda'
import { fetchOrari, fetchChiusure } from '@/lib/orari'
import { fetchMedia } from '@/lib/media'
import BlocchiRenderer from '@/components/BlocchiRenderer'
import FormPrenotazioneMultiStep from '@/components/FormPrenotazioneMultiStep'
import FormIscrizioneEvento from '@/components/FormIscrizioneEvento'
import SetEventoTitolo from '@/components/SetEventoTitolo'
import AltriAppuntamenti from '@/components/AltriAppuntamenti'

export const revalidate = 300

export async function generateStaticParams() {
  try {
    const eventi = await fetchEventi()
    return eventi.filter(e => e.slug).map(e => ({ slug: e.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const evento = await fetchEventoBySlug(slug)
  if (!evento) return {}

  const dataFormattata = evento.data ? (() => {
    const d = new Date(evento.data + 'T00:00:00')
    return `${d.getDate()} ${['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'][d.getMonth()]} ${d.getFullYear()}`
  })() : null

  const description = evento.metaDescription
    || evento.descrizione
    || (dataFormattata
      ? `${evento.titolo} — ${dataFormattata} al Boogie Bistrot di Colle Brianza.`
      : `Scopri l'evento "${evento.titolo}" al Boogie Bistrot di Colle Brianza.`)

  const title = evento.metaTitle || `${evento.titolo} | Boogie Bistrot`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'it_IT',
      siteName: 'Boogie Bistrot',
      ...(evento.fotoHero ? { images: [{ url: evento.fotoHero }] } : {}),
    },
  }
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
              'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function prossimaOccorrenza(evento: { ricorrenza: string; giornoSettimana: string; giorniEsclusione: string }): string {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)
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

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [evento, orari, chiusure] = await Promise.all([
    fetchEventoBySlug(slug),
    fetchOrari(),
    fetchChiusure(),
  ])
  if (!evento) notFound()

  const giorniConOrari   = new Set(orari.filter(o => o.attivo && o.giorno !== null).map(o => o.giorno as number))
  const chiusiOrdinari   = [0,1,2,3,4,5,6].filter(d => !giorniConOrari.has(d))
  const chiusiSettimanali = chiusure
    .filter(c => c.tipo === 'Giorno della settimana' && c.tipoApertura === 'Chiusura' && c.giorno !== null)
    .map(c => c.giorno as number)
  const giorniChiusi = [...new Set([...chiusiOrdinari, ...chiusiSettimanali])]

  // Immagini carosello intro: solo da tagFotoIntro (libreria media)
  const tagMedia = evento.tagFotoIntro ? await fetchMedia(evento.tagFotoIntro) : []
  const introImages = tagMedia.map(m => ({ src: m.url, alt: m.alt || evento.titolo }))

  const hasDescrizione = !!evento.descrizione
  const showSezioneIntro = !!evento.testoIntro || introImages.length > 0

  const dataFormattata = evento.data ? (() => {
    const d = new Date(evento.data + 'T00:00:00')
    return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
  })() : null

  const heroBadge = evento.stato === 'futuro'
    ? 'Data da definire'
    : evento.ricorrente
      ? (formatBadgeRicorrente(evento, giorniChiusi) || null)
      : dataFormattata
        ? (evento.orario
            ? `${dataFormattata} · ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}`
            : dataFormattata)
        : null

  // JSON-LD strutturato per Google Events
  const jsonLd = evento.data ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: evento.titolo,
    description: evento.descrizione || undefined,
    startDate: evento.orario ? `${evento.data}T${evento.orario}:00` : evento.data,
    location: {
      '@type': 'Place',
      name: 'Boogie Bistrot',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Colle Brianza',
        addressCountry: 'IT',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Boogie Bistrot',
    },
  } : null

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Eventi Speciali', href: '/eventi-speciali' },
    { label: evento.titolo },
  ]

  return (
    <main>
      <SetEventoTitolo titolo={evento.titolo} dormiente={evento.stato === 'passato' || evento.stato === 'futuro'} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PaginaHero
        titolo={evento.titolo}
        sottotitolo="Eventi Speciali"
        badge={evento.stato === 'passato' ? undefined : (heroBadge || undefined)}
        image={evento.fotoHero || '/images/hero/1.webp'}
      />

      {(evento.stato === 'passato' || evento.stato === 'futuro') && (
        <div className="px-6 md:px-14 py-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="max-w-3xl mx-auto">
            <div className="rounded-card px-5 py-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-text-muted leading-relaxed m-0" style={{ fontSize: 'var(--text-meta)' }}>
                {evento.stato === 'futuro'
                  ? <>Stiamo definendo la programmazione di <strong className="text-white">{evento.titolo}</strong> — <a href="#prenota" className="text-brand underline underline-offset-2 hover:text-brand-hover transition-colors">rimani aggiornato</a>.</>
                  : <><strong className="text-white">{evento.titolo}</strong> è un appuntamento passato, ma potrebbe tornare — <a href="#prenota" className="text-brand underline underline-offset-2 hover:text-brand-hover transition-colors">rimani aggiornato</a>.</>
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sezione intro — presente se c'è descrizione o foto */}
      {showSezioneIntro && (
        <SezioneIntro
          inverti
          fotoContenuta
          breadcrumb={breadcrumb}
          label={evento.ricorrente ? 'Appuntamento fisso' : 'Evento speciale'}
          titolo={evento.titoloIntro || evento.titolo}
          testo={evento.testoIntro || ''}
          immagini={introImages}
        />
      )}

      {/* Blocchi contenuto — sfondo chiaro */}
      {evento.blocchi?.length > 0 && (
        <section className="py-16 px-6 md:px-14 bg-neutral-100">
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              {!showSezioneIntro && (
                <nav className="flex items-center gap-2 mb-12" style={{ fontSize: 'var(--text-meta)' }}>
                  <Link href="/" className="text-neutral-400 hover:text-neutral-700 transition-colors">Home</Link>
                  <span className="text-neutral-400">/</span>
                  <Link href="/eventi-speciali" className="text-neutral-400 hover:text-neutral-700 transition-colors">Appuntamenti</Link>
                  <span className="text-neutral-400">/</span>
                  <span className="text-neutral-600">{evento.titolo}</span>
                </nav>
              )}
              <BlocchiRenderer blocchi={evento.blocchi} data={evento.data} orario={evento.orario || undefined} orarioFine={evento.orarioFine || undefined} eventoTitolo={evento.titolo} />
            </FadeIn>
          </div>
        </section>
      )}

      <AltriAppuntamenti slugCorrente={slug} />

      {/* Prenotazione / Iscrizione — sfondo scuro */}
      <section id="prenota" className="text-white py-16 px-6 md:px-14" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            {!showSezioneIntro && !evento.blocchi?.length && (
              <nav className="flex items-center gap-2 mb-12" style={{ fontSize: 'var(--text-meta)' }}>
                <Link href="/" className="text-text-faint hover:text-white transition-colors">Home</Link>
                <span className="text-text-faint">/</span>
                <Link href="/eventi-speciali" className="text-text-faint hover:text-white transition-colors">Appuntamenti</Link>
                <span className="text-text-faint">/</span>
                <span className="text-text-muted">{evento.titolo}</span>
              </nav>
            )}
            {evento.stato === 'passato' ? (
              <FormIscrizioneEvento eventoTitolo={evento.titolo} variante="terminato" />
            ) : evento.stato === 'futuro' ? (
              <FormIscrizioneEvento eventoTitolo={evento.titolo} variante="tbd" />
            ) : (
              <>
                <div className="bg-white rounded-card p-8">
                {evento.ricorrente
                  ? (() => {
                      const prossima = prossimaOccorrenza(evento) || localDateStr(new Date())
                      return (
                        <FormPrenotazioneMultiStep
                          dataProp={prossima}
                          orario={evento.orario || undefined}
                          orarioFine={evento.orarioFine || undefined}
                          titolo={evento.titolo}
                          ricorrente
                          giornoSettimana={evento.giornoSettimana || undefined}
                        />
                      )
                    })()
                  : evento.data
                    ? <FormPrenotazioneMultiStep
                        dataProp={evento.data}
                        orario={evento.orario || undefined}
                        orarioFine={evento.orarioFine || undefined}
                        titolo={evento.titolo}
                        dataFormattata={dataFormattata || undefined}
                      />
                    : (
                      <Link
                        href="/prenota"
                        className="inline-block bg-brand hover:bg-brand-hover text-black font-semibold px-8 py-3.5 rounded-btn transition-colors"
                        style={{ fontSize: 'var(--text-body)' }}
                      >
                        Prenota un tavolo
                      </Link>
                    )
                }
              </div>
              </>
            )}
            <div className="pt-8">
              <Link
                href="/eventi-speciali"
                className="text-text-faint hover:text-white transition-colors"
                style={{ fontSize: 'var(--text-meta)' }}
              >
                ← Tutti gli appuntamenti
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
