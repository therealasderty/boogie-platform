import type { Metadata } from 'next'
import { fetchMenuCompleto } from '@/lib/menu'
import type { VoceMenu, SezioneMenu } from '@/lib/menu'
import PrintButton from './PrintButton'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Menu Stampabile — Boogie Bistrot',
  robots: { index: false, follow: false },
}

/* ── Allergen legend ── */
const ALLERGENI_LEGENDA = [
  '1- Cereali e derivati',
  '2- Crostacei e derivati',
  '3- Uova e derivati',
  '4- Pesce e derivati',
  '5- Arachidi e derivati',
  '6- Soia e derivati',
  '7- Latte e derivati',
  '8- Frutta a guscio',
  '9- Sedano',
  '10- Senape',
  '11- Sesamo',
  '12- Anidride solforosa e solfiti',
  '13- Lupini e derivati',
  '14- Molluschi e derivati',
]

/* ── Sub-components ── */

function IconSenzaGlutine() {
  return (
    <span className="mp-icon-sg" title="Senza glutine">
      <svg viewBox="0 0 18 18" width="10" height="10">
        <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="9" y="12.5" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor">G</text>
        <line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  )
}

function IconSenzaLattosio() {
  return (
    <span className="mp-icon-sl" title="Senza lattosio">
      <svg viewBox="0 0 18 18" width="10" height="10">
        <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text x="9" y="12.5" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor">L</text>
        <line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  )
}

function Piatto({ v, showDesc = false }: { v: VoceMenu; showDesc?: boolean }) {
  return (
    <div className="mp-dish">
      <div className="mp-dish-row">
        <span className="mp-dish-name">{v.nome}</span>
        {v.senzaGlutine && <IconSenzaGlutine />}
        {v.senzaLattosio && <IconSenzaLattosio />}
        {v.prezzo != null && (
          <>
            <span className="mp-dots" />
            <span className="mp-dish-price">{v.prezzo}&#8364;</span>
          </>
        )}
      </div>
      {showDesc && v.descrizione && (
        <div className="mp-dish-desc">{v.descrizione}</div>
      )}
      {v.note && (
        <div className="mp-dish-note">
          {v.note.replace(/senza\s+glutine/gi, '').replace(/senza\s+lattosio/gi, '').replace(/^[\s,;.·\-]+|[\s,;.·\-]+$/g, '').trim()}
        </div>
      )}
      {v.allergeni && (
        <div className="mp-dish-allergens">({v.allergeni})</div>
      )}
    </div>
  )
}

function PiattoPizza({ v }: { v: VoceMenu }) {
  return (
    <div className="mp-dish mp-pizza">
      <div className="mp-dish-row">
        <span className="mp-pizza-name">{v.nome}</span>
        {v.senzaGlutine && <IconSenzaGlutine />}
        {v.senzaLattosio && <IconSenzaLattosio />}
        <span className="mp-dots" />
        <span className="mp-dish-price">{v.prezzo}&#8364;</span>
      </div>
      {v.descrizione && (
        <div className="mp-dish-desc">{v.descrizione}</div>
      )}
      {v.allergeni && (
        <div className="mp-dish-allergens">({v.allergeni})</div>
      )}
    </div>
  )
}

