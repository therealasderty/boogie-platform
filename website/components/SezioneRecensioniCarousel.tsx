'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { RecensioneItem } from '@/lib/recensioni'

function IconGoogle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function IconTripadvisor() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#00AF87">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4.5 6.5c0 2.49-2.01 4.5-4.5 4.5s-4.5-2.01-4.5-4.5S9.51 7 12 7s4.5 2.01 4.5 4.5zM12 9.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S13.38 9.5 12 9.5z"/>
    </svg>
  )
}

function Stelle({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 12 12" fill={i < n ? 'var(--color-brand)' : 'none'} stroke={i < n ? 'none' : '#d1d5db'}>
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.1L6 8.02 3.22 9.56l.53-3.1L1.5 4.27l3.11-.45L6 1z" />
        </svg>
      ))}
    </div>
  )
}

interface Props {
  recensioni: RecensioneItem[]
}

export default function SezioneRecensioniCarousel({ recensioni }: Props) {
  const [current, setCurrent] = useState(0)
  const r = recensioni[current]

  function prev() { setCurrent((c) => (c - 1 + recensioni.length) % recensioni.length) }
  function next() { setCurrent((c) => (c + 1) % recensioni.length) }

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % recensioni.length), 5000)
    return () => clearInterval(t)
  }, [recensioni.length])

  if (!r) return null

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span
          className="uppercase text-black/40 font-medium"
          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
        >
          Cosa dicono di noi
        </span>
        <h2
          className="font-semibold text-neutral-900 leading-snug mt-4 mb-12"
          style={{ fontSize: 'var(--text-section)' }}
        >
          Le parole dei nostri ospiti
        </h2>
      </motion.div>

      {/* Card */}
      <motion.div
        className="relative bg-white rounded-card p-8 md:p-12 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
      >
        <span
          className="font-ivy text-brand select-none block mb-4"
          style={{ fontSize: '4rem', lineHeight: 1 }}
          aria-hidden
        >
          "
        </span>

        <p
          className="text-neutral-600 font-light leading-relaxed"
          style={{ fontSize: 'var(--text-lead)' }}
        >
          {r.testo}
        </p>

        <div className="flex flex-col items-center gap-2 mt-8">
          <Stelle n={r.stelle} />
          <p className="font-medium text-neutral-800 mt-1" style={{ fontSize: 'var(--text-meta)' }}>
            {r.nome}
          </p>
          <div className="flex items-center gap-1.5 text-neutral-400" style={{ fontSize: 'var(--text-label)' }}>
            {r.piattaforma === 'Google' ? <IconGoogle /> : <IconTripadvisor />}
            {r.piattaforma === 'Google' ? 'Google' : 'TripAdvisor'} · {r.data}
          </div>
        </div>
      </motion.div>

      {/* Navigazione */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          onClick={prev}
          aria-label="Precedente"
          className="w-10 h-10 rounded-btn border border-neutral-200 flex items-center justify-center hover:border-neutral-400 transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {recensioni.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Recensione ${i + 1}`}
              className="rounded-pill transition-all duration-300"
              style={{
                width: i === current ? '24px' : '6px',
                height: '6px',
                backgroundColor: i === current ? '#171717' : '#d1d5db',
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Prossima"
          className="w-10 h-10 rounded-btn border border-neutral-200 flex items-center justify-center hover:border-neutral-400 transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  )
}
