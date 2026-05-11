import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import SezioneContatti from '@/components/SezioneContatti'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import { fetchEventi, EventoAgenda } from '@/lib/agenda'
import { fetchGiorniAperti } from '@/lib/orari'

/** 1 giorno — letterale richiesto da Next */
export const revalidate = 86_400

export const metadata: Metadata = {
  title: 'Eventi Speciali | Boogie Bistrot',
  description: 'Scopri i prossimi eventi speciali e gli appuntamenti fissi al Boogie Bistrot di Colle Brianza.',
}

const MESI_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const NOMI_GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

const ART = (d: number) => d === 0 ? 'la' : 'il' // domenica è femminile

function schedaRicorrenza(evento: EventoAgenda, giorniAperti?: Set<number>): string {
  const remap = (d: number) => d === 0 ? 7 : d // domenica da 0 a 7 per ordinamento lun-dom
  const esclusoLabel = (giorni: number[]) =>
    giorni.map(d => `${ART(d)} ${NOMI_GIORNI[d]}`).join(' e ')

  if (evento.ricorrenza === 'settimanale') {
    const giorni = (evento.giornoSettimana || '').split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    if (giorni.length === 0) return 'ogni settimana'
    if (giorni.length === 1) return `ogni ${NOMI_GIORNI[giorni[0]]}`
    if (giorni.length === 7) return 'tutti i giorni'
    const sorted = [...giorni].sort((a, b) => remap(a) - remap(b))
    const first = sorted[0], last = sorted[sorted.length - 1]
    const firstR = remap(first), lastR = remap(last)
    const inRange = Array.from({ length: lastR - firstR + 1 }, (_, i) => (firstR + i === 7 ? 0 : firstR + i))
    const mancanti = inRange.filter(d => !giorni.includes(d))
    const range = `da ${NOMI_GIORNI[first]} a ${NOMI_GIORNI[last]}`
    return mancanti.length > 0 ? `${range}, escluso ${esclusoLabel(mancanti)}` : range
  }

  if (evento.ricorrenza === 'giornaliera') {
    const esclusi = (evento.giorniEsclusione || '').split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    const attivi = [0,1,2,3,4,5,6]
      .filter(d => !esclusi.includes(d))
      .filter(d => !giorniAperti || giorniAperti.size === 0 || giorniAperti.has(d))
      .sort((a, b) => remap(a) - remap(b))
    if (attivi.length === 0) return ''
    if (attivi.length === 7) return 'tutti i giorni'
    const first = attivi[0], last = attivi[attivi.length - 1]
    const firstR = remap(first), lastR = remap(last)
    const inRange = Array.from({ length: lastR - firstR + 1 }, (_, i) => (firstR + i === 7 ? 0 : firstR + i))
    const mancanti = inRange.filter(d => !attivi.includes(d))
    const range = `da ${NOMI_GIORNI[first]} a ${NOMI_GIORNI[last]}`
    return mancanti.length > 0 ? `${range}, escluso ${esclusoLabel(mancanti)}` : range
  }

  return evento.giornoSettimana || 'ogni settimana'
}

