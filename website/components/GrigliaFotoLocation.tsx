'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { MediaItem } from '@/lib/media'

export default function GrigliaFotoLocation({ foto }: { foto: MediaItem[] }) {
  const [pagina, setPagina] = useState(0)

  const perPagina = 4
  const totPagine = Math.ceil(foto.length / perPagina)
  const visibili = foto.slice(pagina * perPagina, pagina * perPagina + perPagina)

  if (foto.length === 0) return null

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {visibili.map((f) => (
          <div key={f.id} className="relative aspect-[3/2] rounded-card overflow-hidden">
            <Image
              src={f.url}
              alt={f.alt || 'Boogie Bistrot — location'}
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>

      {totPagine > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPagina(p => p - 1)}
            disabled={pagina === 0}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
            style={{ fontSize: 'var(--text-meta)' }}
            aria-label="Foto precedenti"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 13.5L6.5 9 11 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Precedenti
          </button>

          <span className="text-neutral-300 font-light" style={{ fontSize: 'var(--text-meta)' }}>
            {pagina + 1} / {totPagine}
          </span>

          <button
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina === totPagine - 1}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
            style={{ fontSize: 'var(--text-meta)' }}
            aria-label="Altre foto"
          >
            Altre foto
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4.5L11.5 9 7 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
