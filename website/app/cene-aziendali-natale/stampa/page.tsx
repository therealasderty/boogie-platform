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
        /* ── Print ── */
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .mn-card {
            width: 210mm;
            height: 297mm;
            padding: 20mm 25mm;
            page-break-after: always;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .mn-card:last-child { page-break-after: auto; }
          .mn-frame-print {
            position: absolute;
            inset: 7mm;
            border: 1.5px solid rgba(0,0,0,0.08);
            pointer-events: none;
          }
        }

        /* ── Base / Mobile ── */
        .mn-wrapper {
          min-height: 100vh;
          background: #f5f5f5;
          padding: 20px 16px 60px;
        }
        .mn-toolbar {
          max-width: 600px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: center;
        }
        .mn-card {
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
        .mn-frame-print { display: none; }
        .mn-logo {
          width: 90px;
          height: auto;
          margin: 0 auto 6px;
          display: block;
        }
        .mn-address {
          font-size: 14px;
          color: #999;
          margin-bottom: 24px;
        }
        .mn-divider {
          width: 80px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent);
          margin: 24px auto;
        }
        .mn-menu-name {
          font-family: var(--font-ivy, 'Georgia'), serif;
          font-size: 36px;
          font-weight: 300;
          color: #1a1a1a;
          letter-spacing: 0.03em;
          line-height: 1.2;
        }
        .mn-menu-price {
          font-size: 22px;
          font-weight: 400;
          color: #555;
          margin-top: 8px;
        }
        .mn-portate {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: center;
        }
        .mn-portata-tipo {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #b08d57;
          margin-bottom: 6px;
        }
        .mn-portata-piatto {
          font-size: 18px;
          font-weight: 300;
          color: #333;
          line-height: 1.5;
        }
        .mn-bevande {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #999;
        }
        .mn-footer-info {
          font-size: 13px;
          color: #bbb;
          margin-top: 8px;
        }

        /* ── Desktop preview ── */
        @media screen and (min-width: 801px) {
          .mn-card {
            max-width: 210mm;
            min-height: 297mm;
            padding: 60px 50px;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .mn-logo { width: 110px; }
          .mn-menu-name { font-size: 32pt; }
          .mn-menu-price { font-size: 18pt; }
          .mn-portata-tipo { font-size: 10pt; }
          .mn-portata-piatto { font-size: 14pt; }
          .mn-portate { gap: 28px; }
        }
      `}</style>

      <div className="mn-wrapper">
        <div className="mn-toolbar no-print">
          <PrintButton />
        </div>

        {MENU_NATALE.map((menu) => (
          <div key={menu.nome} className="mn-card">
            <div className="mn-frame-print" />
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
            <div className="mn-footer-info">boogiebistrot.com</div>
          </div>
        ))}
      </div>
    </>
  )
}
