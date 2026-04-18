'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Placeholder — in futuro collegato alla dashboard
const eventoPopup = {
  label: '12 Aprile 2025',
  titolo: 'Serata Jazz Live',
  descrizione: 'Una serata speciale con musica dal vivo nel nostro giardino. Posti limitati, prenota subito il tuo tavolo.',
  image: '/images/hero/1.webp',
  ctaLabel: 'Prenota ora',
  ctaHref: '/prenota',
}

const SESSION_KEY = 'popup_shown'

export default function EventoPopup() {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    const t = setTimeout(() => {
      setVisible(true)
      setTimeout(() => setAnimating(true), 10)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 800)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setAnimating(false)
    setTimeout(() => setVisible(false), 350)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundColor: `rgba(0,0,0,${animating ? 0.6 : 0})`,
        transition: 'background-color 0.35s ease',
      }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-lg rounded-card overflow-hidden shadow-2xl"
        style={{
          transform: animating ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: animating ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Foto */}
        <div className="relative h-56 md:h-72">
          <Image
            src={eventoPopup.image}
            alt={eventoPopup.titolo}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
          />
        </div>

        {/* Contenuto */}
        <div className="bg-white px-8 py-7 flex flex-col gap-3">
          <span
            className="uppercase text-black/40 font-medium"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            {eventoPopup.label}
          </span>
          <h2 className="text-2xl font-semibold text-neutral-900 leading-tight">
            {eventoPopup.titolo}
          </h2>
          <p className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            {eventoPopup.descrizione}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href={eventoPopup.ctaHref}
              className="bg-brand hover:bg-brand-hover text-black font-semibold px-6 py-3 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-meta)' }}
              onClick={close}
            >
              {eventoPopup.ctaLabel}
            </Link>
            <button
              onClick={close}
              className="text-neutral-400 hover:text-neutral-600 transition-colors font-light"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Non ora
            </button>
          </div>
        </div>

        {/* Chiudi */}
        <button
          onClick={close}
          className="absolute top-4 right-4 w-8 h-8 rounded-pill bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          aria-label="Chiudi"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
