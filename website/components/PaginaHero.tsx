'use client'

import Image from 'next/image'
import FadeIn from '@/components/FadeIn'
import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface PaginaHeroProps {
  titolo: string
  sottotitolo?: string
  tagline?: string
  badge?: string
  image: string
}

export default function PaginaHero({ titolo, sottotitolo, tagline, badge, image }: PaginaHeroProps) {
  const ref = useRef<HTMLElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  return (
    <section
      ref={ref}
      className="relative h-[50vh] min-h-[380px] flex items-end overflow-hidden bg-surface-dark"
      style={{
        transform: mounted ? 'translateY(0)' : 'translateY(-100%)',
        transition: mounted ? 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}
    >
      <motion.div className="absolute inset-0" style={{ y }}>
        <Image
          src={image}
          alt={titolo}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)' }}
      />
      <FadeIn className="relative z-10 w-full max-w-7xl mx-auto px-8 pt-24 pb-12 md:px-14 md:pb-16" delay={0.2}>
        {sottotitolo && (
          <span
            className="uppercase text-white/60 font-medium block mb-3"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            {sottotitolo}
          </span>
        )}
        <h1 className="font-ivy font-normal text-white text-4xl md:text-5xl leading-tight">
          {titolo}
        </h1>
        {badge && (
          <div className="mt-4">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-pill border border-brand/50 text-brand"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              {badge}
            </span>
          </div>
        )}
        {tagline && (
          <p className="text-white/60 font-light mt-3" style={{ fontSize: 'var(--text-lead)' }}>
            {tagline}
          </p>
        )}
      </FadeIn>
    </section>
  )
}
