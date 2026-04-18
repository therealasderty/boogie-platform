import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneIntro from '@/components/SezioneIntro'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchEventi, fetchEventoBySlug } from '@/lib/agenda'
import { fetchMedia } from '@/lib/media'
import BlocchiRenderer from '@/components/BlocchiRenderer'
import FormPrenotazioneEvento from '@/components/FormPrenotazioneEvento'
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
const GIORNI_LABEL     = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_BREVI_EVT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const ORDINE_SETT      = [1, 2, 3, 4, 5, 6, 0]

function fmtGiorni(str: string): string {
  const nums = str.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (!nums.length) return ''
  const sorted = ORDINE_SETT.filter(g => nums.includes(g))
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETT.indexOf(sorted[j + 1]) === ORDINE_SETT.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL[chunk[0]] : `${GIORNI_LABEL[chunk[0]]}–${GIORNI_LABEL[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

function formatBadgeRicorrente(evento: { ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; orario: string; orarioFine: string }): string {
  let giorni = ''
  if (evento.ricorrenza === 'giornaliera') {
    const esclusi = evento.giorniEsclusione ? evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n)) : []
    const attivi = ORDINE_SETT.filter(g => !esclusi.includes(g))
    if (attivi.length) {
      const primo = GIORNI_LABEL[attivi[0]]
      const ultimo = GIORNI_LABEL[attivi[attivi.length - 1]]
      giorni = primo === ultimo ? primo : `${primo}–${ultimo}`
      // esclusioni che cadono dentro lo span
      const esclusoNelRange = esclusi.filter(n => GIORNI_BREVI_EVT[n] && n !== 1) // ignora lun se è il giorno di chiusura iniziale
      const escNomi = esclusoNelRange.map(n => GIORNI_BREVI_EVT[n]).filter(Boolean)
      if (escNomi.length) giorni += ` (escluso ${escNomi.join(', ')})`
    }
  } else if (evento.ricorrenza === 'settimanale' && evento.giornoSettimana) {
    giorni = fmtGiorni(evento.giornoSettimana)
    if (evento.giorniEsclusione) {
      const esclusi = evento.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI_EVT[n])
      if (esclusi.length) giorni += ` (escluso ${esclusi.map(n => GIORNI_BREVI_EVT[n]).join(', ')})`
    }
  }
  const orario = evento.orario ? ` · ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}` : ''
  return giorni ? `${giorni}${orario}` : ''
}

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
  const evento = await fetchEventoBySlug(slug)
  if (!evento) notFound()

  // Immagini carosello intro: solo da tagFotoIntro (libreria media)
  const tagMedia = evento.tagFotoIntro ? await fetchMedia(evento.tagFotoIntro) : []
  const introImages = tagMedia.map(m => ({ src: m.url, alt: m.alt || evento.titolo }))

  const hasDescrizione = !!evento.descrizione
  const showSezioneIntro = !!evento.testoIntro || introImages.length > 0

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
      <SetEventoTitolo titolo={evento.titolo} />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PaginaHero
        titolo={evento.titolo}
        sottotitolo="Eventi Speciali"
        badge={heroBadge || undefined}
        image={evento.fotoHero || '/images/hero/1.webp'}
      />

      {evento.stato === 'dormiente' && (
        <div className="px-6 md:px-14 py-4" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-3 rounded-card px-5 py-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⏸</span>
              <p className="text-text-muted leading-relaxed m-0" style={{ fontSize: 'var(--text-meta)' }}>
                <strong className="text-white">"{evento.titolo}"</strong> al momento non è attivo.
                Torna a trovarci presto — questo appuntamento tornerà!
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
            {evento.stato === 'dormiente' ? (
              <FormIscrizioneEvento eventoTitolo={evento.titolo} />
            ) : (
              <>
                <h3 className="font-raleway font-semibold text-white mb-2" style={{ fontSize: '1.75rem' }}>
                  Prenota per l&apos;appuntamento {evento.titolo}
                </h3>
                {dataFormattata && !evento.ricorrente && (
                  <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>{dataFormattata}</p>
                )}
                <p className="text-text-faint mb-6 mt-1" style={{ fontSize: 'var(--text-meta)' }}>
                  Vuoi prenotare a cena o a pranzo per un altro giorno?{' '}
                  <Link href="/prenota" className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors">
                    Vai alla pagina prenotazioni
                  </Link>
                </p>
                {evento.ricorrente
                  ? (() => {
                      const prossima = prossimaOccorrenza(evento) || localDateStr(new Date())
                      return (
                        <FormPrenotazioneEvento
                          data={prossima}
                          orario={evento.orario || undefined}
                          orarioFine={evento.orarioFine || undefined}
                          titolo={evento.titolo}
                          ricorrente
                        />
                      )
                    })()
                  : evento.data
                    ? <FormPrenotazioneEvento
                        data={evento.data}
                        orario={evento.orario || undefined}
                        orarioFine={evento.orarioFine || undefined}
                        titolo={evento.titolo}
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
