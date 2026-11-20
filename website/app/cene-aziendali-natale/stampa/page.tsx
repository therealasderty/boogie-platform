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
          height: 297mm;
          position: relative;
          overflow: hidden;
          page-break-after: always;
          box-sizing: border-box;
          font-family: var(--font-sans), 'Raleway', sans-serif;
        }
        .mn-page:last-of-type { page-break-after: auto; }

        @media screen {
          .mn-page { margin: 24px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
          .mn-toolbar { max-width: 210mm; margin: 24px auto 0; display: flex; justify-content: center; }
        }

        .mn-bg {
          background-color: #1a1a1a;
        }

        .mn-frame {
          position: absolute;
          inset: 6mm;
          border: 1.5px solid rgba(238, 206, 157, 0.3);
          pointer-events: none;
        }

        .mn-frame-inner {
          position: absolute;
          inset: 10mm;
          border: 0.5px solid rgba(238, 206, 157, 0.12);
          pointer-events: none;
        }

        .mn-content {
          position: absolute;
          inset: 16mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .mn-logo {
          width: 28mm;
          height: auto;
          margin-top: 8mm;
        }

        .mn-divider {
          width: 50mm;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(238,206,157,0.4), transparent);
          margin: 6mm 0;
          flex-shrink: 0;
        }

        .mn-menu-name {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 26pt;
          font-weight: 300;
          color: #eece9d;
          letter-spacing: 0.06em;
        }

        .mn-menu-price {
          font-family: var(--font-sans), 'Raleway', sans-serif;
          font-size: 15pt;
          font-weight: 300;
          color: rgba(255,255,255,0.85);
          margin-top: 2mm;
          letter-spacing: 0.04em;
        }

        .mn-portate {
          margin-top: 6mm;
          width: 100%;
          max-width: 140mm;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5mm;
        }

        .mn-portata-tipo {
          font-size: 7.5pt;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(238,206,157,0.6);
          margin-bottom: 1.5mm;
        }

        .mn-portata-piatto {
          font-size: 11pt;
          font-weight: 300;
          color: rgba(255,255,255,0.7);
          line-height: 1.55;
        }

        .mn-bevande {
          font-size: 7.5pt;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        .mn-footer-info {
          font-size: 7pt;
          color: rgba(255,255,255,0.2);
          margin-top: 3mm;
          letter-spacing: 0.04em;
        }

        .mn-ornament {
          color: rgba(238,206,157,0.35);
          font-size: 10pt;
          letter-spacing: 6px;
          margin: 2mm 0;
        }
      `}</style>

      <div className="mn-toolbar no-print">
        <PrintButton />
      </div>

      {MENU_NATALE.map((menu) => (
        <div key={menu.nome} className="mn-page mn-bg">
          <div className="mn-frame" />
          <div className="mn-frame-inner" />
          <div className="mn-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo-Gold.svg" alt="Boogie Bistrot" className="mn-logo" />

            <div className="mn-ornament">&#10022; &#10022; &#10022;</div>

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
              Boogie Bistrot &middot; Via Europa 2, Colle Brianza (LC) &middot; boogiebistrot.com
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
