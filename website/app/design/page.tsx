/**
 * Design System showcase — solo sviluppo locale.
 * Accessibile su /design
 */

import PopupPreview from './PopupPreview'
import SlimPopupPreview from './SlimPopupPreview'

export const metadata = {
  title: 'Design System — Boogie Bistrot',
  robots: { index: false, follow: false },
}

/* ── Sezione wrapper ─────────────────────────────────────────────────────── */
function Section({ title, children, dark }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <section>
      <h2
        className={`font-sans font-semibold mb-5 pb-2 border-b ${dark ? 'text-white border-white/10' : 'text-neutral-800 border-neutral-200'}`}
        style={{ fontSize: 'var(--text-section)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Label({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-[0.65rem] font-medium uppercase tracking-[0.1em] mb-2 ${dark ? 'text-white/35' : 'text-neutral-400'}`}>
      {children}
    </p>
  )
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-card border border-neutral-200 p-8 ${className}`}>
      {children}
    </div>
  )
}

function DarkPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-card p-8 ${className}`} style={{ background: '#1a1a1a' }}>
      {children}
    </div>
  )
}

function Divider({ dark }: { dark?: boolean }) {
  return <hr className={`my-5 ${dark ? 'border-white/10' : 'border-neutral-100'}`} />
}

/* ── Dati ──────────────────────────────────────────────────────────────────── */

const TOKEN_COLORS = [
  { token: '--color-brand',        hex: '#eece9d', label: 'Brand',        use: 'CTA principali' },
  { token: '--color-brand-hover',  hex: '#f5deb3', label: 'Brand Hover',  use: 'Hover CTA' },
  { token: '--color-surface-dark', hex: '#1a1a1a', label: 'Surface Dark', use: 'Footer, sezioni dark' },
  { token: '--color-surface-warm', hex: '#faf8f4', label: 'Surface Warm', use: 'Blog, menu, recensioni' },
  { token: '--color-navbar-bg',    hex: '#000000', label: 'Navbar BG',    use: 'Navbar scrollata /55' },
  { token: '--color-foreground',   hex: '#171717', label: 'Foreground',   use: 'Testo primario' },
  { token: '--color-background',   hex: '#ffffff', label: 'Background',   use: 'Sfondo pagina', border: true },
]

const TEXT_ON_DARK = [
  { token: '--color-text-muted', value: 'oklch(100% 0 0 / 75%)', label: 'Text Muted', opacity: '75%' },
  { token: '--color-text-faint', value: 'oklch(100% 0 0 / 45%)', label: 'Text Faint', opacity: '45%' },
]

const WHITE_OPACITIES = [
  { cls: 'white/5',  alpha: 0.05,  label: '/5' },
  { cls: 'white/10', alpha: 0.10,  label: '/10' },
  { cls: 'white/15', alpha: 0.15,  label: '/15' },
  { cls: 'white/25', alpha: 0.25,  label: '/25' },
  { cls: 'white/45', alpha: 0.45,  label: '/45' },
  { cls: 'white/70', alpha: 0.70,  label: '/70' },
  { cls: 'white/90', alpha: 0.90,  label: '/90' },
]

const NEUTRAL_SHADES = [
  { shade: '50',  hex: '#fafafa' },
  { shade: '100', hex: '#f5f5f5' },
  { shade: '200', hex: '#e5e5e5' },
  { shade: '300', hex: '#d4d4d4' },
  { shade: '400', hex: '#a3a3a3' },
  { shade: '500', hex: '#737373' },
  { shade: '600', hex: '#525252' },
  { shade: '700', hex: '#404040' },
  { shade: '800', hex: '#262626' },
  { shade: '900', hex: '#171717' },
]

const RADIUS_TOKENS = [
  { token: '--radius-btn',  value: '8px',   label: 'btn',  use: 'Pulsanti, input, dropdown' },
  { token: '--radius-card', value: '12px',  label: 'card', use: 'Card, pannelli, modal' },
  { token: '--radius-pill', value: '999px', label: 'pill', use: 'Badge, dot, pill button' },
]

