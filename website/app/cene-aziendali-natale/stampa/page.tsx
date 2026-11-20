import type { Metadata } from 'next'
import { MENU_NATALE } from '@/lib/menu-natale'
import PrintButton from '@/app/menu/stampa/PrintButton'

export const metadata: Metadata = {
  title: 'Menù di Natale — Boogie Bistrot',
  robots: { index: false, follow: false },
}

export default function MenuNataleStampaPage() {
  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }

        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        .mn-page {
          width: 210mm;
          min-height: 297mm;
          position: relative;
          overflow: hidden;
          page-break-after: always;
          box-sizing: border-box;
          font-family: var(--font-sans), 'Raleway', sans-serif;
          background: #fff;
          color: #222;
        }
        .mn-page:last-of-type { page-break-after: auto; }

        @media screen {
          .mn-page { margin: 24px auto; box-shadow: 0 2px 16px rgba(0,0,0,0.12); }
          .mn-toolbar { max-width: 210mm; margin: 24px auto 0; display: flex; justify-content: center; }
        }

        /* ── Mobile: scale to viewport ── */
        @media screen and (max-width: 800px) {
          .mn-page {
            width: 100vw;
            min-height: auto;
            margin: 0;
            box-shadow: none;
            border-bottom: 1px solid #e5e5e5;
            padding: 10vw 7vw;
          }
          .mn-content { position: static; }
          .mn-frame, .mn-frame-inner { display: none; }
          .mn-toolbar { margin: 16px auto; }
        }

        .mn-frame {
          position: absolute;
          inset: 7mm;
          border: 1.5px solid rgba(0,0,0,0.08);
          pointer-events: none;
        }

        .mn-frame-inner {
          position: absolute;
          inset: 11mm;
          border: 0.5px solid rgba(0,0,0,0.05);
          pointer-events: none;
        }

        .mn-content {
          position: absolute;
          inset: 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .mn-logo {
          width: 32mm;
          height: auto;
          margin-top: 4mm;
        }
        @media screen and (max-width: 800px) {
          .mn-logo { width: 80px; margin-top: 0; }
        }

        .mn-address {
          font-size: 9pt;
          font-weight: 400;
          color: #999;
          margin-top: 3mm;
          letter-spacing: 0.03em;
        }
        @media screen and (max-width: 800px) {
          .mn-address { font-size: 13px; margin-top: 8px; }
        }

        .mn-divider {
          width: 50mm;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent);
          margin: 7mm 0;
          flex-shrink: 0;
        }
        @media screen and (max-width: 800px) {
          .mn-divider { width: 60%; margin: 20px 0; }
        }

        .mn-menu-name {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 30pt;
          font-weight: 300;
          color: #1a1a1a;
          letter-spacing: 0.04em;
        }
        @media screen and (max-width: 800px) {
          .mn-menu-name { font-size: 32px; }
        }

        .mn-menu-price {
          font-size: 18pt;
          font-weight: 400;
          color: #555;
          margin-top: 3mm;
          letter-spacing: 0.03em;
        }
        @media screen and (max-width: 800px) {
          .mn-menu-price { font-size: 20px; margin-top: 6px; }
        }

        .mn-portate {
          margin-top: 8mm;
          width: 100%;
          max-width: 150mm;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 7mm;
        }
        @media screen and (max-width: 800px) {
          .mn-portate { max-width: 100%; gap: 24px; margin-top: 20px; }
        }

        .mn-portata-tipo {
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #b08d57;
          margin-bottom: 2mm;
        }
        @media screen and (max-width: 800px) {
          .mn-portata-tipo { font-size: 13px; margin-bottom: 6px; }
        }

        .mn-portata-piatto {
          font-size: 13pt;
          font-weight: 300;
          color: #333;
          line-height: 1.6;
        }
        @media screen and (max-width: 800px) {
          .mn-portata-piatto { font-size: 17px; line-height: 1.5; }
        }

        .mn-bevande {
          font-size: 9pt;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #999;
        }
        @media screen and (max-width: 800px) {
          .mn-bevande { font-size: 13px; }
        }

        .mn-footer-info {
          font-size: 8pt;
          color: #bbb;
          margin-top: 4mm;
          letter-spacing: 0.03em;
        }
        @media screen and (max-width: 800px) {
          .mn-footer-info { font-size: 12px; margin-top: 12px; }
        }
      `}</style>

      <div className="mn-toolbar no-print">
        <PrintButton />
      </div>

      {MENU_NATALE.map((menu) => (
        <div key={menu.nome} className="mn-page">
          <div className="mn-frame" />
          <div className="mn-frame-inner" />
          <div className="mn-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo-Gold.svg" alt="Boogie Bistrot" className="mn-logo" />

            <div className="mn-address">Via Europa 2, Colle Brianza (LC)</div>

            <div className="mn-divider" />

            <div className="mn-menu-name">{menu.nome}</div>
            <div className="mn-menu-price">{menu.prezzo} &#8364; a persona</div>

            <div className="mn-divider" />

            <div className="mn-portate">
              {menu.portate.map((portata) => (
                <div key={portata.tipo}>
                  <div className="mn-portata-tipo">{portata.tipo}</div>
                  {portata.piatti.map((piatto) => (
                    <div key={piatto} className="mn-portata-piatto">{piatto}</div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mn-divider" />

            <div className="mn-bevande">
              {menu.bevande ?? 'Acqua, vino e caffè inclusi'}
            </div>

            <div className="mn-footer-info">
              boogiebistrot.com
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
