import Link from 'next/link'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pagina non trovata | Boogie Bistrot',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main>
      <section
        className="min-h-screen flex flex-col items-center justify-center px-6 text-white"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-6">
          <span
            className="uppercase text-white/30 font-medium"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            Errore 404
          </span>

          <h1
            className="font-ivy font-normal leading-tight text-white"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            Questa pagina non esiste
          </h1>

          <p
            className="text-white/50 font-light leading-relaxed"
            style={{ fontSize: 'var(--text-body)' }}
          >
            Forse l&apos;indirizzo è cambiato, o la pagina è stata rimossa.
            Nel dubbio, torna alla home — ti aspettiamo.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Link
              href="/"
              className="bg-brand hover:bg-brand-hover text-black font-semibold px-8 py-3.5 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Torna alla home
            </Link>
            <Link
              href="/prenota"
              className="border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium px-8 py-3.5 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Prenota un tavolo
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
