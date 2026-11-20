import type { Metadata } from 'next'
import { MENU_CERIMONIE, ALTERNATIVE_CERIMONIE } from '@/lib/menu-cerimonie'
import PrintButton from '@/app/menu/stampa/PrintButton'

export const metadata: Metadata = {
  title: 'Menù Comunioni e Cresime — Boogie Bistrot',
  robots: { index: false, follow: false },
}

export default function MenuCerimonieStampaPage() {
  return (
    <>
      <style>{`
        /* ── Print ── */
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .mc-card {
            width: 210mm;
            height: 297mm;
            padding: 20mm 25mm;
            page-break-after: always;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .mc-card:last-child { page-break-after: auto; }
          .mc-frame-print {
            position: absolute;
            inset: 7mm;
            border: 1.5px solid rgba(0,0,0,0.08);
            pointer-events: none;
          }
        }

        /* ── Base / Mobile ── */
        .mc-wrapper {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 20px 16px 60px;
        }
        .mc-toolbar {
          max-width: 600px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: center;
        }
        .mc-card {
          position: relative;
          background: #fff;
          border-radius: 16px;
          padding: 48px 28px;
          margin: 0 auto 20px;
          max-width: 600px;
          text-align: center;
          font-family: var(--font-sans), 'Raleway', sans-serif;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .mc-frame-print { display: none; }
        .mc-logo {
          width: 90px;
          height: auto;
          margin: 0 auto 6px;
          display: block;
        }
        .mc-address {
          font-size: 14px;
          color: #999;
          margin-bottom: 24px;
        }
        .mc-divider {
          width: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent);
          margin: 24px auto;
        }
        .mc-menu-name {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 36px;
          font-weight: 300;
          color: #1a1a1a;
          letter-spacing: 0.03em;
          line-height: 1.2;
        }
        .mc-menu-price {
          font-size: 22px;
          font-weight: 400;
          color: #555;
          margin-top: 8px;
        }
        .mc-portate {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: center;
        }
        .mc-portata-tipo {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #b08d57;
          margin-bottom: 6px;
        }
        .mc-portata-piatto {
          font-size: 18px;
          font-weight: 300;
          color: #333;
          line-height: 1.5;
        }
        .mc-bevande {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #999;
        }
        .mc-footer-info {
          font-size: 13px;
          color: #bbb;
          margin-top: 8px;
        }
        /* ── Alternative section ── */
        .mc-alt-title {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 30px;
          font-weight: 300;
          color: #1a1a1a;
          letter-spacing: 0.03em;
          margin-bottom: 32px;
        }
        .mc-alt-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px 40px;
          text-align: left;
        }
        .mc-alt-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #b08d57;
          margin-bottom: 8px;
        }
        .mc-alt-item {
          font-size: 16px;
          font-weight: 300;
          color: #333;
          line-height: 1.6;
        }

        /* ── Desktop preview ── */
        @media screen and (min-width: 801px) {
          .mc-card {
            max-width: 210mm;
            min-height: 297mm;
            padding: 60px 50px;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .mc-logo { width: 110px; }
          .mc-menu-name { font-size: 32pt; }
          .mc-menu-price { font-size: 18pt; }
          .mc-portata-tipo { font-size: 10pt; }
          .mc-portata-piatto { font-size: 14pt; }
          .mc-portate { gap: 28px; }
          .mc-alt-title { font-size: 28pt; }
          .mc-alt-grid { gap: 32px 50px; }
          .mc-alt-label { font-size: 9pt; }
          .mc-alt-item { font-size: 12pt; }
        }
      `}</style>

      <div className="mc-wrapper">
        <div className="mc-toolbar no-print">
          <PrintButton />
        </div>

        {MENU_CERIMONIE.map((menu) => (
          <div key={menu.nome} className="mc-card">
            <div className="mc-frame-print" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo-Gold.svg" alt="Boogie Bistrot" className="mc-logo" />
            <div className="mc-address">Via Europa 2, Colle Brianza (LC)</div>

            <div className="mc-divider" />

            <div className="mc-menu-name">{menu.nome}</div>
            <div className="mc-menu-price">{menu.prezzo} &#8364; a persona</div>

            <div className="mc-divider" />

            <div className="mc-portate">
              {menu.portate.map((portata) => (
                <div key={portata.tipo}>
                  <div className="mc-portata-tipo">{portata.tipo}</div>
                  {portata.piatti.map((piatto) => (
                    <div key={piatto} className="mc-portata-piatto">{piatto}</div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mc-divider" />

            <div className="mc-bevande">
              Acqua, vino e caffè inclusi · Torta cerimonia inclusa
            </div>
            <div className="mc-footer-info">boogiebistrot.com</div>
          </div>
        ))}

        {/* ── Pagina alternative ── */}
        <div className="mc-card">
          <div className="mc-frame-print" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo-Gold.svg" alt="Boogie Bistrot" className="mc-logo" />
          <div className="mc-address">Via Europa 2, Colle Brianza (LC)</div>

          <div className="mc-divider" />

          <div className="mc-alt-title">Primi e secondi alternativi</div>

          <div className="mc-alt-grid">
            <div>
              <div className="mc-alt-label">Primi terra</div>
              {ALTERNATIVE_CERIMONIE.primiTerra.map((p) => (
                <div key={p} className="mc-alt-item">{p}</div>
              ))}
            </div>
            <div>
              <div className="mc-alt-label">Primi mare</div>
              {ALTERNATIVE_CERIMONIE.primiMare.map((p) => (
                <div key={p} className="mc-alt-item">{p}</div>
              ))}
            </div>
            <div>
              <div className="mc-alt-label">Secondi terra</div>
              {ALTERNATIVE_CERIMONIE.secondiTerra.map((p) => (
                <div key={p} className="mc-alt-item">{p}</div>
              ))}
            </div>
            <div>
              <div className="mc-alt-label">Secondi mare</div>
              {ALTERNATIVE_CERIMONIE.secondiMare.map((p) => (
                <div key={p} className="mc-alt-item">{p}</div>
              ))}
            </div>
          </div>

          <div className="mc-divider" />

          <div className="mc-footer-info">boogiebistrot.com</div>
        </div>
      </div>
    </>
  )
}