function CardEventoUnico({ evento, variante = 'prossimo' }: { evento: EventoAgenda; variante?: 'prossimo' | 'futuro' | 'passato' }) {
  const href = evento.slug ? `/eventi-speciali/${evento.slug}` : null
  const data = evento.data ? (() => {
    const d = new Date(evento.data! + 'T00:00:00')
    return { giorno: d.getDate(), mese: MESI_SHORT[d.getMonth()], anno: d.getFullYear() }
  })() : null

  const imgUrl = evento.fotoHero ||
    (evento.blocchi?.find(b => b.tipo === 'immagine' && (b as {url?:string}).url)
      ? (evento.blocchi.find(b => b.tipo === 'immagine') as {url:string}).url
      : null)

  const ctaLabel = variante === 'prossimo' ? 'Scopri di più →' : 'Rimani aggiornato →'

  return (
    href ? (
    <Link href={href}>
    <article className={`border rounded-card overflow-hidden transition-colors ${variante === 'passato' ? 'border-white/5 opacity-70' : 'border-white/10'} hover:border-brand/30 cursor-pointer`}>

      {imgUrl && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={evento.titolo} className="w-full h-48 object-cover" style={variante === 'passato' ? { filter: 'grayscale(30%)' } : {}} />
        </div>
      )}

      {/* Contenuto */}
      <div className="flex gap-5 p-5">
        {variante === 'futuro' ? (
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-btn border border-brand/30 bg-brand/5">
            <span className="text-brand/60 uppercase font-medium text-center leading-tight" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>Data da<br/>definire</span>
          </div>
        ) : data ? (
          <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-btn border ${variante === 'passato' ? 'border-white/10 bg-white/5' : 'border-brand/40 bg-brand/10'}`}>
            <span className={`font-ivy font-normal leading-none ${variante === 'passato' ? 'text-text-faint' : 'text-brand'}`} style={{ fontSize: '1.5rem' }}>
              {data.giorno}
            </span>
            <span className={`uppercase font-medium ${variante === 'passato' ? 'text-text-faint/60' : 'text-brand/70'}`} style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
              {data.mese}
            </span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h3 className="font-raleway font-normal text-white leading-tight" style={{ fontSize: 'var(--text-section)' }}>
            {evento.titolo}
          </h3>
          {variante !== 'futuro' && evento.orario && (
            <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>
              ore {evento.orario}{evento.orarioFine ? `–${evento.orarioFine}` : ''}
            </p>
          )}
          {evento.descrizione && (
            <p className="text-text-muted mt-2 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              {evento.descrizione}
            </p>
          )}
          {href && (
            <span className="text-brand mt-3 block" style={{ fontSize: 'var(--text-meta)' }}>
              {ctaLabel}
            </span>
          )}
        </div>
      </div>
    </article>
    </Link>
    ) : (
    <article className={`border rounded-card overflow-hidden transition-colors ${variante === 'passato' ? 'border-white/5 opacity-70' : 'border-white/10'}`}>
      {imgUrl && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={evento.titolo} className="w-full h-48 object-cover" style={variante === 'passato' ? { filter: 'grayscale(30%)' } : {}} />
        </div>
      )}
      <div className="flex gap-5 p-5">
        {variante === 'futuro' ? (
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-btn border border-brand/30 bg-brand/5">
            <span className="text-brand/60 uppercase font-medium text-center leading-tight" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>Data da<br/>definire</span>
          </div>
        ) : data ? (
          <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-btn border ${variante === 'passato' ? 'border-white/10 bg-white/5' : 'border-brand/40 bg-brand/10'}`}>
            <span className={`font-ivy font-normal leading-none ${variante === 'passato' ? 'text-text-faint' : 'text-brand'}`} style={{ fontSize: '1.5rem' }}>
              {data.giorno}
            </span>
            <span className={`uppercase font-medium ${variante === 'passato' ? 'text-text-faint/60' : 'text-brand/70'}`} style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
              {data.mese}
            </span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h3 className="font-raleway font-normal text-white leading-tight" style={{ fontSize: 'var(--text-section)' }}>
            {evento.titolo}
          </h3>
          {variante !== 'futuro' && evento.orario && (
            <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>
              ore {evento.orario}{evento.orarioFine ? `–${evento.orarioFine}` : ''}
            </p>
          )}
          {evento.descrizione && (
            <p className="text-text-muted mt-2 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              {evento.descrizione}
            </p>
          )}
        </div>
      </div>
    </article>
    )
  )
}

function CardEventoRicorrente({ evento, giorniAperti }: { evento: EventoAgenda; giorniAperti?: Set<number> }) {
  const href = evento.slug ? `/eventi-speciali/${evento.slug}` : null
  const imgUrl = evento.fotoHero ||
    (evento.blocchi?.find(b => b.tipo === 'immagine' && (b as {url?:string}).url)
      ? (evento.blocchi.find(b => b.tipo === 'immagine') as {url:string}).url
      : null)

  const schedaLabel = schedaRicorrenza(evento, giorniAperti)
  const orarioLabel = evento.orario
    ? `ore ${evento.orario}${evento.orarioFine ? `–${evento.orarioFine}` : ''}`
    : null

  return (
    href ? (
    <Link href={href}>
    <article className="relative border border-white/10 rounded-card p-6 overflow-hidden transition-colors hover:border-brand/30 cursor-pointer">

      {imgUrl && (
        <div className="mb-5 -mx-6 -mt-6 overflow-hidden rounded-t-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={evento.titolo} className="w-full h-48 object-cover" />
        </div>
      )}

      <div className="relative">
        <div
          className="inline-block px-3 py-1 rounded-pill bg-brand/15 text-brand uppercase font-medium mb-4"
          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
        >
          {schedaLabel}
        </div>
        <h3 className="font-raleway font-normal text-white" style={{ fontSize: 'var(--text-section)' }}>
          {evento.titolo}
        </h3>
        {orarioLabel && (
          <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>
            {orarioLabel}
          </p>
        )}
        {evento.descrizione && (
          <p className="text-text-muted mt-3 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            {evento.descrizione}
          </p>
        )}
        {href && (
          <span className="text-brand mt-3 block" style={{ fontSize: 'var(--text-meta)' }}>
            Scopri di più →
          </span>
        )}
      </div>
    </article>
    </Link>
    ) : (
    <article className="relative border border-white/10 rounded-card p-6 overflow-hidden transition-colors hover:border-brand/30">
      {imgUrl && (
        <div className="mb-5 -mx-6 -mt-6 overflow-hidden rounded-t-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt={evento.titolo} className="w-full h-48 object-cover" />
        </div>
      )}
      <div className="relative">
        <div
          className="inline-block px-3 py-1 rounded-pill bg-brand/15 text-brand uppercase font-medium mb-4"
          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
        >
          {schedaLabel}
        </div>
        <h3 className="font-raleway font-normal text-white" style={{ fontSize: 'var(--text-section)' }}>
          {evento.titolo}
        </h3>
        {orarioLabel && (
          <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>
            {orarioLabel}
          </p>
        )}
        {evento.descrizione && (
          <p className="text-text-muted mt-3 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            {evento.descrizione}
          </p>
        )}
      </div>
    </article>
    )
  )
}

