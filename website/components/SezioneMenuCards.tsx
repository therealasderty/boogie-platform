'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import FadeIn from '@/components/FadeIn'

interface MediaRef {
  url: string
  soloMobile: boolean
}

interface MenuCardConfig {
  titolo: string
  descrizione: string
  images: MediaRef[]
  fallback: string
  href: string
  ctaLabel: string
  mezza?: boolean
}

interface MenuCard {
  titolo: string
  descrizione: string
  image: string
  href: string
  ctaLabel: string
  mezza?: boolean
}

function Card({ v, priority = false }: { v: MenuCard; priority?: boolean }) {
  return (
    <Link
      href={v.href}
      className="group relative flex items-end overflow-hidden rounded-card w-full aspect-square md:aspect-auto md:h-[400px]"
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
        <Image
          src={v.image}
          alt={v.titolo}
          fill
          className="object-cover"
          priority={priority}
          fetchPriority={priority ? 'high' : 'low'}
          quality={priority ? 68 : 65}
          sizes={
            v.mezza
              ? '(max-width: 767px) 100vw, (max-width: 1535px) 45vw, 560px'
              : '(max-width: 767px) 100vw, (max-width: 1535px) 80vw, 1200px'
          }
        />
      </div>
      <div
        className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)' }}
      />
      <div className="relative z-10 w-full px-8 py-10 md:px-12 flex flex-col gap-3">
        <h2
          className="font-semibold text-white leading-snug"
          style={{ fontSize: v.mezza ? 'var(--text-section)' : 'var(--text-title)' }}
        >
          {v.titolo}
        </h2>
        <p
          className="text-white/70 font-light leading-snug max-w-lg whitespace-pre-line"
          style={{ fontSize: 'var(--text-meta)' }}
        >
          {v.descrizione}
        </p>
        <div className="mt-2">
          <span
            className="inline-block border border-white/70 text-white font-semibold px-6 py-3 rounded-btn transition-colors duration-300 group-hover:bg-white group-hover:text-black group-hover:border-white"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            {v.ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function SezioneMenuCards({ voci: vociProp }: { voci: MenuCardConfig[] }) {
  const [voci, setVoci] = useState<MenuCard[]>(
    vociProp.map(v => ({
      titolo: v.titolo,
      descrizione: v.descrizione,
      image: v.images[0]?.url ?? v.fallback,
      href: v.href,
      ctaLabel: v.ctaLabel,
      mezza: v.mezza,
    }))
  )

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    setVoci(vociProp.map((v, idx) => {
      const disponibili = v.images.filter(m => !isDesktop || !m.soloMobile)
      const pool = disponibili.length > 0 ? disponibili : v.images
      // Prima card (LCP su home): stessa immagine del SSR → priority/fetchPriority restano efficaci
      const image =
        pool.length > 0
          ? idx === 0
            ? pool[0].url
            : pool[Math.floor(Math.random() * pool.length)].url
          : v.fallback
      return { titolo: v.titolo, descrizione: v.descrizione, image, href: v.href, ctaLabel: v.ctaLabel, mezza: v.mezza }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const intere = voci.filter(v => !v.mezza)
  const mezze  = voci.filter(v => v.mezza)

  return (
    <section className="py-16 md:py-20 bg-surface-warm">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-14 flex flex-col gap-4">
        {intere.map((v, i) => (
          <FadeIn key={v.titolo} delay={i * 0.1}>
            <Card v={v} priority={i === 0} />
          </FadeIn>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mezze.map((v, i) => (
            <FadeIn key={v.titolo} delay={i * 0.1}>
              <Card v={v} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
