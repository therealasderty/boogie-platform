'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Evento = {
  tipo: string
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
  const fine   = new Date(ev.dataFine   + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })

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

export default function PopupChiusure({ eventi: eventiProp }: { eventi: Evento[] }) {
  const [eventi, setEventi] = useState<Evento[]>([])
  const [visible,   setVisible]   = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (wasDismissed()) return
    const oggi = new Date().toISOString().split('T')[0]
    const filtrati = eventiProp.filter(ev => (ev.dataFine || ev.dataInizio) >= oggi)
    if (filtrati.length === 0) return
    setEventi(filtrati)
    const timer = setTimeout(() => {
      setVisible(true)
      setTimeout(() => setAnimating(true), 20)
    }, 2000)
    return () => clearTimeout(timer)
  }, [eventiProp])

  function chiudi() {
    markDismissed()
    setAnimating(false)
    setTimeout(() => setVisible(false), 350)
  }

  if (!visible || eventi.length === 0) return null

  const ev = eventi[0]
  const isApertura  = ev.tipo === 'Apertura straordinaria'
  const testo       = buildTesto(ev)
  const badge       = isApertura ? 'Apertura straordinaria' : 'Chiusura straordinaria'
  const accentColor = isApertura ? '#1a3d1f' : '#7a1a1a'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 sm:p-8"
      style={{
        backgroundColor: `rgba(0,0,0,${animating ? 0.5 : 0})`,
        backdropFilter:  `blur(${animating ? 3 : 0}px)`,
        transition: 'background-color 0.35s, backdrop-filter 0.35s',
      }}
      onClick={chiudi}
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
        {/* X chiudi */}
        <button
          onClick={chiudi}
          aria-label="Chiudi"
          className="absolute top-3 right-3 w-8 h-8 rounded-pill flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="px-8 py-7 flex flex-col gap-4">
          {/* Badge tipo */}
          <span
            className="self-start text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill text-white"
            style={{ backgroundColor: accentColor }}
          >
            {badge}
          </span>

          {/* Testo principale */}
          <p className="font-sans font-semibold text-neutral-900 leading-snug pr-6" style={{ fontSize: 'var(--text-section)' }}>
            {testo}
          </p>

          {/* Avvisi aggiuntivi */}
          {eventi.length > 1 && (
            <p className="text-neutral-400 font-light -mt-1" style={{ fontSize: 'var(--text-meta)' }}>
              +{eventi.length - 1} {eventi.length - 1 === 1 ? 'altro avviso' : 'altri avvisi'}
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center gap-3 pt-1">
            {isApertura && (
              <Link
                href="/prenota"
                onClick={chiudi}
                className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors"
                style={{ fontSize: 'var(--text-meta)' }}
              >
                Prenota ora
              </Link>
            )}
            <button
              onClick={chiudi}
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
