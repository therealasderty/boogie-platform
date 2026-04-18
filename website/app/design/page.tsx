/**
 * Pagina di test del design system — solo sviluppo locale.
 * Accessibile su /design
 */

import PopupPreview from './PopupPreview'

export const metadata = { title: 'Design System — Boogie Bistrot' }

const COLORS = [
  { name: '--color-brand',        value: '#eece9d', label: 'Brand' },
  { name: '--color-brand-hover',  value: '#f5deb3', label: 'Brand Hover' },
  { name: '--color-surface-dark', value: '#1a1a1a', label: 'Surface Dark' },
  { name: '--color-surface-warm', value: '#faf8f4', label: 'Surface Warm' },
  { name: '--color-navbar-bg',    value: '#000000', label: 'Navbar' },
  { name: '--color-foreground',   value: '#171717', label: 'Foreground' },
  { name: '--color-background',   value: '#ffffff', label: 'Background', border: true },
]

export default function DesignPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">

      {/* Header */}
      <div className="bg-surface-dark px-8 py-10">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white/40 mb-2">Design System</p>
        <h1 className="font-ivy text-5xl font-light text-white">Boogie Bistrot</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-14">

        {/* ── Tipografia ── */}
        <section>
          <SectionTitle>Tipografia</SectionTitle>
          <div className="bg-white rounded-card border border-neutral-200 p-8 flex flex-col gap-6">
            <div>
              <Label>h1 — IvyMode (solo titoli principali)</Label>
              <h1 className="font-ivy font-light text-5xl text-neutral-900 leading-tight">Boogie Bistrot</h1>
            </div>
            <hr className="border-neutral-100" />
            <div>
              <Label>h2 — Raleway 600, --text-section</Label>
              <h2 className="font-sans font-semibold text-neutral-900" style={{ fontSize: 'var(--text-section)' }}>Il nostro menù</h2>
            </div>
            <hr className="border-neutral-100" />
            <div>
              <Label>h3 — Raleway 600, --text-title</Label>
              <h3 className="font-sans font-semibold text-neutral-900" style={{ fontSize: 'var(--text-title)' }}>Serata Jazz Live</h3>
            </div>
            <hr className="border-neutral-100" />
            <div>
              <Label>Body — Raleway 300, --text-body</Label>
              <p className="font-sans font-light text-neutral-700 leading-relaxed">
                Cucina del territorio rivisitata con ingredienti locali, pizza tradizionale cotta nel forno a legna e birre artigianali del territorio.
              </p>
            </div>
            <hr className="border-neutral-100" />
            <div>
              <Label>Meta — Raleway 300, --text-meta</Label>
              <p className="font-sans font-light text-neutral-500" style={{ fontSize: 'var(--text-meta)' }}>
                Martedì – Domenica · 12:00 – 14:30 / 19:00 – 22:30
              </p>
            </div>
            <hr className="border-neutral-100" />
            <div>
              <Label>Label uppercase — --text-label, tracking-[0.12em]</Label>
              <span className="font-sans font-medium uppercase text-neutral-400" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                Via Roma 12, Colle Brianza
              </span>
            </div>
          </div>
        </section>

        {/* ── Colori ── */}
        <section>
          <SectionTitle>Colori</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLORS.map(c => (
              <div key={c.name} className="flex flex-col gap-2">
                <div
                  className="h-16 rounded-card"
                  style={{
                    backgroundColor: c.value,
                    border: c.border ? '1px solid #e5e5e5' : undefined,
                  }}
                />
                <div>
                  <p className="text-xs font-semibold text-neutral-800">{c.label}</p>
                  <p className="text-[0.65rem] text-neutral-400 font-mono">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pulsanti ── */}
        <section>
          <SectionTitle>Pulsanti</SectionTitle>
          <div className="bg-white rounded-card border border-neutral-200 p-8 flex flex-wrap gap-4 items-center">
            <button className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Prenota un tavolo
            </button>
            <button className="bg-surface-dark hover:bg-neutral-800 text-white font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Scopri il menù
            </button>
            <button className="border border-neutral-300 text-neutral-700 hover:border-neutral-400 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Ghost / Outline
            </button>
            <button className="text-neutral-400 hover:text-neutral-600 transition-colors font-light" style={{ fontSize: 'var(--text-meta)' }}>
              Non ora
            </button>
          </div>
        </section>

        {/* ── Badge / Pill ── */}
        <section>
          <SectionTitle>Badge &amp; Pill</SectionTitle>
          <div className="bg-white rounded-card border border-neutral-200 p-8 flex flex-wrap gap-3 items-center">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-brand text-black/80">
              Stasera
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-brand text-black/80">
              Ultimi posti
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-neutral-100 text-neutral-500">
              Prossimamente
            </span>
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-neutral-400">
              In evidenza
            </span>
          </div>
        </section>

        {/* ── Popup ── */}
        <section>
          <SectionTitle>Popup</SectionTitle>
          <p className="text-sm text-neutral-500 mb-4">Anteprima statica — il componente reale appare in basso a destra dopo il delay.</p>
          <div className="flex flex-wrap gap-6 items-start">
            <PopupPreview urgency="distante" />
            <PopupPreview urgency="imminente" />
            <PopupPreview urgency="lastMinute" />
          </div>
        </section>

      </div>
    </main>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans font-semibold text-neutral-800 mb-4" style={{ fontSize: 'var(--text-section)' }}>
      {children}
    </h2>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-neutral-400 mb-1.5">
      {children}
    </p>
  )
}
