'use client'

export default function SlimPopupPreview() {
  return (
    <div
      className="w-full flex items-center justify-between gap-6 px-8 py-3 rounded-btn"
      style={{ backgroundColor: 'var(--color-brand)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <p className="font-semibold truncate" style={{ fontSize: 'var(--text-meta)', color: 'rgba(0,0,0,0.85)' }}>
          Serata Jazz Live — Sabato 21 Giugno
        </p>
        <span
          className="hidden lg:block font-light truncate"
          style={{ fontSize: 'var(--text-meta)', color: 'rgba(0,0,0,0.55)' }}
        >
          Una serata speciale con musica dal vivo nel nostro giardino.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className="font-semibold px-5 py-2 rounded-btn whitespace-nowrap cursor-pointer"
          style={{
            fontSize: 'var(--text-meta)',
            backgroundColor: 'rgba(0,0,0,0.82)',
            color: 'var(--color-brand)',
          }}
        >
          Scopri di più
        </span>
        <button
          aria-label="Chiudi"
          className="w-8 h-8 rounded-pill flex items-center justify-center"
          style={{ color: 'rgba(0,0,0,0.5)' }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
