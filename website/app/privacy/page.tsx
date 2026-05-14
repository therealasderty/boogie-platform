import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Privacy Policy | Boogie Bistrot',
  description: 'Informativa sulla privacy e sui cookie del sito Boogie Bistrot.',
}

export default function PrivacyPage() {
  return (
    <main>
      <section className="bg-surface-dark text-white py-20 px-6 md:px-14 min-h-[60vh]">
        <div className="max-w-3xl mx-auto">

          <nav className="flex items-center gap-2 mb-12" style={{ fontSize: 'var(--text-meta)' }}>
            <Link href="/" className="text-text-faint hover:text-white transition-colors">Home</Link>
            <span className="text-text-faint">/</span>
            <span className="text-text-muted">Privacy Policy</span>
          </nav>

          <h1 className="font-ivy font-normal text-white mb-10" style={{ fontSize: '2.5rem' }}>
            Privacy Policy
          </h1>

          <div className="space-y-10 text-text-muted leading-relaxed" style={{ fontSize: 'var(--text-body)' }}>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Titolare del trattamento
              </h2>
              <p>
                Boogie Bistrot — Colle Brianza (LC)<br />
                Per contatti: <a href="mailto:info@boogiebistrot.com" className="text-brand hover:text-brand-hover underline underline-offset-2">info@boogiebistrot.com</a>
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Dati raccolti
              </h2>
              <p className="mb-3">
                Raccogliamo i dati che ci fornisci volontariamente attraverso il modulo di prenotazione (nome, cognome, email, telefono, data e ora della prenotazione). Questi dati vengono utilizzati esclusivamente per gestire la prenotazione e comunicare con te in merito.
              </p>
              <p>
                Attraverso la navigazione sul sito, possono essere raccolti dati tecnici anonimi (indirizzo IP, tipo di browser, pagine visitate) a fini statistici, solo con il tuo consenso.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Cookie
              </h2>
              <p className="mb-3">Utilizziamo le seguenti categorie di cookie:</p>
              <ul className="space-y-3 pl-4" style={{ listStyle: 'disc' }}>
                <li>
                  <strong className="text-white">Necessari</strong> — indispensabili per il funzionamento del sito (es. preferenze cookie). Non richiedono consenso.
                </li>
                <li>
                  <strong className="text-white">Analitici</strong> — raccolgono informazioni anonime sull'utilizzo del sito per migliorare l'esperienza. Attivati solo con il tuo consenso.
                </li>
                <li>
                  <strong className="text-white">Marketing</strong> — utilizzati per mostrarti annunci pertinenti. Attivati solo con il tuo consenso.
                </li>
              </ul>
              <p className="mt-3">
                Puoi modificare le tue preferenze in qualsiasi momento cliccando su "Gestisci cookie" nel footer del sito.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Conservazione dei dati
              </h2>
              <p>
                I dati relativi alle prenotazioni sono conservati per il tempo necessario a gestire il rapporto contrattuale e per adempiere agli obblighi di legge. I dati di marketing vengono conservati fino alla revoca del consenso.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                I tuoi diritti
              </h2>
              <p>
                Hai il diritto di accedere, rettificare, cancellare i tuoi dati personali, opporti al trattamento e revocare il consenso in qualsiasi momento. Per esercitare questi diritti scrivici a{' '}
                <a href="mailto:info@boogiebistrot.com" className="text-brand hover:text-brand-hover underline underline-offset-2">info@boogiebistrot.com</a>.
              </p>
            </div>

            <div>
              <h2 className="font-raleway font-semibold text-white mb-3" style={{ fontSize: '1.25rem' }}>
                Terze parti
              </h2>
              <p>
                Il sito utilizza servizi di terze parti per la gestione delle prenotazioni e delle comunicazioni (Airtable, Brevo). Questi servizi trattano i dati nel rispetto del GDPR.
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