export default async function EventiSpecialiPage() {
  const [tutti, giorniAperti] = await Promise.all([fetchEventi(), fetchGiorniAperti()])
  const oggi = new Date().toISOString().split('T')[0]

  const prossimi = tutti.filter(e => e.stato === 'attivo' && !e.ricorrente && e.data && e.data >= oggi)
  const futuri   = tutti.filter(e => e.stato === 'futuro' && !e.ricorrente)
  const fissi    = tutti.filter(e => e.stato === 'attivo' && e.ricorrente)
  const passati  = tutti.filter(e => e.stato === 'passato' && !!e.slug)
  const nessuno  = prossimi.length === 0 && fissi.length === 0 && futuri.length === 0

  return (
    <main>
      <PaginaHero
        titolo="Eventi Speciali"
        sottotitolo="Appuntamenti & Serate"
        tagline="Musica live, serate a tema e appuntamenti fissi — scopri cosa ti aspetta"
        image="/images/hero/1.webp"
      />

      <section className="text-white py-20 px-6 md:px-14" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-5xl mx-auto">

          {nessuno && (
            <FadeIn>
              <p className="text-text-faint" style={{ fontSize: 'var(--text-lead)' }}>
                Nessun evento in programma al momento. Torna a trovarci presto!
              </p>
            </FadeIn>
          )}

          {prossimi.length > 0 && (
            <FadeIn>
              <h2 className="font-raleway font-normal text-white mb-10" style={{ fontSize: '2.25rem' }}>
                Prossimi appuntamenti
              </h2>
              <div className="flex flex-col gap-4">
                {prossimi.map((e, i) => <CardEventoUnico key={i} evento={e} variante="prossimo" />)}
              </div>
            </FadeIn>
          )}

          {futuri.length > 0 && (
            <FadeIn delay={0.05} className={prossimi.length > 0 ? 'mt-20' : ''}>
              <h2 className="font-raleway font-normal text-white mb-3" style={{ fontSize: '2.25rem' }}>
                Prossimamente
              </h2>
              <p className="text-text-faint mb-10" style={{ fontSize: 'var(--text-body)' }}>
                Stiamo definendo le date — iscriviti per essere tra i primi a saperlo.
              </p>
              <div className="flex flex-col gap-4">
                {futuri.map((e, i) => <CardEventoUnico key={i} evento={e} variante="futuro" />)}
              </div>
            </FadeIn>
          )}

          {fissi.length > 0 && (
            <FadeIn delay={0.1} className={(prossimi.length > 0 || futuri.length > 0) ? 'mt-20' : ''}>
              <h2 className="font-raleway font-normal text-white mb-10" style={{ fontSize: '2.25rem' }}>
                Ogni settimana
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {fissi.map((e, i) => <CardEventoRicorrente key={i} evento={e} giorniAperti={giorniAperti} />)}
              </div>
            </FadeIn>
          )}

          {passati.length > 0 && (
            <FadeIn delay={0.15} className="mt-20">
              <h2 className="font-raleway font-normal text-white mb-3" style={{ fontSize: '2.25rem' }}>
                Appuntamenti passati
              </h2>
              <p className="text-text-faint mb-10" style={{ fontSize: 'var(--text-body)' }}>
                Questi eventi potrebbero tornare — rimani aggiornato.
              </p>
              <div className="flex flex-col gap-4">
                {passati.map((e, i) => <CardEventoUnico key={i} evento={e} variante="passato" />)}
              </div>
            </FadeIn>
          )}

        </div>
      </section>

      <SezioneContatti />
      <Footer />
    </main>
  )
}
