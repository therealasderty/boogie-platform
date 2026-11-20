import type { Metadata } from 'next'
import Link from 'next/link'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormEventoAziendale from '@/components/FormEventoAziendale'
import GrigliaFotoLocation from '@/components/GrigliaFotoLocation'
import SezioneVieni from '@/components/SezioneVieni'
import SezioneFAQAccordion from '@/components/SezioneFAQAccordion'
import { fetchMedia } from '@/lib/media'
import { MENU_CERIMONIE, ALTERNATIVE_CERIMONIE } from '@/lib/menu-cerimonie'
import type { FaqItem } from '@/lib/faq'

export const revalidate = 259200

const STAMPA_HREF = '/comunioni-e-cresime/stampa'

export const metadata: Metadata = {
  title: 'Comunioni e Cresime al Boogie Bistrot | Colle Brianza — Menu da 45 €',
  description:
    'Pranzi per comunioni e cresime al Boogie Bistrot di Colle Brianza. Menù di carne a 45 € o di pesce a 50 € a persona, con torta inclusa, sala riservata e giardino.',
  alternates: {
    canonical: 'https://boogiebistrot.com/comunioni-e-cresime',
  },
  openGraph: {
    title: 'Comunioni e Cresime al Boogie Bistrot | Colle Brianza',
    description:
      'Pranzi per comunioni e cresime al Boogie Bistrot di Colle Brianza. Menù di carne a 45 € o di pesce a 50 € a persona, con torta inclusa, sala riservata e giardino.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
    images: [{ url: 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1780389736209-media_1.1_TaY9KSJq6.jpg' }],
  },
}

const PUNTI_FORZA = [
  {
    titolo: 'Sala riservata',
    testo: 'Spazi privati per il vostro gruppo, da 20 a 80 ospiti, per tutta la durata del pranzo.',
  },
  {
    titolo: 'Giardino',
    testo: 'Un\'area verde dove i bambini possono giocare e gli adulti godersi il dopo-pranzo all\'aperto.',
  },
  {
    titolo: 'Torta cerimonia inclusa',
    testo: 'Pan di Spagna con crema pasticcera e scaglie di cioccolato, compresa nel prezzo del menu.',
  },
]


const FAQ_CERIMONIE: FaqItem[] = [
  {
    id: 'faq-com-1',
    ordine: 1,
    attivo: true,
    domanda: 'Quante persone possono partecipare?',
    risposta:
      '<p>Ospitiamo gruppi da <strong>20 a 80 persone</strong>. Per numeri diversi contattateci e troviamo la soluzione adatta.</p>',
  },
  {
    id: 'faq-com-2',
    ordine: 2,
    attivo: true,
    domanda: 'Quanto costa a persona il pranzo per una comunione o una cresima?',
    risposta:
      '<p>Proponiamo due menu: <strong>carne a 45 € e pesce a 50 € a persona</strong>, bevande incluse (acqua, vino e caffè) e torta cerimonia. I primi e i secondi si possono personalizzare con le alternative disponibili.</p>',
  },
  {
    id: 'faq-com-3',
    ordine: 3,
    attivo: true,
    domanda: 'C\'è un menu ridotto per i bambini?',
    risposta:
      '<p>Sì, prevediamo un <strong>menu bambini a prezzo ridotto</strong>. Segnalateci il numero e l\'età dei bambini al momento della prenotazione.</p>',
  },
  {
    id: 'faq-com-4',
    ordine: 4,
    attivo: true,
    domanda: 'Posso personalizzare il menu?',
    risposta:
      '<p>Sì. Oltre ai due menu base, abbiamo una lista di <strong>primi e secondi alternativi</strong> (terra e mare) tra cui scegliere. Segnalate anche eventuali allergie o intolleranze.</p>',
  },
  {
    id: 'faq-com-5',
    ordine: 5,
    attivo: true,
    domanda: 'È richiesto un acconto?',
    risposta:
      '<p>Sì, per bloccare la data è richiesto un <strong>acconto concordato</strong> al momento della conferma. Importo e modalità vengono definiti insieme in fase di preventivo.</p>',
  },
  {
    id: 'faq-com-6',
    ordine: 6,
    attivo: true,
    domanda: 'Il giardino è disponibile?',
    risposta:
      '<p>Sì, da <strong>aprile a ottobre</strong> il giardino è a disposizione del vostro gruppo. Ideale per il dopo-pranzo, soprattutto con i bambini.</p>',
  },
]

const heroImage = 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1780389736209-media_1.1_TaY9KSJq6.jpg'

export default async function ComunioniECresimePage() {
  const mediaLocation = await fetchMedia('location')

  return (
    <main>
      <PaginaHero
        titolo="Comunioni e Cresime"
        sottotitolo="Boogie Bistrot · Colle Brianza"
        tagline="Una sala riservata e un giardino per il vostro pranzo in famiglia"
        image={heroImage}
      />

      {/* ── Intro + Punti di forza ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Cerimonie
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Il pranzo per la prima comunione o la cresima
            </h2>
            <div className="w-10 h-px bg-neutral-200 mb-6" />
            <p
              className="text-neutral-600 font-light leading-relaxed max-w-2xl"
              style={{ fontSize: 'var(--text-lead)' }}
            >
              Due menu a partire da 45 euro a persona, con tris di antipasti impiattati,
              centro tavola a scelta, primo o bis di primi, torta cerimonia e bevande incluse.
              Sala riservata e giardino per il vostro gruppo.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {PUNTI_FORZA.map((punto, i) => (
              <FadeIn key={punto.titolo} delay={i * 0.08}>
                <div className="rounded-card border border-neutral-100 p-6 h-full">
                  <div className="w-8 h-px bg-brand mb-5" />
                  <h3
                    className="font-semibold text-neutral-900 mb-2"
                    style={{ fontSize: 'var(--text-body)' }}
                  >
                    {punto.titolo}
                  </h3>
                  <p
                    className="text-neutral-500 font-light leading-relaxed"
                    style={{ fontSize: 'var(--text-meta)' }}
                  >
                    {punto.testo}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Griglia foto location ── */}
      {mediaLocation.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <span
                className="uppercase text-white/30 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                I nostri spazi
              </span>
              <h2
                className="font-semibold text-white mt-4 mb-10 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Gli spazi del Boogie Bistrot
              </h2>
            </FadeIn>
            <GrigliaFotoLocation foto={mediaLocation} />
          </div>
        </section>
      )}

      {/* ── Menu cerimonie ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Le proposte
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              I menù per comunioni e cresime
            </h2>
            <div className="w-10 h-px bg-neutral-200 mb-6" />
            <p
              className="text-neutral-600 font-light leading-relaxed max-w-2xl mb-14"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Ogni menu comprende tris di antipasti impiattati, un piatto al centro tavola a scelta,
              primo o bis di primi, torta cerimonia, acqua, vino (una bottiglia ogni 3 persone) e caffè.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {MENU_CERIMONIE.map((menu, i) => (
              <FadeIn key={menu.nome} delay={i * 0.1}>
                <div className="rounded-card border border-neutral-100 p-6 h-full flex flex-col">
                  <div className="flex items-baseline justify-between mb-6">
                    <h3
                      className="font-semibold text-neutral-900"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      {menu.nome}
                    </h3>
                    <span className="text-brand font-semibold" style={{ fontSize: 'var(--text-lead)' }}>
                      {menu.prezzo}&thinsp;€
                    </span>
                  </div>
                  <div className="w-full h-px bg-neutral-100 mb-6" />

                  <div className="flex flex-col gap-5 flex-1">
                    {menu.portate.map((portata) => (
                      <div key={portata.tipo}>
                        <p
                          className="text-black/40 font-medium uppercase mb-1.5"
                          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                        >
                          {portata.tipo}
                        </p>
                        {portata.piatti.map((piatto) => (
                          <p key={piatto} className="text-neutral-600 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                            {piatto}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>

                  <p
                    className="text-neutral-400 font-light mt-6 pt-5 border-t border-neutral-100"
                    style={{ fontSize: 'var(--text-label)' }}
                  >
                    a persona · bevande e torta incluse
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="flex justify-center mt-10">
              <Link
                href={STAMPA_HREF}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-btn bg-brand px-7 py-3.5 font-medium text-surface-dark transition-colors hover:bg-brand-hover"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Scarica i menù in PDF
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Alternative ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-white/30 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Personalizzazione
            </span>
            <h2
              className="font-semibold text-white mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Primi e secondi alternativi
            </h2>
            <div className="w-10 h-px bg-white/10 mb-6" />
            <p
              className="text-white/60 font-light leading-relaxed max-w-2xl mb-14"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Potete sostituire i primi e i secondi dei menu base con queste alternative.
              Segnalateci le vostre preferenze al momento della prenotazione.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn>
              <div className="rounded-card border border-white/10 p-6">
                <h3 className="text-brand font-medium uppercase mb-5" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Primi terra
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {ALTERNATIVE_CERIMONIE.primiTerra.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/60 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="rounded-card border border-white/10 p-6">
                <h3 className="text-brand font-medium uppercase mb-5" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Primi mare
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {ALTERNATIVE_CERIMONIE.primiMare.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/60 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="rounded-card border border-white/10 p-6">
                <h3 className="text-brand font-medium uppercase mb-5" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Secondi terra
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {ALTERNATIVE_CERIMONIE.secondiTerra.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/60 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="rounded-card border border-white/10 p-6">
                <h3 className="text-brand font-medium uppercase mb-5" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                  Secondi mare
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {ALTERNATIVE_CERIMONIE.secondiMare.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-white/60 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Domande frequenti
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-10 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Domande sul pranzo di comunione o cresima
            </h2>
          </FadeIn>
          <SezioneFAQAccordion faq={FAQ_CERIMONIE} />
        </div>
      </section>

      {/* ── Form richiesta preventivo ── */}
      <section id="richiedi-preventivo" className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-white/30 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Preventivo gratuito
            </span>
            <h2
              className="font-semibold text-white mt-4 mb-2 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Richiedi il preventivo
            </h2>
            <p
              className="text-white/60 font-light mt-3 mb-8"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Rispondiamo entro 24 ore con disponibilità, menu e preventivo senza impegno.
            </p>
            <div className="w-10 h-px bg-white/10 mb-8" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <FormEventoAziendale cerimonia />
          </FadeIn>
        </div>
      </section>

      <SezioneVieni />
      <Footer linkOverrides={{ 'Prenota un tavolo': { label: 'Scarica i menù', href: STAMPA_HREF, target: '_blank' } }} />
    </main>
  )
}
