'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import SlimPopup from './SlimPopup'

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, unknown>) => void }
  }
}

// ─── Tipi ────────────────────────────────────────────────────────────────────

type Chiusura = {
  tipo: string        // 'Apertura straordinaria' | 'Chiusura'
  descrizione: string
  dataInizio: string
  dataFine: string
  fasce: string[]
}

type PopupData = {
  slug:             string
  titolo:           string
  descrizioneBreve: string
  fotoHero:         string
  data:             string | null
  ricorrente:       boolean
  stato:            string
}

type Urgency = 'distante' | 'imminente' | 'lastMinute'

// ─── Helpers evento ───────────────────────────────────────────────────────────

const DELAY_MS: Record<Urgency, number> = {
  distante:   10000,
  imminente:   5000,
  lastMinute:  2000,
}

const TTL_RICORRENTE = 7 * 24 * 60 * 60 * 1000
const TTL_UNATANTUM  = 24 * 60 * 60 * 1000

function getUrgency(data: string | null, ricorrente: boolean): Urgency {
  if (!data || ricorrente) return 'distante'
  const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
  const giorni = Math.ceil((new Date(data + 'T00:00:00').getTime() - oggi.getTime()) / 86400000)
  if (giorni < 3)  return 'lastMinute'
  if (giorni <= 7) return 'imminente'
  return 'distante'
}

function getBadge(data: string | null, urgency: Urgency): string | null {
  if (urgency === 'imminente') return 'Prossimamente'
  if (urgency === 'lastMinute') {
    if (!data) return 'Ultimi posti'
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
    const giorni = Math.ceil((new Date(data + 'T00:00:00').getTime() - oggi.getTime()) / 86400000)
    return giorni <= 0 ? 'Stasera' : 'Ultimi posti'
  }
  return null
}

function formatData(data: string): string {
  const d = new Date(data + 'T00:00:00')
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function shouldUseSlim(popup: PopupData, urgency: Urgency): boolean {
  if (popup.fotoHero) return false
  if (urgency === 'lastMinute') return false
  if (urgency === 'imminente') return false
  return true
}

function storageKey(id: string) { return `bb-popup-${id}` }

function hasBeenSeen(id: string, ricorrente: boolean): boolean {
  try {
    const raw = localStorage.getItem(storageKey(id))
    if (!raw) return false
    const ttl = ricorrente ? TTL_RICORRENTE : TTL_UNATANTUM
    return Date.now() - parseInt(raw, 10) < ttl
  } catch { return false }
}

function markAsSeen(id: string) {
  try { localStorage.setItem(storageKey(id), String(Date.now())) } catch {}
}

// ─── Helpers chiusure ─────────────────────────────────────────────────────────

const CHIUSURA_KEY = 'bb-banner-chiusure'
const CHIUSURA_TTL = 24 * 60 * 60 * 1000

function chiusuraWasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(CHIUSURA_KEY)
    if (!raw) return false
    return Date.now() - parseInt(raw, 10) < CHIUSURA_TTL
  } catch { return false }
}

function chiusuraMarkDismissed() {
  try { localStorage.setItem(CHIUSURA_KEY, String(Date.now())) } catch {}
}

