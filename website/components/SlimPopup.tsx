'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

type Props = {
  titolo: string
  descrizioneBreve: string
  href: string
  ctaLabel: string
  onClose: () => void
  onCta: () => void
}

export default function SlimPopup({ titolo, descrizioneBreve, href, ctaLabel, onClose, onCta }: Props) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-0 left-0 w-full z-[100] flex items-center justify-between gap-6 px-8 py-3"
      style={{ backgroundColor: 'var(--color-brand)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <p className="font-semibold truncate" style={{ fontSize: 'var(--text-meta)', color: 'rgba(0,0,0,0.85)' }}>
          {titolo}
        </p>
        {descrizioneBreve && (
          <span
            className="hidden lg:block font-light truncate"
            style={{ fontSize: 'var(--text-meta)', color: 'rgba(0,0,0,0.55)' }}
          >
            {descrizioneBreve}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={href}
          onClick={onCta}
          className="font-semibold px-5 py-2 rounded-btn transition-colors whitespace-nowrap"
          style={{
            fontSize: 'var(--text-meta)',
            backgroundColor: 'rgba(0,0,0,0.82)',
            color: 'var(--color-brand)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(0,0,0,1)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(0,0,0,0.82)')}
        >
          {ctaLabel}
        </Link>
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="w-8 h-8 rounded-pill flex items-center justify-center transition-colors"
          style={{ color: 'rgba(0,0,0,0.5)' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.85)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.08)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
