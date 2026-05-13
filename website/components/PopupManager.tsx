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
  if (popup.fotoHero) return false         // ha immagine → Card
  if (urgency === 'lastMinute') return false
  if (urgency === 'imminente') return false
  return true                              // distante / ricorrente / senza foto → Slim
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

const POPUP_BLACKLIST = [
  /^\/prenota(\/|$)/,
  /^\/links(\/|$)/,
  /^\/eventi-speciali(\/|$)/,
  /^\/vicino-a\/.+\/.+/,
]

export default function PopupManager() {
  const pathname = usePathname()
  const [popup,     setPopup]     = useState<PopupData | null>(null)
  const [urgency,   setUrgency]   = useState<Urgency>('distante')
  const [visible,   setVisible]   = useState(false)
  const [animating, setAnimating] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

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

        timer = setTimeout(() => {
          setVisible(true)
          setTimeout(() => setAnimating(true), 20)
        }, DELAY_MS[urg])
      } catch {}
    }

    carica()
    return () => clearTimeout(timer)
  }, [pathname])

  const showSlim = !!popup && shouldUseSlim(popup, urgency) && isDesktop

  function chiudi() {
    if (popup) markAsSeen(popup.slug || popup.titolo)
    if (showSlim) {
      setVisible(false)
    } else {
      setAnimating(false)
      setTimeout(() => setVisible(false), 350)
    }
  }

  if (!visible || !popup) return null

  // Slim: solo desktop, nessun contenuto visivo urgente
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
            onClose={chiudi}
            onCta={() => {
              chiudi()
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
      onClick={chiudi}
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
        {/* X chiudi — cerchio bianco sopra la foto */}
        <button
          onClick={chiudi}
          aria-label="Chiudi"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-pill bg-white shadow-md flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* Foto hero */}
        {popup.fotoHero ? (
          <div className="relative h-52 md:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={popup.fotoHero}
              alt={popup.titolo}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)' }}
            />
          </div>
        ) : (
          <div className="h-16 bg-surface-dark" />
        )}

        {/* Contenuto */}
        <div className="bg-white px-8 py-6 flex flex-col gap-3">

          {/* Badge / data */}
          <div>
            {badge ? (
              <span className={`text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill ${isLastMinute ? 'bg-brand text-black/80' : 'bg-neutral-100 text-neutral-500'}`}>
                {badge}
              </span>
            ) : dataLabel ? (
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400"
                style={{ letterSpacing: 'var(--tracking-label)' }}>
                {dataLabel}
              </span>
            ) : (
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400"
                style={{ letterSpacing: 'var(--tracking-label)' }}>
                In evidenza
              </span>
            )}
          </div>

          {/* Data (se c'è badge al posto della data, mostrala sotto) */}
          {badge && dataLabel && (
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400 -mt-1"
              style={{ letterSpacing: 'var(--tracking-label)' }}>
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
                chiudi()
                window.umami?.track('popup-cta', { titolo: popup.titolo, slug: popup.slug })
              }}
              className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              {isPassato ? 'Rimani aggiornato' : 'Scopri di più'}
            </Link>
            <button
              onClick={chiudi}
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