function PiattoVino({ v }: { v: VoceMenu }) {
  return (
    <div className="mp-dish mp-vino">
      <div className="mp-dish-row">
        <span className="mp-vino-name">{v.nome}</span>
        <span className="mp-dots" />
        <span className="mp-dish-price">
          {v.prezzo != null && <>{v.prezzo}&#8364;</>}
        </span>
      </div>
      {v.produttore && (
        <div className="mp-vino-prod">({v.produttore})</div>
      )}
      {v.descrizione && (
        <div className="mp-dish-desc">{v.descrizione}</div>
      )}
      {v.formato2 && v.prezzo2 != null && (
        <div className="mp-vino-alt">{v.formato2} {v.prezzo2}&#8364;</div>
      )}
    </div>
  )
}

function PiattoBirra({ v }: { v: VoceMenu }) {
  return (
    <div className="mp-dish mp-birra">
      <div className="mp-dish-row">
        <span className="mp-birra-name">{v.nome}</span>
        {v.senzaGlutine && <IconSenzaGlutine />}
      </div>
      {v.produttore && (
        <div className="mp-vino-prod">({v.produttore})</div>
      )}
      {v.descrizione && (
        <div className="mp-dish-desc">{v.descrizione}</div>
      )}
      <div className="mp-birra-prices">
        {v.formato && v.prezzo != null && (
          <span>{v.formato} {v.prezzo}&#8364;</span>
        )}
        {!v.formato && v.prezzo != null && (
          <span>{v.prezzo}&#8364;</span>
        )}
        {v.formato2 && v.prezzo2 != null && (
          <span style={{ marginLeft: '8px' }}>{v.formato2} {v.prezzo2}&#8364;</span>
        )}
      </div>
    </div>
  )
}

function SezioneTitolo({ titolo }: { titolo: string }) {
  return (
    <h3 className="mp-section-title">
      <span className="mp-bullet">&#8226;</span>
      {' '}{titolo.toUpperCase()}{' '}
      <span className="mp-bullet">&#8226;</span>
    </h3>
  )
}

/* ── Main Page ── */

export default async function MenuStampaPage() {
  const menu = await fetchMenuCompleto()

  const antipasti = menu.specialita.find(s => s.titolo === 'Antipasti')?.voci ?? []
  const primi = menu.specialita.find(s => s.titolo === 'Primi')?.voci ?? []
  const secondi = menu.specialita.find(s => s.titolo === 'Secondi')?.voci ?? []
  const dolci = menu.specialita.find(s => s.titolo === 'Dolci')?.voci ?? []

  return (
    <>
      <style>{`
        /* ── Reset & Print ── */
        @page { size: A4 landscape; margin: 0; }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* ── Page container ── */
        .mp-page {
          width: 297mm;
          height: 210mm;
          position: relative;
          overflow: hidden;
          page-break-after: always;
          box-sizing: border-box;
          font-family: var(--font-sans), 'Raleway', sans-serif;
          color: #333;
        }
        .mp-page:last-of-type { page-break-after: auto; }

        @media screen {
          .mp-page {
            margin: 24px auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.25);
          }
          .mp-toolbar {
            max-width: 297mm;
            margin: 24px auto 0;
            display: flex;
            justify-content: center;
            gap: 12px;
          }
        }

        /* ── Backgrounds ── */
        .mp-bg-dark {
          background-color: #3a3a3a;
          background-image:
            linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%),
            linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%);
          background-size: 40px 40px;
          background-position: 0 0, 20px 20px;
        }

        .mp-bg-gold {
          background-color: #c9a33e;
          background-image:
            linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%),
            linear-gradient(45deg, rgba(0,0,0,0.035) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.035) 75%);
          background-size: 40px 40px;
          background-position: 0 0, 20px 20px;
        }

        /* ── Decorative borders ── */
        .mp-frame {
          position: absolute;
          inset: 4mm;
          border: 2.5px solid rgba(212, 168, 67, 0.5);
          pointer-events: none;
        }
        .mp-bg-dark .mp-frame {
          border-color: rgba(212, 168, 67, 0.4);
        }
        .mp-bg-gold .mp-frame {
          border-color: rgba(255, 255, 255, 0.25);
        }

        .mp-border-inner {
          position: absolute;
          inset: 8mm;
          border: 1px dashed rgba(0, 0, 0, 0.12);
          pointer-events: none;
        }
        .mp-bg-dark .mp-border-inner {
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* ── Content area ── */
        .mp-content {
          position: absolute;
          inset: 10mm;
          display: flex;
          flex-direction: column;
        }

        /* ── Cover page ── */
        .mp-cover-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
          text-align: center;
        }
        .mp-cover-logo { width: 50mm; height: auto; }
        .mp-cover-tagline {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 20pt;
          font-weight: 300;
          margin-top: 12mm;
          line-height: 1.4;
          color: #eece9d;
        }
        .mp-cover-social {
          margin-top: auto;
          font-size: 9pt;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.05em;
        }
        .mp-cover-social a { color: rgba(255,255,255,0.7); text-decoration: none; }
        .mp-cover-social p { margin: 2mm 0; }
        .mp-social-icons {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin: 2mm 0;
        }
        .mp-social-icons svg { width: 16px; height: 16px; fill: rgba(255,255,255,0.7); }

        /* ── Page titles ── */
        .mp-page-title {
          font-family: var(--font-sans), 'Raleway', sans-serif;
          font-size: 15pt;
          font-weight: 300;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          text-align: right;
          margin-bottom: 2mm;
          color: #333;
        }

        /* ── Section titles ── */
        .mp-section-title {
          font-size: 9.5pt;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
          margin: 0 0 2.5mm;
          padding: 0;
        }
        .mp-bullet { font-size: 7pt; vertical-align: middle; }

        /* ── Three-column grid ── */
        .mp-cols {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6mm;
          flex: 1;
          align-content: start;
        }
        .mp-col { min-width: 0; }

        /* ── Dish items ── */
        .mp-dish {
          margin-bottom: 2mm;
        }
        .mp-dish-row {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1.3;
        }
        .mp-dish-name {
          font-size: 8pt;
          font-weight: 400;
          flex-shrink: 0;
        }
        .mp-dots {
          flex: 1;
          border-bottom: 0.8px dotted rgba(0,0,0,0.35);
          margin: 0 2px;
          min-width: 6px;
          align-self: baseline;
          position: relative;
          top: -2px;
        }
        .mp-dish-price {
          font-size: 8pt;
          font-weight: 400;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mp-dish-desc {
          font-size: 6.5pt;
          font-style: italic;
          opacity: 0.65;
          margin-top: 0.3mm;
          line-height: 1.3;
        }
        .mp-dish-note {
          font-size: 6.5pt;
          font-style: italic;
          opacity: 0.55;
          margin-top: 0.2mm;
        }
        .mp-dish-allergens {
          font-size: 6pt;
          opacity: 0.5;
          margin-top: 0.2mm;
        }

        /* ── Icons ── */
        .mp-icon-sg, .mp-icon-sl {
          display: inline-flex;
          align-items: center;
          margin: 0 1px;
          flex-shrink: 0;
        }

        /* ── Pizza items ── */
        .mp-pizza-name {
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        /* ── Wine items ── */
        .mp-vino-name {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .mp-vino-prod {
          font-size: 6.5pt;
          text-transform: uppercase;
          opacity: 0.65;
          margin-top: 0.2mm;
        }
        .mp-vino-alt {
          font-size: 6.5pt;
          opacity: 0.6;
          margin-top: 0.2mm;
          text-align: right;
        }

        /* ── Beer items ── */
        .mp-birra-name {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .mp-birra-prices {
          font-size: 6.5pt;
          margin-top: 0.3mm;
          display: flex;
          gap: 4mm;
        }

        /* ── Cocktail items ── */
        .mp-cocktail-name {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
        }
        .mp-cocktail-desc {
          font-size: 6pt;
          opacity: 0.6;
          line-height: 1.2;
        }

        /* ── Apericena box ── */
        .mp-apericena {
          margin-top: auto;
          padding: 3mm;
          text-align: left;
        }
        .mp-apericena-subtitle {
          font-size: 6.5pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
          line-height: 1.3;
        }
        .mp-apericena-title {
          font-size: 16pt;
          font-weight: 800;
          text-transform: uppercase;
          line-height: 1.1;
          margin: 1mm 0;
        }
        .mp-apericena-note {
          font-size: 6.5pt;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.7;
          line-height: 1.3;
        }

        /* ── Allergen legend ── */
        .mp-legend {
          font-size: 5.5pt;
          line-height: 1.4;
          opacity: 0.55;
          margin-top: auto;
          padding-top: 2mm;
        }

        /* ── Logo on content pages ── */
        .mp-logo-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3mm;
        }
        .mp-logo-header img { width: 25mm; height: auto; }

        /* ── Subsection for drinks page ── */
        .mp-subsection-title {
          font-size: 7.5pt;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-align: center;
          margin: 2mm 0 1.5mm;
          padding-bottom: 0.5mm;
          border-bottom: 0.5px solid rgba(0,0,0,0.15);
        }

        /* ── Integrale note ── */
        .mp-integrale {
          font-size: 7pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: auto;
          text-align: center;
          opacity: 0.7;
        }

        /* ── Drinks two-col layout ── */
        .mp-drink-row {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1.25;
          margin-bottom: 0.5mm;
        }
        .mp-drink-name {
          font-size: 7pt;
          font-weight: 700;
          flex-shrink: 0;
        }
        .mp-drink-price {
          font-size: 7pt;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mp-drink-desc {
          font-size: 6pt;
          opacity: 0.6;
          line-height: 1.2;
          margin-bottom: 1.5mm;
        }
      `}</style>

      {/* ── Toolbar (screen only) ── */}
      <div className="mp-toolbar no-print">
        <PrintButton />
      </div>

      {/* ══════════════════════════════════════════════
           PAGE 1 — COPERTINA
           ══════════════════════════════════════════════ */}
      <div className="mp-page mp-bg-dark">
        <div className="mp-frame" />
        <div className="mp-border-inner" />
        <div className="mp-content">
          <div className="mp-cover-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo-Gold.svg" alt="Boogie Bistrot" className="mp-cover-logo" />
            <p className="mp-cover-tagline">
              Dimenticati lo stress<br />e assapora il momento
            </p>
            <div className="mp-cover-social">
              <p>@boogiebistrot</p>
              <div className="mp-social-icons">
                <svg viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <p>www.boogiebistrot.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
           PAGE 2 — LA NOSTRA CARTA
           ══════════════════════════════════════════════ */}
      <div className="mp-page mp-bg-gold">
        <div className="mp-frame" />
        <div className="mp-border-inner" />
        <div className="mp-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2mm' }}>
            <div style={{ width: '80mm' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo-Gold.svg" alt="" style={{ width: '22mm', height: 'auto' }} />
            <h2 className="mp-page-title">LA NOSTRA CARTA</h2>
          </div>

          <div className="mp-cols">
            {/* Left: Antipasti */}
            <div className="mp-col" style={{ display: 'flex', flexDirection: 'column' }}>
              <SezioneTitolo titolo="Antipasti" />
              {antipasti.map(v => <Piatto key={v.nome} v={v} />)}
            </div>

            {/* Center: Primi + Apericena */}
            <div className="mp-col" style={{ display: 'flex', flexDirection: 'column' }}>
              <SezioneTitolo titolo="Primi Piatti" />
              {primi.map(v => <Piatto key={v.nome} v={v} />)}

              <div className="mp-apericena">
                <div className="mp-apericena-subtitle">
                  Da martedì a domenica escluso il sabato<br />
                  dalle 18:45 alle 20:30
                </div>
                <div className="mp-apericena-title">
                  Apericena<br />del Boogie 28&#8364;
                </div>
                <div className="mp-apericena-note">
                  Con drink a scelta incluso<br />
                  Disponibile anche vegano
                </div>
              </div>
            </div>

            {/* Right: Secondi + Dolci + Legend */}
            <div className="mp-col" style={{ display: 'flex', flexDirection: 'column' }}>
              <SezioneTitolo titolo="Secondi Piatti" />
              {secondi.map(v => <Piatto key={v.nome} v={v} />)}

              <div style={{ marginTop: '3mm' }}>
                <SezioneTitolo titolo="Dolci" />
                {dolci.map(v => <Piatto key={v.nome} v={v} />)}
              </div>

              <div className="mp-legend">
                Lista allergeni: {ALLERGENI_LEGENDA.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
           PAGE 3 — LE NOSTRE PIZZE
           ══════════════════════════════════════════════ */}
      <div className="mp-page mp-bg-gold">
        <div className="mp-frame" />
        <div className="mp-border-inner" />
        <div className="mp-content">
          <h2 className="mp-page-title" style={{ textAlign: 'center', marginBottom: '4mm' }}>LE NOSTRE PIZZE</h2>

          <div className="mp-cols">
            {(() => {
              const pizze = menu.pizza
              const colSize = Math.ceil(pizze.length / 3)
              const col1 = pizze.slice(0, colSize)
              const col2 = pizze.slice(colSize, colSize * 2)
              const col3 = pizze.slice(colSize * 2)
              return (
                <>
                  <div className="mp-col">
                    {col1.map(v => <PiattoPizza key={v.nome} v={v} />)}
                  </div>
                  <div className="mp-col">
                    {col2.map(v => <PiattoPizza key={v.nome} v={v} />)}
                  </div>
                  <div className="mp-col" style={{ display: 'flex', flexDirection: 'column' }}>
                    {col3.map(v => <PiattoPizza key={v.nome} v={v} />)}
                    <div className="mp-integrale">
                      Provale anche con impasto integrale
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
           PAGE 4 — VINI, BIRRE E DRINKS
           ══════════════════════════════════════════════ */}
      <div className="mp-page mp-bg-gold">
        <div className="mp-frame" />
        <div className="mp-border-inner" />
        <div className="mp-content">
          <h2 className="mp-page-title" style={{ textAlign: 'center', marginBottom: '3mm' }}>VINI, BIRRE E DRINKS</h2>

          <div className="mp-cols">
            {/* Left: Bollicine + Vini Bianchi */}
            <div className="mp-col">
              {menu.vini.filter(s => s.titolo === 'Bollicine' || s.titolo === 'Vini Bianchi').map(sezione => (
                <div key={sezione.titolo}>
                  <div className="mp-subsection-title">{sezione.titolo}</div>
                  {sezione.voci.map(v => <PiattoVino key={v.nome} v={v} />)}
                </div>
              ))}
            </div>

            {/* Center: Vini Rossi + Rosati + Casa */}
            <div className="mp-col">
              {menu.vini.filter(s => s.titolo === 'Vini Rossi' || s.titolo === 'Vini Rosati' || s.titolo === 'Vini della Casa').map(sezione => (
                <div key={sezione.titolo}>
                  <div className="mp-subsection-title">{sezione.titolo}</div>
                  {sezione.voci.map(v => <PiattoVino key={v.nome} v={v} />)}
                </div>
              ))}
            </div>

            {/* Right: Cocktails + Birre */}
            <div className="mp-col">
              {/* Cocktails */}
              <div className="mp-subsection-title">Cocktails</div>
              {menu.cocktails.map(sezione => (
                <div key={sezione.titolo} style={{ marginBottom: '2mm' }}>
                  <div style={{ fontSize: '6.5pt', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '1mm' }}>
                    {sezione.titolo}
                  </div>
                  {sezione.voci.map(v => (
                    <div key={v.nome} style={{ marginBottom: '1mm' }}>
                      <div className="mp-drink-row">
                        <span className="mp-drink-name">{v.nome}</span>
                        <span className="mp-dots" />
                        <span className="mp-drink-price">{v.prezzo}&#8364;</span>
                      </div>
                      {v.descrizione && <div className="mp-drink-desc">{v.descrizione}</div>}
                    </div>
                  ))}
                </div>
              ))}

              {/* Birre */}
              {menu.birre.map(sezione => (
                <div key={sezione.titolo}>
                  <div className="mp-subsection-title">{sezione.titolo}</div>
                  {sezione.voci.map(v => <PiattoBirra key={v.nome} v={v} />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
