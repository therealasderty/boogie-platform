import { fetchFaq } from '@/lib/faq'
import SezioneFAQAccordion from '@/components/SezioneFAQAccordion'

export default async function SezioneFAQ() {
  const faq = await fetchFaq()
  if (faq.length === 0) return null

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-14">
        <div className="flex flex-col md:flex-row md:gap-24">

          {/* Intestazione */}
          <div className="md:w-80 flex-shrink-0 mb-12 md:mb-0">
            <span
              className="uppercase text-white/30 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Domande frequenti
            </span>
            <h2
              className="font-semibold text-white leading-snug mt-4"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Tutto quello che vuoi sapere
            </h2>
            <p className="text-white/40 font-light mt-4 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              Non trovi risposta? Scrivici a{' '}
              <a href="mailto:info@boogiebistrot.com" className="text-white/60 hover:text-white transition-colors underline underline-offset-2">
                info@boogiebistrot.com
              </a>
            </p>
          </div>

          {/* Accordion */}
          <div className="flex-1">
            <SezioneFAQAccordion faq={faq} />
          </div>

        </div>
      </div>
    </section>
  )
}