function buildTestoChiusura(ev: Chiusura): string {
  const isApertura  = ev.tipo === 'Apertura straordinaria'
  const isSingleDay = !ev.dataFine || ev.dataFine === ev.dataInizio
  const fascePart   = ev.fasce.length > 0 ? ` (solo ${ev.fasce.join(' e ')})` : ''

  if (isSingleDay) {
    const d = new Date(ev.dataInizio + 'T12:00:00')
    const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    const giorno = s.charAt(0).toUpperCase() + s.slice(1)
    return isApertura ? `${giorno} siamo aperti${fascePart}` : `${giorno} siamo chiusi${fascePart}`
  }

  const inizio = new Date(ev.dataInizio + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  const fine   = new Date(ev.dataFine   + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  return isApertura
    ? `Dal ${inizio} al ${fine} siamo aperti${fascePart}`
    : `Dal ${inizio} al ${fine} siamo chiusi${fascePart}`
}

// ─── Blacklist ────────────────────────────────────────────────────────────────

const POPUP_BLACKLIST = [
  /^\/prenota(\/|$)/,
  /^\/links(\/|$)/,
  /^\/eventi-speciali(\/|$)/,
  /^\/vicino-a\/.+\/.+/,
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PopupManager({ chiusure = [] }: { chiusure?: Chiusura[] }) {
  const pathname = usePathname()

  const [mode,            setMode]            = useState<'chiusura' | 'evento' | null>(null)
  const [chiusuraEventi,  setChiusuraEventi]  = useState<Chiusura[]>([])
  const [popup,           setPopup]           = useState<PopupData | null>(null)
  const [urgency,         setUrgency]         = useState<Urgency>('distante')
  const [visible,         setVisible]         = useState(false)
  const [animating,       setAnimating]       = useState(false)
  const [isDesktop,       setIsDesktop]       = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (POPUP_BLACKLIST.some(re => re.test(pathname))) return
    let timer: ReturnType<typeof setTimeout>

    // 1. Chiusure hanno priorità
    if (!chiusuraWasDismissed()) {
      const oggi = new Date().toISOString().split('T')[0]
      const attivi = chiusure.filter(ev => (ev.dataFine || ev.dataInizio) >= oggi)
      if (attivi.length > 0) {
        setChiusuraEventi(attivi)
        setMode('chiusura')
        timer = setTimeout(() => {
          setVisible(true)
          setTimeout(() => setAnimating(true), 20)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }

    // 2. Altrimenti popup evento
    async function carica() {
      try {
        const res  = await fetch('/api/get-popup')
        const json = await res.json()
        if (!json.success || !json.popup?.titolo) return

        const data: PopupData = json.popup
        const id = data.slug || data.titolo
        if (hasBeenSeen(id, data.ricorrente)) return

        const urg = getUrgency(data.data, data.ricorrente)
        setPopup(data)
        setUrgency(urg)
        setMode('evento')

        timer = setTimeout(() => {
          setVisible(true)
          setTimeout(() => setAnimating(true), 20)
        }, DELAY_MS[urg])
      } catch {}
    }

    carica()
    return () => clearTimeout(timer)
  }, [pathname, chiusure])

  // ─── Chiudi ───────────────────────────────────────────────────────────────

  function chiudiChiusura() {
    chiusuraMarkDismissed()
    setAnimating(false)
    setTimeout(() => setVisible(false), 350)
  }

  function chiudiEvento() {
    if (popup) markAsSeen(popup.slug || popup.titolo)
    const slim = !!popup && shouldUseSlim(popup, urgency) && isDesktop
    if (slim) {
      setVisible(false)
    } else {
      setAnimating(false)
      setTimeout(() => setVisible(false), 350)
    }
  }

  if (!visible) return null

  // ─── Render chiusura ──────────────────────────────────────────────────────

  if (mode === 'chiusura' && chiusuraEventi.length > 0) {
    const ev          = chiusuraEventi[0]
    const isApertura  = ev.tipo === 'Apertura straordinaria'
    const testo       = buildTestoChiusura(ev)
    const badge       = isApertura ? 'Apertura straordinaria' : 'Chiusura straordinaria'
    const accentColor = isApertura ? '#1a3d1f' : '#7a1a1a'

    return (
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-8"
        style={{
          backgroundColor: `rgba(0,0,0,${animating ? 0.5 : 0})`,
          backdropFilter:  `blur(${animating ? 3 : 0}px)`,
          transition: 'background-color 0.35s, backdrop-filter 0.35s',
        }}
        onClick={chiudiChiusura}
      >
        <div
          className="relative w-full max-w-md rounded-card bg-white shadow-2xl overflow-hidden"
          style={{
            borderTop: `3px solid ${accentColor}`,
            opacity:   animating ? 1 : 0,
            transform: animating ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
            transition: 'opacity 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={chiudiChiusura}
            aria-label="Chiudi"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-pill bg-white shadow-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <div className="px-8 py-7 flex flex-col gap-4">
            <span
              className="self-start text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill text-white"
              style={{ backgroundColor: accentColor }}
            >
              {badge}
            </span>

            <p className="font-sans font-semibold text-neutral-900 leading-snug pr-6" style={{ fontSize: 'var(--text-section)' }}>
              {testo}
            </p>

            {chiusuraEventi.length > 1 && (
              <p className="text-neutral-400 font-light -mt-1" style={{ fontSize: 'var(--text-meta)' }}>
                +{chiusuraEventi.length - 1} {chiusuraEventi.length - 1 === 1 ? 'altro avviso' : 'altri avvisi'}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              {isApertura && (
                <Link
                  href="/prenota"
                  onClick={chiudiChiusura}
                  className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors"
                  style={{ fontSize: 'var(--text-meta)' }}
                >
                  Prenota ora
                </Link>
              )}
              <button
                onClick={chiudiChiusura}
                className="text-neutral-400 hover:text-neutral-600 transition-colors font-light"
                style={{ fontSize: 'var(--text-meta)' }}
              >
                {isApertura ? 'Non ora' : 'Ho capito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render evento ────────────────────────────────────────────────────────

  if (mode !== 'evento' || !popup) return null

  const showSlim = shouldUseSlim(popup, urgency) && isDesktop

  if (showSlim) {
    const isPassato = popup.stato === 'passato' || popup.stato === 'dormiente'
    const href = popup.slug
      ? ((isPassato || popup.stato === 'futuro') ? `/eventi-speciali/${popup.slug}#prenota` : `/eventi-speciali/${popup.slug}`)
      : '/prenota'
    const ctaLabel = isPassato ? 'Rimani aggiornato' : 'Scopri di più'

    return (
      <AnimatePresence>
        {visible && (
          <SlimPopup
            key="slim-popup"
            titolo={popup.titolo}
            descrizioneBreve={popup.descrizioneBreve}
            href={href}
            ctaLabel={ctaLabel}
            onClose={chiudiEvento}
            onCta={() => {
              chiudiEvento()
              window.umami?.track('popup-cta', { titolo: popup.titolo, slug: popup.slug, format: 'slim' })
            }}
          />
        )}
      </AnimatePresence>
    )
  }

  const isPassato    = popup.stato === 'passato' || popup.stato === 'dormiente'
  const isFuturo     = popup.stato === 'futuro'
  const isLastMinute = urgency === 'lastMinute'
  const badge        = isPassato ? 'Prossimamente' : isFuturo ? 'Data da definire' : getBadge(popup.data, urgency)
  const href         = popup.slug
    ? ((isPassato || isFuturo) ? `/eventi-speciali/${popup.slug}#prenota` : `/eventi-speciali/${popup.slug}`)
    : '/prenota'
  const dataLabel    = !isPassato && !isFuturo && popup.data && !popup.ricorrente ? formatData(popup.data) : null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundColor: `rgba(0,0,0,${animating ? 0.5 : 0})`,
        backdropFilter: `blur(${animating ? 4 : 0}px)`,
        transition: 'background-color 0.35s, backdrop-filter 0.35s',
      }}
      onClick={chiudiEvento}
    >
      <div
        className="relative w-full max-w-lg rounded-card overflow-hidden shadow-2xl"
        style={{
          opacity:   animating ? 1 : 0,
          transform: animating ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={chiudiEvento}
          aria-label="Chiudi"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-pill bg-white shadow-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {popup.fotoHero ? (
          <div className="relative h-52 md:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={popup.fotoHero} alt={popup.titolo} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
          </div>
        ) : (
          <div className="h-16 bg-surface-dark" />
        )}

        <div className="bg-white px-8 py-6 flex flex-col gap-3">
          <div>
            {badge ? (
              <span className={`text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill ${isLastMinute ? 'bg-brand text-black/80' : 'bg-neutral-100 text-neutral-500'}`}>
                {badge}
              </span>
            ) : dataLabel ? (
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400" style={{ letterSpacing: 'var(--tracking-label)' }}>
                {dataLabel}
              </span>
            ) : (
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400" style={{ letterSpacing: 'var(--tracking-label)' }}>
                In evidenza
              </span>
            )}
          </div>

          {badge && dataLabel && (
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400 -mt-1" style={{ letterSpacing: 'var(--tracking-label)' }}>
              {dataLabel}
            </span>
          )}

          <h2 className="font-sans font-semibold text-neutral-900 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
            {popup.titolo}
          </h2>

          {popup.descrizioneBreve && (
            <p className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              {popup.descrizioneBreve}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <Link
              href={href}
              onClick={() => {
                chiudiEvento()
                window.umami?.track('popup-cta', { titolo: popup.titolo, slug: popup.slug })
              }}
              className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              {isPassato ? 'Rimani aggiornato' : 'Scopri di più'}
            </Link>
            <button
              onClick={chiudiEvento}
              className="text-neutral-400 hover:text-neutral-600 transition-colors font-light"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Non ora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
