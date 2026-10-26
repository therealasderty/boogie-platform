'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'boogie_cookie_consent'
const MAPS_HREF = 'https://maps.google.com/?q=Via+Europa+2+Colle+Brianza'

interface Props {
  src: string
  title?: string
  height?: string | number
  className?: string
}

export default function ConsentGatedMap({ src, title = 'Boogie Bistrot su Google Maps', height = 250, className }: Props) {
  const [consentito, setConsentito] = useState<boolean | null>(null)

  useEffect(() => {
    function leggi() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const prefs = JSON.parse(raw)
          setConsentito(prefs?.marketing === true)
        } else {
          setConsentito(false)
        }
      } catch {
        setConsentito(false)
      }
    }

    leggi()
    window.addEventListener('boogie_reset_cookie', leggi)
    return () => window.removeEventListener('boogie_reset_cookie', leggi)
  }, [])

  if (consentito === null) {
    return (
      <div
        className={className}
        style={{ height, background: 'var(--color-surface-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
    )
  }

  if (!consentito) {
    return (
      <div
        className={className}
        style={{
          height,
          background: 'var(--color-surface-cream)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '20px',
        }}
      >
        <p style={{ color: 'var(--color-text-warm)', fontSize: '0.875rem', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Per visualizzare la mappa accetta i cookie di marketing.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.dispatchEvent(new Event('boogie_reset_cookie'))}
            style={{
              background: 'var(--color-brand)',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 'var(--radius-btn)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#1a1a1a',
            }}
          >
            Gestisci cookie
          </button>
          <a
            href={MAPS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-text-warm)',
              fontSize: '0.875rem',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Apri su Google Maps
          </a>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      style={{ border: 0, display: 'block' }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={title}
    />
  )
}
