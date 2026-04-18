'use client'

type Urgency = 'distante' | 'imminente' | 'lastMinute'

const BADGE: Record<Urgency, string | null> = {
  distante:   null,
  imminente:  'Prossimamente',
  lastMinute: 'Stasera',
}

const LABEL: Record<Urgency, string> = {
  distante:   'Nessun badge',
  imminente:  'Imminente (3–7 gg)',
  lastMinute: 'Last minute (<3 gg)',
}

export default function PopupPreview({ urgency }: { urgency: Urgency }) {
  const badge        = BADGE[urgency]
  const isLastMinute = urgency === 'lastMinute'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400">
        {LABEL[urgency]}
      </span>
      <div className="w-[380px] rounded-card overflow-hidden shadow-xl">
        {/* Foto mock */}
        <div className="relative h-44 bg-neutral-300">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
        </div>

        {/* Contenuto */}
        <div className="bg-white px-8 py-7 flex flex-col gap-3">
          {badge ? (
            <span className={`self-start text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill ${isLastMinute ? 'bg-brand text-black/80' : 'bg-neutral-100 text-neutral-500'}`}>
              {badge}
            </span>
          ) : (
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400">
              In evidenza
            </span>
          )}

          <h2 className="font-sans font-semibold text-neutral-900 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
            Serata Jazz Live
          </h2>

          <p className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Una serata speciale con musica dal vivo nel nostro giardino. Posti limitati.
          </p>

          <div className="flex items-center gap-3 mt-1">
            <span className="bg-brand text-black/80 font-semibold px-6 py-3 rounded-btn cursor-pointer" style={{ fontSize: 'var(--text-meta)' }}>
              Scopri di più
            </span>
            <span className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>Non ora</span>
          </div>
        </div>
      </div>
    </div>
  )
}
