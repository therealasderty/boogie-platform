import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Prenotazione annullata | Boogie Bistrot',
  robots: { index: false, follow: false },
}

export default function PrenotazioneCancellataPage() {
  return (
    <main>
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-(--color-surface-warm)">
        <div className="max-w-lg w-full text-center">

          <p className="text-(--color-text-faint) text-[0.7rem] tracking-[0.12em] uppercase mb-6">
            Boogie Bistrot
          </p>

          <div className="w-14 h-14 rounded-full bg-(--color-brand)/20 flex items-center justify-center mx-auto mb-8 text-2xl">
            ✓
          </div>

          <h1 className="font-[family-name:var(--font-ivy)] text-[2rem] leading-tight text-gray-900 mb-4">
            Prenotazione annullata.
          </h1>

          <p className="text-[1rem] text-gray-600 leading-relaxed mb-2">
            Grazie per averci avvisato — ci aiuti a offrire il posto a chi è in lista d'attesa.
          </p>

          <p className="text-[1rem] text-gray-600 leading-relaxed mb-10">
            Ci spiace non averti qui stasera, ma speriamo di vederti presto.
          </p>

          <Link
            href="/prenota"
            className="inline-block bg-(--color-brand) hover:bg-(--color-brand-hover) text-gray-900 font-semibold px-8 py-3 rounded-[8px] text-[0.875rem] tracking-wide transition-colors"
          >
            Prenota per un'altra data
          </Link>

        </div>
      </section>

      <Footer />
    </main>
  )
}
