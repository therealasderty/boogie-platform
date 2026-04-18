'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface BreadcrumbItem { label: string; href?: string }

interface SezioneIntroProps {
  immagini?: { src: string; alt: string }[]
  label?: string
  titolo: string
  testo: string
  inverti?: boolean
  cta?: { label: string; href: string }
  fotoContenuta?: boolean
  breadcrumb?: BreadcrumbItem[]
  fullWidth?: boolean
}

export default function SezioneIntro({ immagini = [], label, titolo, testo, inverti = false, cta, fotoContenuta = false, breadcrumb, fullWidth = false }: SezioneIntroProps) {
  const [imgs, setImgs] = useState(immagini)
  const [current, setCurrent] = useState(0)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (immagini.length > 1) setImgs([...immagini].sort(() => Math.random() - 0.5))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (locked) return
      setLocked(true)
      setCurrent(index)
      setTimeout(() => setLocked(false), 900)
    },
    [locked]
  )

  const next = useCallback(() => goTo((current + 1) % Math.max(imgs.length, 1)), [current, goTo, imgs.length])

  useEffect(() => {
    if (imgs.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, imgs.length])

  const foto = (
    <div className={`relative w-full h-72 md:flex-1 min-h-[400px] ${fotoContenuta ? 'md:flex md:items-center md:p-10' : ''}`}>
      <div className={`relative w-full h-full ${fotoContenuta ? 'md:rounded-card md:overflow-hidden' : ''}`}>
      {imgs.map((img, i) => (
        <div
          key={img.src}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="50vw"
          />
        </div>
      ))}

      {/* Frecce + Dots — solo se più di una foto */}
      {imgs.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + imgs.length) % imgs.length)}
            aria-label="Precedente"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => goTo((current + 1) % imgs.length)}
            aria-label="Prossima"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Foto ${i + 1}`}
                className={`rounded-pill transition-all duration-300 ${
                  i === current ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  )

  const testi = (
    <div className="flex flex-col justify-center px-8 py-12 md:px-16 md:py-20">
      {breadcrumb && (
        <nav className="flex items-center gap-2 mb-8 text-neutral-400 font-light flex-wrap" style={{ fontSize: 'var(--text-label)' }}>
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {item.href
                ? <Link href={item.href} className="hover:text-neutral-600 transition-colors">{item.label}</Link>
                : <span className="text-neutral-600">{item.label}</span>
              }
            </span>
          ))}
        </nav>
      )}
      {label && (
        <span
          className="uppercase text-black/40 font-medium mb-4"
          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
        >
          {label}
        </span>
      )}
      <h2 style={{ fontSize: 'var(--text-section)' }} className="font-semibold text-neutral-900 leading-snug">
        {titolo}
      </h2>
      <div className="w-10 h-px bg-neutral-300 my-5" />
      <div
        className="text-neutral-500 font-light leading-relaxed [&_strong]:font-semibold [&_strong]:text-neutral-800"
        style={{ fontSize: 'var(--text-body)' }}
        dangerouslySetInnerHTML={{ __html: testo }}
      />
      {cta && (
        <Link
          href={cta.href}
          className="mt-8 self-start border border-black text-black hover:bg-black hover:text-white font-semibold px-6 py-3 rounded-btn transition-colors"
          style={{ fontSize: 'var(--text-meta)' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )

  const fadeLeft = { initial: { opacity: 0, x: -32 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.7, ease: 'easeOut' } }
  const fadeRight = { initial: { opacity: 0, x: 32 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.7, ease: 'easeOut', delay: 0.1 } }

  const hasFoto = imgs.length > 0

  return (
    <section className="flex justify-center bg-neutral-100">
      <div className={`flex flex-col md:flex-row w-full ${fullWidth ? '' : 'max-w-7xl'}`} style={{ minHeight: 'clamp(480px, 55vw, 700px)' }}>
        {hasFoto ? (
          inverti ? (
            <>
              <motion.div className="md:flex-1 md:flex md:flex-col" {...fadeLeft}>{testi}</motion.div>
              <motion.div className="md:flex-1 md:flex md:flex-col" {...fadeRight}>{foto}</motion.div>
            </>
          ) : (
            <>
              <motion.div className="md:flex-1 md:flex md:flex-col" {...fadeLeft}>{foto}</motion.div>
              <motion.div className="md:flex-1 md:flex md:flex-col" {...fadeRight}>{testi}</motion.div>
            </>
          )
        ) : (
          <motion.div className="w-full" {...fadeLeft}>{testi}</motion.div>
        )}
      </div>
    </section>
  )
}
