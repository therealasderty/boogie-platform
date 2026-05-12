import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { fetchEventi } from '@/lib/agenda'
import { fetchMedia } from '@/lib/media'
import { fetchOrari, fetchChiusure, buildOrariLines } from '@/lib/orari'
import LinksPrenotaSticky from '@/components/LinksPrenotaSticky'
import Calendario from '@/components/Calendario'

export const metadata: Metadata = {
  title: 'Boogie Bistrot | Link',
  description: 'Tutto quello che cerchi sul Boogie Bistrot: menù, prenotazioni, eventi e info utili.',
}

// ─── Helpers label evento ─────────────────────────────────────────────────────
const GIORNI_BREVI   = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const GIORNI_LABEL   = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_ESTESI  = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const MESI_FULL      = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const ORDINE_SETTIMANA = [1, 2, 3, 4, 5, 6, 0]

function formatGiorniSettimana(giorniStr: string): string {
  const nums = giorniStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (!nums.length) return ''
  const sorted = ORDINE_SETTIMANA.filter(g => nums.includes(g))
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETTIMANA.indexOf(sorted[j + 1]) === ORDINE_SETTIMANA.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL[chunk[0]] : `${GIORNI_LABEL[chunk[0]]}–${GIORNI_LABEL[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

function formatGiornaliera(esclusiEvento: number[], giorniChiusi: number[]): string {
  const tuttiEsclusi = [...new Set([...esclusiEvento, ...giorniChiusi])]
  const attivi = ORDINE_SETTIMANA.filter(d => !tuttiEsclusi.includes(d))
  if (attivi.length === 0) return ''
  if (attivi.length === 7) return 'Tutti i giorni'
  const firstIdx = ORDINE_SETTIMANA.indexOf(attivi[0])
  const lastIdx  = ORDINE_SETTIMANA.indexOf(attivi[attivi.length - 1])
  const inRange  = ORDINE_SETTIMANA.slice(firstIdx, lastIdx + 1)
  const esclusiInRange = inRange.filter(d => !attivi.includes(d))
  const rangeLabel = firstIdx === lastIdx ? GIORNI_LABEL[attivi[0]] : `${GIORNI_LABEL[attivi[0]]}–${GIORNI_LABEL[attivi[attivi.length - 1]]}`
  return esclusiInRange.length === 0 ? rangeLabel : `${rangeLabel} (escluso ${esclusiInRange.map(n => GIORNI_BREVI[n]).join(', ')})`
}

function formatLabelEvento(e: { data: string | null; ricorrente: boolean; ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; orario: string; orarioFine: string }, giorniChiusi: number[] = []): string {
  let giornoLabel = ''

  if (e.data && !e.ricorrente) {
    const d = new Date(e.data + 'T00:00:00')
    giornoLabel = `${GIORNI_LABEL[d.getDay()]} ${d.getDate()} ${MESI_FULL[d.getMonth()]}`
  } else if (e.ricorrenza === 'giornaliera') {
    const esclusi = e.giorniEsclusione ? e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n)) : []
    giornoLabel = formatGiornaliera(esclusi, giorniChiusi)
  } else if (e.ricorrenza === 'settimanale' && e.giornoSettimana) {
    const nums = e.giornoSettimana.split(',').map(Number).filter(n => !isNaN(n))
    let label = nums.length === 1 && GIORNI_ESTESI[nums[0]]
      ? `Ogni ${GIORNI_ESTESI[nums[0]]}`
      : `Ogni ${formatGiorniSettimana(e.giornoSettimana)}`
    if (e.giorniEsclusione) {
      const esclusi = e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI[n])
      if (esclusi.length > 0) label += ` (escluso ${esclusi.map(n => GIORNI_BREVI[n]).join(', ')})`
    }
    giornoLabel = label || 'Appuntamento fisso'
  } else {
    giornoLabel = 'Appuntamento fisso'
  }

  const oraLabel = e.orario ? (e.orarioFine ? `${e.orario}–${e.orarioFine}` : e.orario) : ''
  return oraLabel ? `${giornoLabel} · ${oraLabel}` : giornoLabel
}

// ─── Componenti UI ────────────────────────────────────────────────────────────
function Sezione({ label }: { label: string }) {
  return (
    <p style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand)', fontWeight: 600, marginBottom: '10px', marginTop: '28px' }}>
      {label}
    </p>
  )
}

function Card({ href, titolo, meta, avatar, esterno = false, highlight = false }: { href: string; titolo: string; meta?: string; avatar?: string; esterno?: boolean; highlight?: boolean }) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderRadius: '12px', overflow: 'hidden',
      border: highlight ? `1px solid rgba(238,206,157,0.3)` : '1px solid rgba(255,255,255,0.08)',
      borderLeftWidth: highlight ? 3 : 1,
      borderLeftColor: highlight ? 'var(--color-brand)' : undefined,
      background: highlight ? 'rgba(238,206,157,0.06)' : 'rgba(255,255,255,0.04)',
      transition: 'all 0.2s',
    }}>
      {avatar && (
        <div style={{ width: 90, flexShrink: 0, position: 'relative', alignSelf: 'stretch' }}>
          <Image src={avatar} alt={titolo} fill style={{ objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{titolo}</p>
          {meta && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>{meta}</p>}
        </div>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'rgba(255,255,255,0.25)' }}>
          <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )

  if (esterno) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>
  return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
}

// ─── Pagina ───────────────────────────────────────────────────────────────────
export default async function LinksPage() {
  const oggi = new Date().toISOString().split('T')[0]
  const [eventi, orari, chiusure, mediaSpecialita, mediaPizza, mediaVini, mediaBirre, mediaCocktails] = await Promise.all([
    fetchEventi(),
    fetchOrari(),
    fetchChiusure(),
    fetchMedia('carta'),
    fetchMedia('pizza'),
    fetchMedia('vino'),
    fetchMedia('birra'),
    fetchMedia('cocktail'),
  ])
  const orariDisplay = buildOrariLines(orari, chiusure)
  const giorniConOrari = new Set(orari.filter(o => o.attivo && o.giorno !== null).map(o => o.giorno as number))
  const chiusiOrdinari = [0,1,2,3,4,5,6].filter(d => !giorniConOrari.has(d))
  const chiusiSettimanali = chiusure
    .filter(c => c.tipo === 'Giorno della settimana' && c.tipoApertura === 'Chiusura' && c.giorno !== null)
    .map(c => c.giorno as number)
  const giorniChiusi = [...new Set([...chiusiOrdinari, ...chiusiSettimanali])]

  const eventiAttivi = eventi
    .filter(e => {
      if (e.stato !== 'attivo') return false
      if (e.ricorrente) return true
      if (!e.data) return false
      return e.data >= oggi
    })
    .sort((a, b) => {
      const aNonRic = !a.ricorrente && !!a.data
      const bNonRic = !b.ricorrente && !!b.data
      if (aNonRic && !bNonRic) return -1
      if (!aNonRic && bNonRic) return 1
      if (aNonRic && bNonRic) return (a.data as string).localeCompare(b.data as string)
      return 0
    })

  const eventiFuturi = eventi.filter(e => e.stato === 'futuro' && !!e.slug)

  return (
    <main style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '40px 20px 0' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block', margin: '0 auto 24px' }}>
            <Image src="/Logo-Gold.svg" alt="Boogie Bistrot" width={100} height={40} style={{ display: 'block' }} />
          </Link>
          <p style={{ margin: '0 0 6px' }}>
            <a href="https://maps.google.com/?q=Via+Europa+2+Colle+Brianza" target="_blank" rel="noopener noreferrer" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 400, textDecoration: 'none' }}>
              Via Europa, 2 · Colle Brianza (LC)
            </a>
          </p>
          {orariDisplay.righe.map((riga, i) => (
            <p key={i} style={{ margin: '3px 0', fontSize: '0.92rem', color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>
              {riga}
            </p>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {(['+39 039 9260568', '+39 346 5813309'] as const).map((num) => (
              <a
                key={num}
                href={`tel:${num.replace(/\s/g, '')}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(238,206,157,0.08)',
                  border: '1px solid rgba(238,206,157,0.22)',
                  borderRadius: 999,
                  padding: '8px 16px',
                  color: 'var(--color-brand)', fontWeight: 500, fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.58z" />
                </svg>
                {num}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            <a href="https://www.instagram.com/boogiebistrot" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            <a href="https://www.facebook.com/BoogieBistrot" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>

        {/* CTA Prenota */}
        <Link
          id="prenota-btn"
          href="/prenota"
          style={{
            display: 'block', textAlign: 'center',
            background: 'var(--color-brand)',
            color: '#000', fontWeight: 700, fontSize: '0.95rem',
            padding: '16px', borderRadius: '12px',
            textDecoration: 'none', letterSpacing: '0.02em',
            transition: 'opacity 0.2s',
          }}
          data-umami-event="prenota"
          data-umami-event-source="links"
        >
          Prenota un tavolo
        </Link>

        {/* Appuntamenti */}
        {(eventiAttivi.length > 0 || eventiFuturi.length > 0) && (
          <>
            <Sezione label="Appuntamenti" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventiAttivi.map((e, i) => (
                <Card
                  key={i}
                  href={e.slug ? `/eventi-speciali/${e.slug}` : '/eventi-speciali'}
                  titolo={e.titolo}
                  meta={formatLabelEvento(e, giorniChiusi)}
                  avatar={e.fotoHero || undefined}
                  highlight
                />
              ))}
              {eventiFuturi.map((e, i) => (
                <Card
                  key={`futuro-${i}`}
                  href={`/eventi-speciali/${e.slug}`}
                  titolo={e.titolo}
                  meta="Prossimamente · Data da definire"
                  avatar={e.fotoHero || undefined}
                />
              ))}
            </div>
          </>
        )}

      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 20px' }}>

        {/* Menù */}
        <Sezione label="I nostri menù" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Card href="/menu/specialita" titolo="Specialità alla carta" meta="Cucina del territorio rivisitata" avatar={mediaSpecialita[0]?.url} />
          <Card href="/menu/pizza"      titolo="Pizza" meta="Impasto a lunga lievitazione · forno a legna" avatar={mediaPizza[0]?.url} />
          <Card href="/menu/vini"       titolo="Carta dei Vini" meta="Etichette italiane e locali" avatar={mediaVini[0]?.url} />
          <Card href="/menu/birre"      titolo="Birre" meta="Selezione artigianale dalla Lombardia" avatar={mediaBirre[0]?.url} />
          <Card href="/menu/cocktails"  titolo="Cocktail" meta="Aperitivi, long drink e signature" avatar={mediaCocktails[0]?.url} />
        </div>

        {/* Info utili */}
        <Sezione label="Info utili" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Card href="/galleria"  titolo="Galleria fotografica" />
          <Card href="/fidelity"  titolo="Fidelity Card" />
          <Card href="/faq"       titolo="Domande frequenti" />
          <Card href="/contattaci" titolo="Contattaci" />
        </div>

        {/* Divisore */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '36px 0 0' }} />

      </div>

      {/* Calendario settimana — in fondo */}
      <Calendario orari={orari} chiusure={chiusure} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>
        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 32, marginBottom: 80, fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>
          © {new Date().getFullYear()} Boogie Bistrot
        </p>
      </div>

      <LinksPrenotaSticky />
    </main>
  )
}