const TYPE_SCALE = [
  { token: '--text-label',   value: '0.7rem',   label: 'Label',   use: 'Indirizzi, meta uppercase' },
  { token: '--text-meta',    value: '0.875rem', label: 'Meta',    use: 'Info secondarie, body small' },
  { token: '--text-body',    value: '1rem',     label: 'Body',    use: 'Corpo testo standard' },
  { token: '--text-lead',    value: '1.125rem', label: 'Lead',    use: 'Intro, testo evidenziato' },
  { token: '--text-section', value: '1.75rem',  label: 'Section', use: 'Titoli sezione (h2)' },
  { token: '--text-title',   value: '2rem',     label: 'Title',   use: 'Titoli card grandi' },
]

/* ──────────────────────────────────────────────────────────────────────────── */

export default function DesignPage() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-24">

      {/* ── Header ── */}
      <div style={{ background: '#1a1a1a' }} className="px-8 py-12">
        <p className="font-sans font-medium uppercase text-white/35 mb-3"
           style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
          Design System
        </p>
        <h1 className="font-ivy font-light text-white leading-none mb-2" style={{ fontSize: '3.5rem' }}>
          Boogie Bistrot
        </h1>
        <p className="font-sans font-light text-white/50" style={{ fontSize: 'var(--text-meta)' }}>
          Tutti i token, font, componenti e pattern usati nel sito — per revisione e discussione.
        </p>
        <div className="flex gap-3 mt-5">
          <a href="/design" className="text-[0.7rem] font-medium uppercase tracking-[0.1em] px-3 py-1.5 rounded-pill bg-white/10 text-white/60 hover:bg-white/15 transition-colors">
            Design System
          </a>
          <a href="/design/email" className="text-[0.7rem] font-medium uppercase tracking-[0.1em] px-3 py-1.5 rounded-pill bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors">
            Email Transazionali →
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-16">

        {/* ── 1. COLORI TOKEN ─────────────────────────────────────────────── */}
        <Section title="1. Colori — Design Tokens">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {TOKEN_COLORS.map(c => (
              <div key={c.token} className="flex flex-col gap-2">
                <div
                  className="h-20 rounded-card shadow-sm"
                  style={{
                    backgroundColor: c.hex,
                    border: c.border ? '1px solid #e5e5e5' : 'none',
                  }}
                />
                <div>
                  <p className="text-xs font-semibold text-neutral-800">{c.label}</p>
                  <p className="text-[0.65rem] font-mono text-neutral-500">{c.hex}</p>
                  <p className="text-[0.6rem] text-neutral-400 font-mono">{c.token}</p>
                  <p className="text-[0.6rem] text-neutral-400 mt-0.5">{c.use}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testo su dark */}
          <Label>Testi su sfondo scuro (--color-text-muted / --color-text-faint)</Label>
          <DarkPanel className="flex flex-col gap-3 mb-6">
            {TEXT_ON_DARK.map(t => (
              <div key={t.token} className="flex items-baseline gap-4">
                <span className="text-[0.65rem] font-mono w-32 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {t.label} ({t.opacity})
                </span>
                <span className="font-sans font-light text-lg" style={{ color: t.value }}>
                  Testo di esempio
                </span>
              </div>
            ))}
          </DarkPanel>

          {/* Bianco con opacità */}
          <Label>Bianco con opacità — pattern su sfondo scuro</Label>
          <DarkPanel className="mb-6">
            <div className="flex flex-wrap gap-3">
              {WHITE_OPACITIES.map(w => (
                <div key={w.label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-14 h-14 rounded-btn border border-white/10"
                    style={{ backgroundColor: `rgba(255,255,255,${w.alpha})` }}
                  />
                  <span className="text-[0.6rem] font-mono text-white/40">{w.label}</span>
                </div>
              ))}
            </div>
          </DarkPanel>

          {/* Neutral scale */}
          <Label>Neutral scale (Tailwind) — usata per testi, bordi, sfondi neutri</Label>
          <div className="flex gap-1.5">
            {NEUTRAL_SHADES.map(n => (
              <div key={n.shade} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full h-10 rounded" style={{ backgroundColor: n.hex, border: n.shade === '50' ? '1px solid #e5e5e5' : 'none' }} />
                <span className="text-[0.55rem] font-mono text-neutral-500">{n.shade}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 2. TIPOGRAFIA ───────────────────────────────────────────────── */}
        <Section title="2. Tipografia">

          <Label>Scale tipografica — token CSS</Label>
          <Panel className="mb-6">
            <div className="flex flex-col gap-4">
              {TYPE_SCALE.map((t, i) => (
                <div key={t.token}>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="font-sans font-light text-neutral-900" style={{ fontSize: t.value }}>
                      {t.label}
                    </p>
                    <div className="text-right">
                      <span className="text-[0.6rem] font-mono text-neutral-400">{t.token} = {t.value}</span>
                      <p className="text-[0.6rem] text-neutral-400">{t.use}</p>
                    </div>
                  </div>
                  {i < TYPE_SCALE.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Panel>

          {/* IvyMode specimens */}
          <Label>IvyMode — font display (self-hosted, solo h1/titoli hero)</Label>
          <Panel className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.6rem] font-mono text-neutral-400 mb-1">font-weight: 300 (light)</p>
                <p className="font-ivy leading-none text-neutral-900" style={{ fontWeight: 300, fontSize: '3.5rem' }}>
                  Boogie Bistrot
                </p>
              </div>
              <Divider />
              <div>
                <p className="text-[0.6rem] font-mono text-neutral-400 mb-1">font-weight: 400 (regular)</p>
                <p className="font-ivy leading-none text-neutral-900" style={{ fontWeight: 400, fontSize: '3.5rem' }}>
                  Boogie Bistrot
                </p>
              </div>
              <Divider />
              <div>
                <p className="text-[0.6rem] font-mono text-neutral-400 mb-1">Su sfondo dark (uso reale)</p>
                <div className="rounded-btn px-6 py-4" style={{ background: '#1a1a1a' }}>
                  <p className="font-ivy font-light text-white leading-tight" style={{ fontSize: '3rem' }}>
                    Una serata speciale
                  </p>
                  <p className="font-ivy font-light leading-tight" style={{ fontSize: '3rem', color: '#eece9d' }}>
                    al Boogie Bistrot
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Raleway weights */}
          <Label>Raleway — font UI (Google Fonts, peso 300–700)</Label>
          <Panel className="mb-6">
            <div className="flex flex-col gap-3">
              {[
                { w: 300, label: 'Light 300 — paragrafi, body, descrizioni' },
                { w: 400, label: 'Regular 400 — testo standard' },
                { w: 500, label: 'Medium 500 — label, meta, accenti' },
                { w: 600, label: 'Semibold 600 — h2, h3, pulsanti principali' },
                { w: 700, label: 'Bold 700 — strong, h2 CSS globale' },
              ].map((r, i) => (
                <div key={r.w}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-sans text-neutral-900 text-xl" style={{ fontWeight: r.w }}>
                      Cucina del territorio rivisitata
                    </p>
                    <span className="text-[0.6rem] font-mono text-neutral-400 shrink-0 ml-4">{r.label}</span>
                  </div>
                  {i < 4 && <Divider />}
                </div>
              ))}
            </div>
          </Panel>

          {/* Heading hierarchy */}
          <Label>Gerarchia heading — come appaiono in contesto</Label>
          <Panel>
            <div className="flex flex-col gap-5">
              <div>
                <Label>h1 — IvyMode light, 4xl–6xl, leading-none (Hero)</Label>
                <h1 className="font-ivy font-light text-neutral-900 leading-none" style={{ fontSize: '3.5rem' }}>
                  Buonasera
                </h1>
              </div>
              <Divider />
              <div>
                <Label>h2 — Raleway 700 (CSS globale), --text-section = 1.75rem</Label>
                <h2 className="font-sans text-neutral-900" style={{ fontWeight: 700, fontSize: 'var(--text-section)', lineHeight: 1.15 }}>
                  Il nostro menù
                </h2>
              </div>
              <Divider />
              <div>
                <Label>h3 — Raleway 600, --text-title = 2rem</Label>
                <h3 className="font-sans font-semibold text-neutral-900 leading-tight" style={{ fontSize: 'var(--text-title)' }}>
                  Serata Jazz Live
                </h3>
              </div>
              <Divider />
              <div>
                <Label>Body — Raleway 300, 1rem, leading-relaxed</Label>
                <p className="font-sans font-light text-neutral-700 leading-relaxed">
                  Cucina del territorio rivisitata con ingredienti locali, pizza tradizionale cotta nel forno a legna e birre artigianali del territorio. Un luogo dove il gusto incontra l'atmosfera.
                </p>
              </div>
              <Divider />
              <div>
                <Label>Label uppercase — font-medium, --text-label, tracking 0.12em</Label>
                <span
                  className="font-sans font-medium uppercase text-neutral-400"
                  style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                >
                  Via Europa 2, Colle Brianza · LC
                </span>
              </div>
            </div>
          </Panel>
        </Section>

        {/* ── 3. BORDER RADIUS ────────────────────────────────────────────── */}
        <Section title="3. Border Radius">
          <div className="grid grid-cols-3 gap-4">
            {RADIUS_TOKENS.map(r => (
              <Panel key={r.token} className="flex flex-col items-center gap-4">
                <div
                  className="w-20 h-20 bg-brand"
                  style={{ borderRadius: r.value }}
                />
                <div className="text-center">
                  <p className="font-sans font-semibold text-neutral-800 text-sm">rounded-{r.label}</p>
                  <p className="text-[0.65rem] font-mono text-neutral-500">{r.value}</p>
                  <p className="text-[0.6rem] font-mono text-neutral-400">{r.token}</p>
                  <p className="text-[0.6rem] text-neutral-400 mt-0.5">{r.use}</p>
                </div>
              </Panel>
            ))}
          </div>
        </Section>

        {/* ── 4. PULSANTI ─────────────────────────────────────────────────── */}
        <Section title="4. Pulsanti">

          <Label>Su sfondo chiaro</Label>
          <Panel className="mb-4">
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <button className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
                Prenota un tavolo
              </button>
              <button className="bg-surface-dark hover:bg-neutral-800 text-white font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
                Scopri il menù
              </button>
              <button className="border border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:text-neutral-900 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
                Outline
              </button>
              <button className="text-neutral-400 hover:text-neutral-600 transition-colors font-light" style={{ fontSize: 'var(--text-meta)' }}>
                Non ora
              </button>
              {/* Icon button */}
              <button className="w-10 h-10 rounded-btn border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <Divider />
            {/* Link con freccia */}
            <div className="mt-4">
              <Label>Link con freccia (article-link)</Label>
              <a className="article-link">
                Leggi l'articolo completo
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </Panel>

          <Label>Su sfondo scuro</Label>
          <DarkPanel className="flex flex-wrap gap-4 items-center">
            <button className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Prenota un tavolo
            </button>
            <button className="border border-white/70 text-white font-semibold px-6 py-3 rounded-btn hover:bg-white hover:text-black transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Outline su dark
            </button>
            <button className="border border-white/20 text-white/60 font-semibold px-6 py-3 rounded-btn hover:border-white/40 hover:text-white transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
              Outline muted
            </button>
            <button className="text-white/40 hover:text-white/70 transition-colors font-light" style={{ fontSize: 'var(--text-meta)' }}>
              Non ora
            </button>
            {/* Icon button su dark */}
            <button className="w-10 h-10 rounded-btn border border-white/15 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </DarkPanel>
        </Section>

        {/* ── 5. FORM ─────────────────────────────────────────────────────── */}
        <Section title="5. Form — Input & Select">

          <Label>Tema chiaro (lib/form-classes.ts)</Label>
          <Panel className="mb-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label">Nome e Cognome</label>
                <input
                  type="text"
                  placeholder="Mario Rossi"
                  readOnly
                  className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"
                  style={{ fontSize: 'var(--text-meta)' }}
                />
              </div>
              <div>
                <label className="form-label">Numero ospiti</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer font-light" style={{ fontSize: 'var(--text-meta)' }}>
                    <option>2 persone</option>
                    <option>4 persone</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Note</label>
                <textarea
                  rows={3}
                  placeholder="Allergie, richieste particolari..."
                  readOnly
                  className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light resize-none"
                  style={{ fontSize: 'var(--text-meta)' }}
                />
              </div>
            </div>
          </Panel>

          <Label>Tema scuro (inputClassDark)</Label>
          <DarkPanel>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-medium mb-1.5 text-white/50" style={{ fontSize: 'var(--text-meta)' }}>Email</label>
                <input
                  type="email"
                  placeholder="mario@esempio.it"
                  readOnly
                  className="w-full bg-white/5 border border-white/15 rounded-btn px-4 py-2.5 text-white placeholder-white/25 outline-none focus:border-brand/50 transition-colors font-light"
                  style={{ fontSize: 'var(--text-meta)' }}
                />
              </div>
              <div>
                <label className="block font-medium mb-1.5 text-white/50" style={{ fontSize: 'var(--text-meta)' }}>Tipo evento</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-white/5 border border-white/15 rounded-btn px-4 py-2.5 text-white outline-none focus:border-brand/50 transition-colors cursor-pointer font-light" style={{ fontSize: 'var(--text-meta)' }}>
                    <option value="" style={{ background: '#1a1a1a' }}>Seleziona...</option>
                    <option style={{ background: '#1a1a1a' }}>Cena di lavoro</option>
                  </select>
                </div>
              </div>
            </div>
          </DarkPanel>
        </Section>

        {/* ── 6. BADGE & PILL ─────────────────────────────────────────────── */}
        <Section title="6. Badge & Pill">

          <Label>Su sfondo chiaro</Label>
          <Panel className="mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* card-badge reale */}
              <span className="card-badge relative" style={{ position: 'relative', top: 'auto', left: 'auto' }}>
                Stasera
              </span>
              <span className="card-badge relative" style={{ position: 'relative', top: 'auto', left: 'auto' }}>
                Ultimi posti
              </span>
              {/* pill con bordo brand */}
              <span className="inline-flex items-center px-4 py-1.5 rounded-pill border font-medium" style={{ borderColor: 'rgba(238,206,157,0.5)', color: '#eece9d', fontSize: 'var(--text-meta)' }}>
                Evento speciale
              </span>
              {/* pill neutro */}
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-neutral-100 text-neutral-500">
                Prossimamente
              </span>
              {/* label semplice */}
              <span className="font-medium uppercase text-neutral-400" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                In evidenza
              </span>
            </div>
          </Panel>

          <Label>Su sfondo scuro</Label>
          <DarkPanel>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-brand text-black/80">
                Stasera
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill bg-white/10 text-white/60">
                Ricorrente
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded-pill border border-white/20 text-white/50">
                Prossimamente
              </span>
              <span className="font-medium uppercase text-white/35" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                In evidenza
              </span>
            </div>
          </DarkPanel>
        </Section>

        {/* ── 7. CARD ─────────────────────────────────────────────────────── */}
        <Section title="7. Card">

          <Label>Card blog / evento (pattern reale)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Card su sfondo chiaro */}
            <div className="group relative overflow-hidden rounded-card border border-neutral-200 bg-white flex flex-col">
              <div className="card-img bg-neutral-200">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="card-badge">Venerdì</span>
              </div>
              <div className="card-body">
                <p className="font-sans font-medium uppercase text-neutral-400" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Evento · 20 Giugno
                </p>
                <h3 className="font-sans font-semibold text-neutral-900 leading-tight" style={{ fontSize: 'var(--text-section)' }}>
                  Serata Jazz Live
                </h3>
                <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                  Una serata speciale con musica dal vivo nel nostro giardino. Posti limitati, prenotazione consigliata.
                </p>
                <a className="article-link">
                  Scopri di più
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
            {/* Card dark */}
            <div className="rounded-card border overflow-hidden flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#1a1a1a' }}>
              <div className="card-img bg-neutral-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="card-badge">Ogni sabato</span>
              </div>
              <div className="card-body">
                <p className="font-sans font-medium uppercase text-white/35" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Ricorrente
                </p>
                <h3 className="font-sans font-semibold text-white leading-tight" style={{ fontSize: 'var(--text-section)' }}>
                  Aperitivo in Giardino
                </h3>
                <p className="font-sans font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)', color: 'rgba(255,255,255,0.55)' }}>
                  Ogni sabato dalle 18:00 nel nostro giardino. Cocktail, vini naturali e stuzzichini del territorio.
                </p>
                <a className="inline-flex items-center gap-2 font-medium mt-2 transition-colors" style={{ fontSize: 'var(--text-meta)', color: '#eece9d' }}>
                  Scopri di più
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Card menù */}
          <Label>Card menù (stile lista)</Label>
          <Panel>
            <div className="flex flex-col gap-3">
              {[
                { nome: 'Tagliere del territorio', desc: 'Formaggi locali, salumi, miele e mostarda', prezzo: '18', badge: 'Senza glutine' },
                { nome: 'Risotto ai funghi porcini', desc: 'Con burro di malga e parmigiano 36 mesi', prezzo: '14', badge: null },
                { nome: 'Pizza Margherita STG', desc: 'Fior di latte, pomodoro San Marzano, basilico', prezzo: '10', badge: 'Vegetariana' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-medium text-neutral-900" style={{ fontSize: 'var(--text-body)' }}>
                          {item.nome}
                        </span>
                        {item.badge && (
                          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-pill bg-neutral-100 text-neutral-500">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-sans font-light text-neutral-500 mt-0.5" style={{ fontSize: 'var(--text-meta)' }}>
                        {item.desc}
                      </p>
                    </div>
                    <span className="font-sans font-semibold text-neutral-900 shrink-0" style={{ fontSize: 'var(--text-body)' }}>
                      €{item.prezzo}
                    </span>
                  </div>
                  {i < 2 && <Divider />}
                </div>
              ))}
            </div>
          </Panel>
        </Section>

        {/* ── 8. SEZIONE DARK — preview completa ──────────────────────────── */}
        <Section title="8. Sezione dark — layout completo">
          <DarkPanel>
            {/* Hero mini */}
            <div className="flex flex-col gap-3 mb-8">
              <span className="font-sans font-medium uppercase text-white/35" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                Prossimi appuntamenti
              </span>
              <h2 className="font-ivy font-light text-white leading-tight" style={{ fontSize: '2.5rem' }}>
                Vivere il Boogie
              </h2>
              <p className="font-sans font-light text-white/60 max-w-lg leading-relaxed" style={{ fontSize: 'var(--text-body)' }}>
                Ogni settimana nuovi eventi, serate speciali e momenti da condividere nel nostro locale.
              </p>
              <div className="flex gap-3 mt-2">
                <button className="bg-brand hover:bg-brand-hover text-black/80 font-semibold px-6 py-3 rounded-btn transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
                  Vedi tutti gli eventi
                </button>
                <button className="border border-white/20 text-white/60 font-semibold px-6 py-3 rounded-btn hover:border-white/40 transition-colors" style={{ fontSize: 'var(--text-meta)' }}>
                  Contattaci
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6" />

            {/* Orari fake */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { giorno: 'Martedì – Venerdì', orario: '19:00 – 22:30' },
                { giorno: 'Sabato – Domenica', orario: '12:00 – 14:30 / 19:00 – 22:30' },
              ].map(o => (
                <div key={o.giorno} className="rounded-btn p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="font-sans font-medium uppercase text-white/35 mb-1" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                    {o.giorno}
                  </p>
                  <p className="font-sans font-light text-white/70" style={{ fontSize: 'var(--text-meta)' }}>
                    {o.orario}
                  </p>
                </div>
              ))}
            </div>
          </DarkPanel>
        </Section>

        {/* ── 9. ANIMAZIONI ───────────────────────────────────────────────── */}
        <Section title="9. Animazioni — keyframe & transizioni">
          <Panel>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Easing principale — cubic-bezier(0.16, 1, 0.3, 1) a 1.4s</Label>
                <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                  Usato su: hero h1, navbar logo, page transition (0.45s), cookie banner (0.4s). Curva easeOutExpo percettivamente veloce.
                </p>
              </div>
              <Divider />
              <div>
                <Label>Keyframes definiti in globals.css</Label>
                <div className="flex flex-col gap-1 font-mono text-[0.72rem] text-neutral-600 bg-neutral-50 rounded-btn p-4">
                  <p className="text-neutral-400">{'// slide-in-right — hero h1'}</p>
                  <p>from: translateX(80px) opacity:0 → translateX(0) opacity:1</p>
                  <br />
                  <p className="text-neutral-400">{'// navbar-in — navbar entrance'}</p>
                  <p>from: translateY(-100%) opacity:0 → translateY(0) opacity:1</p>
                  <br />
                  <p className="text-neutral-400">{'// kenburns-1/2 — hero image parallax'}</p>
                  <p>8s ease-in-out infinite alternate · scale 1→1.06 + translate</p>
                </div>
              </div>
              <Divider />
              <div>
                <Label>Durate Framer Motion per componente</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { comp: 'Navbar dropdown', dur: '0.18s easeOut' },
                    { comp: 'Cookie banner', dur: '0.4s [0.16,1,0.3,1]' },
                    { comp: 'Page transition', dur: '0.45s [0.16,1,0.3,1]' },
                    { comp: 'Carousel news', dur: '0.6s easeOut' },
                    { comp: 'Mosaic fade-in', dur: '0.7s easeOut' },
                    { comp: 'Hero content', dur: '1.2–1.4s [0.16,1,0.3,1]' },
                    { comp: 'Image dissolve', dur: '900ms ease-in-out' },
                    { comp: 'img-zoom hover', dur: '700ms ease-out' },
                  ].map(a => (
                    <div key={a.comp} className="flex justify-between items-center gap-2 py-1.5 border-b border-neutral-100 last:border-none">
                      <span className="font-sans font-light text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>{a.comp}</span>
                      <span className="font-mono text-[0.65rem] text-neutral-400 shrink-0">{a.dur}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </Section>

        {/* ── 10. POPUP ───────────────────────────────────────────────────── */}
        <Section title="10. Popup — varianti urgency">
          <p className="font-sans font-light text-neutral-500 mb-5" style={{ fontSize: 'var(--text-meta)' }}>
            Anteprima statica — il componente reale appare in basso a sinistra dopo 3s con animazione cubic-bezier.
          </p>
          <div className="flex flex-wrap gap-6 items-start">
            <PopupPreview urgency="distante" />
            <PopupPreview urgency="imminente" />
            <PopupPreview urgency="lastMinute" />
          </div>
        </Section>

        {/* ── 10b. SLIM POPUP ─────────────────────────────────────────────── */}
        <Section title="10b. Slim Popup — banner bottom">
          <p className="font-sans font-light text-neutral-500 mb-5" style={{ fontSize: 'var(--text-meta)' }}>
            Banner fisso in fondo alla pagina su sfondo brand. Appare quando c'è un evento in primo piano.
            Animazione: slide-up dal basso, 0.45s cubic-bezier(0.16, 1, 0.3, 1).
          </p>
          <SlimPopupPreview />
        </Section>

        {/* ── 11. SPAZIATURA ──────────────────────────────────────────────── */}
        <Section title="11. Spaziatura — gap & padding scale">
          <Panel>
            <Label>Gap / spacing ricorrenti (Tailwind 4px base)</Label>
            <div className="flex flex-col gap-2">
              {[
                { cls: 'gap-1', px: '4px', use: 'Icona + testo mini' },
                { cls: 'gap-2', px: '8px', use: 'Badge elementi interni' },
                { cls: 'gap-3', px: '12px', use: 'Form label + input' },
                { cls: 'gap-4', px: '16px', use: 'Pulsanti affiancati' },
                { cls: 'gap-6', px: '24px', use: 'Card body elementi' },
                { cls: 'gap-8', px: '32px', use: 'Sezioni interne' },
                { cls: 'gap-12', px: '48px', use: 'Griglia card' },
                { cls: 'gap-16', px: '64px', use: 'Sezioni pagina' },
              ].map(s => (
                <div key={s.cls} className="flex items-center gap-4">
                  <span className="font-mono text-[0.65rem] text-neutral-400 w-14 shrink-0">{s.cls}</span>
                  <div className="flex items-center" style={{ gap: s.px }}>
                    <div className="w-5 h-5 rounded bg-brand/60" />
                    <div className="w-5 h-5 rounded bg-brand" />
                  </div>
                  <span className="font-mono text-[0.6rem] text-neutral-400">{s.px}</span>
                  <span className="font-sans font-light text-neutral-500" style={{ fontSize: 'var(--text-meta)' }}>{s.use}</span>
                </div>
              ))}
            </div>
            <Divider />
            <Label>Padding sezioni principali</Label>
            <div className="flex flex-col gap-1.5 font-mono text-[0.65rem] text-neutral-500">
              <p><span className="text-neutral-800">Hero</span> — px-8 pt-20 pb-8 · md:px-14 pt-24 pb-12</p>
              <p><span className="text-neutral-800">Section standard</span> — py-16 · md:py-20 / py-20 · md:py-28</p>
              <p><span className="text-neutral-800">Container</span> — px-6 · md:px-14 · max-w-7xl</p>
              <p><span className="text-neutral-800">Card body</span> — padding: 1.75rem, gap: 0.75rem</p>
            </div>
          </Panel>
        </Section>

        {/* ── 12. NOTE E DISCUSSIONE ──────────────────────────────────────── */}
        <Section title="12. Note & Punti da discutere">
          <div className="flex flex-col gap-4">

            <div className="rounded-card border-l-4 bg-white p-6 flex flex-col gap-2" style={{ borderLeftColor: '#eece9d' }}>
              <p className="font-sans font-semibold text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
                Font: IvyMode vs Raleway
              </p>
              <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Attualmente IvyMode viene usato <strong>solo su h1/hero</strong>. Raleway (sans) gestisce tutto il resto.
                Si potrebbe valutare: usare IvyMode anche sugli h2 per più coerenza display, oppure eliminarlo e
                usare solo Raleway per semplificare il sistema. IvyMode è serif con carattere distinctivo — tenerlo
                solo per i grandi titoli hero ha senso se l'obiettivo è&nbsp;"lusso sobrio".
              </p>
            </div>

            <div className="rounded-card border-l-4 bg-white p-6 flex flex-col gap-2" style={{ borderLeftColor: '#a3a3a3' }}>
              <p className="font-sans font-semibold text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
                Colori: brand gold #eece9d
              </p>
              <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Il brand è un beige/oro caldo. Su sfondo bianco il contrasto è basso (testo nero/80 sopra).
                Funziona bene come sfondo CTA, ma non come colore testo su bianco (leggibilità borderline).
                Su sfondo dark (#1a1a1a) come bordo/link funziona molto bene. Possibile discussione:
                aggiungere una variante più scura per usi su bianco?
              </p>
            </div>

            <div className="rounded-card border-l-4 bg-white p-6 flex flex-col gap-2" style={{ borderLeftColor: '#a3a3a3' }}>
              <p className="font-sans font-semibold text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
                Pesi Raleway: si usano 5 pesi (300–700)
              </p>
              <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                300 (body), 400 (standard), 500 (label/medium), 600 (h2/h3/pulsanti), 700 (h2 CSS globale).
                In alcuni punti 600 e 700 coesistono su h2 (CSS globale dice 700, i componenti usano font-semibold = 600).
                Sarebbe utile uniformare — scegliere 600 o 700 per i titoli e applicarlo ovunque.
              </p>
            </div>

            <div className="rounded-card border-l-4 bg-white p-6 flex flex-col gap-2" style={{ borderLeftColor: '#a3a3a3' }}>
              <p className="font-sans font-semibold text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
                Font non-UI nel progetto: Basis Grotesque + Phosphate
              </p>
              <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Questi font (in public/fonts/) sono usati solo nei template per slide social (PostBuilderPanel),
                non nel sito pubblico. Nessun impatto sul design system del website.
              </p>
            </div>

            <div className="rounded-card border-l-4 bg-white p-6 flex flex-col gap-2" style={{ borderLeftColor: '#a3a3a3' }}>
              <p className="font-sans font-semibold text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
                Colori hardcoded vs token
              </p>
              <p className="font-sans font-light text-neutral-600 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Alcuni componenti usano ancora valori hardcoded (es. #1a1a1a scritto direttamente invece di
                var(--color-surface-dark), rgba(0,0,0,0.5) per overlay). Uniformare tutto ai token CSS
                renderebbe più facile cambiare la palette in futuro.
              </p>
            </div>

          </div>
        </Section>

      </div>
    </main>
  )
}
