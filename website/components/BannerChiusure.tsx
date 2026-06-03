'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Evento = {
  tipo: string          // 'Apertura straordinaria' | 'Chiusura'
  descrizione: string
  dataInizio: string
  dataFine: string
  fasce: string[]
}

function formatDate(str: string): string {
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildTesto(ev: Evento): string {
  const isApertura = ev.tipo === 'Apertura straordinaria'
  const isSingleDay = !ev.dataFine || ev.dataFine === ev.dataInizio
  const fascePart = ev.fasce.length > 0 ? ` (solo ${ev.fasce.join(' e ')})` : ''

  if (isSingleDay) {
    const giorno = capitalize(formatDate(ev.dataInizio))
    return isApertura
      ? `${giorno} siamo aperti${fascePart}`
      : `${giorno} siamo chiusi${fascePart}`
  }

  const inizio = new Date(ev.dataInizio + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  const fine = new Date(ev.dataFine + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })

  return isApertura
    ? `Dal ${inizio} al ${fine} siamo aperti${fascePart}`
    : `Dal ${inizio} al ${fine} siamo chiusi${fascePart}`
}

const STORAGE_KEY = 'bb-banner-chiusure'
const TTL = 24 * 60 * 60 * 1000

function wasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    return Date.now() - parseInt(raw, 10) < TTL
  } catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

export default function BannerChiusure({ eventi: eventiProp }: { eventi: Evento[] }) {
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(0)
  const [eventi, setEventi] = useState<Evento[]>([])
  const [scrolled, setScrolled] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Filtra lato client con data reale (evita stale server date da ISR cache)
  useEffect(() => {
    const oggi = new Date().toISOString().split('T')[0]
    const filtrati = eventiProp.filter(ev => (ev.dataFine || ev.dataInizio) >= oggi)
    setEventi(filtrati)
    if (filtrati.length > 0 && !wasDismissed()) setVisible(true)
  }, [eventiProp])

  useEffect(() => {
    if (!visible || eventi.length <= 1) return
    intervalRef.current = setInterval(() => {
      setActive(i => (i + 1) % eventi.length)
    }, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [visible, eventi.length])

  if (!visible || eventi.length === 0) return null

  const ev = eventi[active]
  const isApertura = ev.tipo === 'Apertura straordinaria'
  const testo = buildTesto(ev)
  const badge = isApertura ? 'Apertura straordinaria' : 'Chiusura straordinaria'
  const bgColor = isApertura ? '#1a3d1f' : '#3d1a1a'

  // Testo completo per il marquee (badge + testo + eventuale "Prenota →" hint)
  const testoCompleto = `${badge} · ${testo}${isApertura ? ' — Prenota il tuo tavolo' : ''}`

  return (
    <>
      {/* ── Desktop: fixed, top-0 se non scrollato, top-20 se scrollato (sotto navbar) ── */}
      <div
        className="hidden lg:flex fixed z-[45] w-full items-center justify-between gap-3 px-8 transition-all duration-300"
        style={{ top: scrolled ? 80 : 0, height: 44, backgroundColor: bgColor, color: '#fff', fontSize: 'var(--text-meta)' }}
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span
            className="shrink-0 text-[0.65rem] font-semibold uppercase px-2 py-0.5 rounded-pill"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}
          >
            {badge}
          </span>
          <span className="truncate opacity-90 font-light">{testo}</span>
          {isApertura && (
            <Link
              href="/prenota"
              className="shrink-0 underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity font-medium ml-1 whitespace-nowrap"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Prenota →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {eventi.length > 1 && (
            <div className="flex gap-1">
              {eventi.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="w-1.5 h-1.5 rounded-full transition-opacity"
                  style={{ backgroundColor: '#fff', opacity: i === active ? 1 : 0.35 }}
                  aria-label={`Evento ${i + 1}`}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => { markDismissed(); setVisible(false) }}
            aria-label="Chiudi"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile: fixed sopra la bottom bar, testo marquee infinito ── */}
      <div
        className="lg:hidden fixed bottom-16 left-0 right-0 z-[45] flex items-center"
        style={{ height: 44, backgroundColor: bgColor, color: '#fff', fontSize: 'var(--text-meta)' }}
      >
        {/* Marquee area */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div
            className="flex whitespace-nowrap"
            style={{ animation: 'marquee 18s linear infinite' }}
          >
            {/* Testo duplicato per seamless loop */}
            <span className="opacity-90 font-light px-6">{testoCompleto}</span>
            <span className="opacity-90 font-light px-6">{testoCompleto}</span>
          </div>
        </div>

        {/* X chiudi — sempre visibile a destra */}
        <button
          onClick={() => { markDismissed(); setVisible(false) }}
          aria-label="Chiudi"
          className="shrink-0 w-10 h-full flex items-center justify-center hover:bg-white/15 transition-colors border-l border-white/20"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </>
  )
}
