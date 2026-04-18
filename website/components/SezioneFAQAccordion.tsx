'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/faq'

function Item({ domanda, risposta, aperto, onClick }: {
  domanda: string
  risposta: string
  aperto: boolean
  onClick: () => void
}) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span
          className="font-medium text-white/80 group-hover:text-white transition-colors"
          style={{ fontSize: 'var(--text-body)' }}
        >
          {domanda}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-pill border border-white/20 flex items-center justify-center text-white/50 group-hover:border-white/40 transition-colors duration-300"
          style={{ transform: aperto ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        style={{
          maxHeight: aperto ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="faq-risposta text-white/40 font-light leading-relaxed pb-6"
          style={{ fontSize: 'var(--text-meta)' }}
          dangerouslySetInnerHTML={{ __html: risposta }}
        />
      </div>
    </div>
  )
}

export default function SezioneFAQAccordion({ faq }: { faq: FaqItem[] }) {
  const [aperto, setAperto] = useState<number | null>(null)

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {faq.map((item, i) => (
        <Item
          key={item.id}
          domanda={item.domanda}
          risposta={item.risposta}
          aperto={aperto === i}
          onClick={() => setAperto(aperto === i ? null : i)}
        />
      ))}
    </div>
  )
}
