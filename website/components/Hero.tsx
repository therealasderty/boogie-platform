'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type NewsItem = {
  label: string
  titolo: string
  descrizione: string
  href: string
  ctaLabel: string
  image: string
}


const HERO_FALLBACK = [
  { src: '/images/hero/sala-boogie-bistrot-colle-brianza.webp', alt: 'Sala del Boogie Bistrot, ristorante con giardino a Colle Brianza' },
  { src: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif', alt: 'Giardino esterno del Boogie Bistrot illuminato la sera a Colle Brianza' },
]

export default function Hero({ orariDisplay, heroImages: heroImagesProp, newsItems: newsItemsProp }: { orariDisplay?: { righe: string[]; avvisoSettimana: boolean }; heroImages?: { src: string; alt: string }[]; newsItems?: NewsItem[] }) {
  const rawImages = heroImagesProp?.length ? heroImagesProp : HERO_FALLBACK
  const newsItems = newsItemsProp ?? []
  // Clone first item at end for infinite loop effect
  const clonedNews = useMemo(() => newsItems.length > 1 ? [...newsItems, newsItems[0]] : newsItems, [newsItems])
  const [heroImages] = useState(rawImages)
  const [current, setCurrent] = useState(0)
  const [locked, setLocked] = useState(false)
  const [news, setNews] = useState(0)
  const [newsLocked, setNewsLocked] = useState(false)
  const [newsTransition, setNewsTransition] = useState(true)
  const heroTouchX = useRef(0)
  const newsTouchX = useRef(0)

  const goTo = useCallback(
    (index: number) => {
      if (locked) return
      setLocked(true)
      setCurrent(index)
      setTimeout(() => setLocked(false), 900)
    },
    [locked]
  )

  const next = useCallback(() => goTo((current + 1) % heroImages.length), [current, goTo, heroImages.length])
  const prev = useCallback(() => goTo((current - 1 + heroImages.length) % heroImages.length), [current, goTo, heroImages.length])

  const goToNews = useCallback(
    (index: number) => {
      if (newsLocked) return
      setNewsLocked(true)
      setNewsTransition(true)
      setNews(index)
      setTimeout(() => setNewsLocked(false), 620)
    },
    [newsLocked]
  )

  // When we land on the clone (index = newsItems.length), silently reset to 0
  useEffect(() => {
    if (news === newsItems.length && newsItems.length > 1) {
      const t = setTimeout(() => {
        setNewsTransition(false)
        setNews(0)
        requestAnimationFrame(() => requestAnimationFrame(() => setNewsTransition(true)))
      }, 620)
      return () => clearTimeout(t)
    }
  }, [news, newsItems.length])

  useEffect(() => {
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next])

  useEffect(() => {
    if (newsItems.length <= 1) return
    // Always advance by 1; clone handles the wrap-around
    const t = setInterval(() => goToNews(news + 1), 6000)
    return () => clearInterval(t)
  }, [news, goToNews, newsItems.length])

  function handleHeroTouchStart(e: React.TouchEvent) { heroTouchX.current = e.touches[0].clientX }
  function handleHeroTouchEnd(e: React.TouchEvent) {
    const diff = heroTouchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }
  function handleNewsTouchStart(e: React.TouchEvent) { newsTouchX.current = e.touches[0].clientX }
  function handleNewsTouchEnd(e: React.TouchEvent) {
    const diff = newsTouchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0
      ? goToNews(news + 1)
      : goToNews(news === 0 ? newsItems.length - 1 : news - 1)
  }

  return (
    <section className="relative flex h-screen flex-col md:flex-row overflow-hidden">

      {/* ── Carosello principale (75%) — cross dissolve ───────────── */}
      <div className="relative h-[80vh] md:h-full md:flex-[4]" onTouchStart={handleHeroTouchStart} onTouchEnd={handleHeroTouchEnd}>

        {/* Immagini in stack, fade in/out */}
        {heroImages.map((img, i) => (
          <div
            key={img.src}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out overflow-hidden"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <div
              style={{
                position: 'absolute', inset: '-10%',
                animation: `${i % 2 === 0 ? 'kenburns-1' : 'kenburns-2'} 8s ease-in-out infinite alternate`,
                animationDelay: `${i * -3}s`,
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                priority={i === 0}
                fetchPriority={i === 0 ? 'high' : 'low'}
                quality={i === 0 ? 70 : 65}
                sizes="(max-width: 767px) 100vw, (max-width: 1535px) 80vw, 1200px"
              />
            </div>
          </div>
        ))}

        {/* Overlay scuro */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

        {/* Contenuto sovrapposto */}
        <div className="absolute inset-0 flex flex-col px-8 pt-20 pb-8 md:px-14 md:pt-24 md:pb-12 text-white">

          {/* Logo + titolo + pulsanti — centrati verticalmente tra navbar e info */}
          <div className="flex-1 flex items-end pb-8">
            <div
              className="flex flex-col gap-5"
              style={{
                opacity: 1,
                transform: 'translateX(0)',
                transition: 'opacity 1.2s ease, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '0s',
              }}
            >
              <Image
                src="/logo-white.svg"
                alt="Boogie Bistrot"
                width={110}
                height={44}
                priority
              />
              <h1 className="max-w-xl font-ivy font-normal text-4xl md:text-6xl leading-none tracking-tight">
                Boogie Bistrot<br />
                Ristorante con giardino a Colle Brianza
              </h1>
              <div className="hidden md:flex flex-wrap gap-3 mt-1">
                <Link
                  href="/prenota"
                  className="bg-brand hover:bg-brand-hover text-black text-sm font-semibold px-6 py-3 rounded-btn transition-colors"
                  data-umami-event="prenota"
                  data-umami-event-source="hero"
                >
                  Prenota un tavolo
                </Link>
                <Link
                  href="/menu"
                  className="border border-white/70 text-white text-sm font-semibold px-6 py-3 rounded-btn hover:bg-white hover:text-black hover:border-white transition-colors"
                >
                  Scopri i menù
                </Link>
              </div>
            </div>
          </div>

          {/* Info + frecce */}
          <div
            className="flex flex-col gap-4"
            style={{
              opacity: 1,
              transform: 'translateY(0)',
              transition: 'opacity 1.2s ease, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '0.6s',
            }}
          >
            <div className="hidden md:flex flex-wrap gap-x-8 gap-y-3">

              <div className="flex items-center gap-2.5 text-white/80 font-light" style={{ fontSize: 'var(--text-lead)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-white/50">
                  <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                Via Europa, 2 — Colle Brianza (LC)
              </div>

              <div className="flex items-center gap-2.5 text-white/80 font-light" style={{ fontSize: 'var(--text-lead)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-white/50">
                  <path d="M2 3.6C2 2.72 2.72 2 3.6 2h1.4a.8.8 0 0 1 .76.54l.72 2.16a.8.8 0 0 1-.18.82L5.28 6.54a8.4 8.4 0 0 0 4.18 4.18l1.02-1.02a.8.8 0 0 1 .82-.18l2.16.72a.8.8 0 0 1 .54.76V12.4A1.6 1.6 0 0 1 12.4 14C6.43 14 2 9.57 2 3.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
                <span className="flex flex-col gap-0.5">
                  <span>+39 039 9260568</span>
                  <span>+39 346 5813309</span>
                </span>
              </div>

              <div className="flex items-start gap-2.5 text-white/80 font-light" style={{ fontSize: 'var(--text-lead)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-white/50 mt-0.5">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex flex-col gap-0.5">
                  {orariDisplay
                    ? orariDisplay.righe.map((r, i) => <span key={i}>{r}</span>)
                    : <span>Lun–Ven 12:00–15:00 · 19:00–23:00</span>
                  }
                  {orariDisplay?.avvisoSettimana && (
                    <Link href="/#calendario" className="text-brand text-xs mt-1 hover:underline underline-offset-2">⚠ Orari modificati questa settimana — controlla il calendario</Link>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ── Pannello news (25%) ──────────────────────────────────── */}
      <div className="relative flex-shrink-0 md:h-full md:flex-1 overflow-hidden bg-brand" onTouchStart={handleNewsTouchStart} onTouchEnd={handleNewsTouchEnd}>

        {/* Slide orizzontali */}
        <div
          className="flex h-full will-change-transform"
          style={{
            width: `${clonedNews.length * 100}%`,
            transform: `translateX(-${(news * 100) / clonedNews.length}%)`,
            transition: newsTransition ? 'transform 600ms ease-in-out' : 'none',
          }}
        >
          {clonedNews.map((item, idx) => (
            <div
              key={`${item.titolo}-${idx}`}
              className="relative h-full flex flex-col"
              style={{ width: `${100 / clonedNews.length}%` }}
            >
              {/* Mobile: foto full-height al livello slide */}
              <div className="absolute inset-0 md:hidden overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.titolo}
                  fill
                  className="object-cover object-center"
                  sizes="100vw"
                  quality={65}
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, var(--color-brand) 50%, transparent 100%)' }}
                />
              </div>

              {/* Desktop: foto in alto che sfuma verso il basso */}
              <div className="relative flex-1 min-h-0 hidden md:block">
                <Image
                  src={item.image}
                  alt={item.titolo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1535px) 30vw, 360px"
                  quality={65}
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, transparent 30%, var(--color-brand) 100%)' }}
                />
              </div>

              {/* Testo in basso su sfondo brand */}
              <div className="relative md:bg-brand px-6 pt-6 pb-20 flex flex-col gap-3 md:px-8 md:pt-8">
                <div className="relative z-10 flex flex-col gap-3 md:contents" style={{ maxWidth: 'clamp(0px, 55%, 100%)' }}>
                <span
                  className="md:relative md:z-10 uppercase text-black/60 font-medium text-xs whitespace-pre-line"
                  style={{ letterSpacing: 'var(--tracking-label)' }}
                >
                  {item.label}
                </span>
                <div className="md:relative md:z-10 w-8 h-px bg-black/30" />
                <h2 className="md:relative md:z-10 font-normal leading-tight text-black text-2xl">
                  {item.titolo}
                </h2>
                <p className="md:relative md:z-10 text-black/60 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                  {item.descrizione}
                </p>
                <Link
                  href={item.href}
                  className="md:relative md:z-10 inline-flex items-center gap-2 font-medium text-black/70 hover:text-black transition-colors mt-1"
                  style={{ fontSize: 'var(--text-meta)' }}
                >
                  {item.ctaLabel}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigazione news */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center gap-3">
          {newsItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goToNews(i)}
              aria-label={`News ${i + 1}`}
              className={`h-px transition-all duration-300 ${(news % newsItems.length) === i ? 'w-8 bg-black/60' : 'w-4 bg-black/25 hover:bg-black/40'}`}
            />
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => goToNews(news === 0 ? newsItems.length - 1 : news - 1)}
              aria-label="Precedente"
              className="w-8 h-8 rounded-btn border border-black/20 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7L9 3" stroke="black" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => goToNews(news + 1)}
              aria-label="Prossima"
              className="w-8 h-8 rounded-btn border border-black/20 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="black" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

      </div>

    </section>
  )
}
