'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const MAPS_HREF = 'https://maps.google.com/?q=Via+Europa+2+Colle+Brianza'
const PHONE = '+39 039 9260568'

export default function LinksPrenotaSticky() {
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    const el = document.getElementById('prenota-btn')
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisibile(!entry.isIntersecting),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        transform: visibile ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: visibile ? 'auto' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', height: 64 }}>

        {/* Contattaci */}
        <a
          href={`tel:${PHONE.replace(/\s/g, '')}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 4.5C2.5 3.4 3.4 2.5 4.5 2.5h1.75a1 1 0 0 1 .95.68l.9 2.7a1 1 0 0 1-.23 1.02L6.6 8.18a10.5 10.5 0 0 0 5.22 5.22l1.28-1.27a1 1 0 0 1 1.02-.23l2.7.9a1 1 0 0 1 .68.95V15.5A2 2 0 0 1 15.5 17.5C8.32 17.5 2.5 11.68 2.5 4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 10, letterSpacing: '0.04em' }}>Contattaci</span>
        </a>

        {/* Divisore */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

        {/* Dove trovarci */}
        <a
          href={MAPS_HREF}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6Z" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span style={{ fontSize: 10, letterSpacing: '0.04em' }}>Dove trovarci</span>
        </a>

        {/* Divisore */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

        {/* Prenota */}
        <Link
          href="/prenota"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'var(--color-brand)', color: '#1a1a1a', textDecoration: 'none' }}
          data-umami-event="prenota"
          data-umami-event-source="links-sticky"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 10, letterSpacing: '0.04em' }}>Prenota</span>
        </Link>

      </div>
    </div>
  )
}
