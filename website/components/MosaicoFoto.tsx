'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface Foto {
  src: string
  alt: string
}

const ASPECT_PATTERN = [
  'aspect-[3/4]',
  'aspect-square',
  'aspect-[2/3]',
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[3/4]',
]

const FOTO_FALLBACK: Foto[] = [
  { src: '/images/hero/1.webp', alt: 'Il giardino' },
  { src: '/images/hero/2.avif', alt: 'La sala interna' },
  { src: '/images/hero/1.webp', alt: 'I piatti' },
  { src: '/images/hero/2.avif', alt: 'La pizza' },
  { src: '/images/hero/1.webp', alt: 'Il forno a legna' },
  { src: '/images/hero/2.avif', alt: 'Aperitivo in giardino' },
  { src: '/images/hero/1.webp', alt: 'I cocktail' },
  { src: '/images/hero/2.avif', alt: 'Il risotto' },
]

export default function MosaicoFoto({ immagini }: { immagini?: { src: string; alt: string }[] }) {
  const [foto, setFoto] = useState<Foto[]>(immagini?.length ? immagini : FOTO_FALLBACK)

  useEffect(() => {
    if (!immagini?.length) return
    setFoto([...immagini].sort(() => Math.random() - 0.5))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [aperta, setAperta] = useState<number | null>(null)

  const chiudi = useCallback(() => setAperta(null), [])
  const prev = useCallback(() => setAperta((i) => i !== null ? (i - 1 + foto.length) % foto.length : null), [foto.length])
  const next = useCallback(() => setAperta((i) => i !== null ? (i + 1) % foto.length : null), [foto.length])

  useEffect(() => {
    if (aperta === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') chiudi()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aperta, chiudi, prev, next])

  return (
    <>
      {/* Mosaico */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-14">
          <motion.div
            className="columns-2 md:columns-3 lg:columns-4 gap-2"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {foto.map((f, i) => (
              <button
                key={i}
                onClick={() => setAperta(i)}
                className={`group relative overflow-hidden rounded-card w-full mb-2 ${ASPECT_PATTERN[i % ASPECT_PATTERN.length]}`}
              >
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  quality={i < 4 ? 68 : 62}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {aperta !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={chiudi}
        >
          {/* Immagine */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-6"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={foto[aperta].src}
              alt={foto[aperta].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Caption */}
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white/60 font-light" style={{ fontSize: 'var(--text-meta)' }}>
              {foto[aperta].alt} · {aperta + 1} / {foto.length}
            </p>
          </div>

          {/* Chiudi */}
          <button
            onClick={chiudi}
            className="absolute top-5 right-5 w-10 h-10 rounded-pill flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label="Chiudi"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {/* Frecce */}
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-pill flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label="Precedente"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-pill flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label="Prossima"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
