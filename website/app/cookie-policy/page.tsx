import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Cookie Policy | Boogie Bistrot',
  description: 'Informativa sull\'utilizzo dei cookie sul sito del Boogie Bistrot di Colle Brianza.',
}

export default function CookiePolicyPage() {
  return (
    <main>
      <section className="bg-surface-dark text-white py-20 px-6 md:px-14 min-h-[60vh]">
        <div className="max-w-3xl mx-auto">

          <nav className="flex items-center gap-2 mb-12" style={{ fontSize: 'var(--text-meta)' }}>
            <Link href="/" className="text-text-faint hover:text-white transition-colors">Home</Link>
            <span className="text-text-faint">/</span>
            <span className="text-text-muted">Cookie Policy</span>
          </nav>

          <h1 className="font-ivy font-normal text-white mb-10" style={{ fontSize: '2.5rem' }}>
            Cookie Policy
          </h1>

          <div className="space-y-10 text-text-muted leading-relaxed" style={{ fontSize: 'var(--text-body)' }}>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Cosa sono i cookie
              </h2>
              <p>
                I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo durante la navigazione. Servono a far funzionare il sito correttamente, a ricordare le tue preferenze e, dove previsto con il tuo consenso, a raccogliere dati statistici sull'utilizzo.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Cookie utilizzati su questo sito
              </h2>

              <div className="space-y-6">

                <div>
                  <h3 className="font-semibold text-white mb-2" style={{ fontSize: '1rem' }}>
                    Cookie tecnici (necessari)
                  </h3>
                  <p className="mb-3">
                    Indispensabili per il funzionamento del sito. Non richiedono il tuo consenso e non possono essere disabilitati.
                  </p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th className="text-left text-white py-2 pr-4 font-semibold">Nome</th>
                        <th className="text-left text-white py-2 pr-4 font-semibold">Scopo</th>
                        <th className="text-left text-white py-2 font-semibold">Durata</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="py-2 pr-4 text-white font-mono text-xs">cookie_consent</td>
                        <td className="py-2 pr-4">Memorizza le tue preferenze sui cookie</td>
                        <td className="py-2">12 mesi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2" style={{ fontSize: '1rem' }}>
                    Cookie analitici (con consenso)
                  </h3>
                  <p className="mb-3">
                    Utilizziamo <strong className="text-white">Umami</strong>, uno strumento di analisi rispettoso della privacy che non utilizza cookie di tracciamento e non raccoglie dati personali identificabili. Le statistiche di navigazione sono aggregate e anonime, conformi al GDPR senza necessità di consenso. Non viene salvato alcun cookie identificativo sul tuo dispositivo.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2" style={{ fontSize: '1rem' }}>
                    Cookie di terze parti
                  </h3>
                  <p className="mb-3">
                    Alcune funzionalità del sito si appoggiano a servizi esterni:
                  </p>
                  <ul className="space-y-3 pl-4" style={{ listStyle: 'disc' }}>
                    <li>
                      <strong className="text-white">Cloudinary</strong> — servizio di hosting immagini. Le immagini vengono caricate dai server Cloudinary; potrebbero essere impostati cookie tecnici per la gestione della CDN.
                    </li>
                    <li>
                      <strong className="text-white">Netlify</strong> — hosting del sito. Può impostare cookie tecnici per la gestione del traffico e la sicurezza.
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Come gestire i cookie
              </h2>
              <p className="mb-3">
                Puoi modificare le preferenze sui cookie in qualsiasi momento tramite le impostazioni del tuo browser. Di seguito i link alle guide dei browser più comuni:
              </p>
              <ul className="space-y-2 pl-4" style={{ listStyle: 'disc' }}>
                {[
                  { label: 'Google Chrome', href: 'https://support.google.com/chrome/answer/95647' },
                  { label: 'Mozilla Firefox', href: 'https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie' },
                  { label: 'Safari', href: 'https://support.apple.com/it-it/guide/safari/sfri11471/mac' },
                  { label: 'Microsoft Edge', href: 'https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
                ].map(b => (
                  <li key={b.label}>
                    <a href={b.href} target="_blank" rel="noopener noreferrer"
                      className="text-brand hover:text-brand-hover underline underline-offset-2">
                      {b.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                Tieni presente che disabilitare i cookie tecnici potrebbe compromettere il corretto funzionamento di alcune parti del sito.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Titolare del trattamento
              </h2>
              <p>
                Boogie Bistrot — Via Europa 2, Colle Brianza (LC)<br />
                Per informazioni: <a href="mailto:info@boogiebistrot.com" className="text-brand hover:text-brand-hover underline underline-offset-2">info@boogiebistrot.com</a>
              </p>
            </div>

            <div>
              <p>
                Per maggiori informazioni sul trattamento dei tuoi dati personali consulta la nostra{' '}
                <Link href="/privacy" className="text-brand hover:text-brand-hover underline underline-offset-2">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            <p className="text-text-faint" style={{ fontSize: 'var(--text-meta)' }}>
              Ultimo aggiornamento: aprile 2026
            </p>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
