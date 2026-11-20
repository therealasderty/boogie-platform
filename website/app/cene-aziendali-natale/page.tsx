import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormEventoAziendale from '@/components/FormEventoAziendale'
import GrigliaFotoLocation from '@/components/GrigliaFotoLocation'
import SezioneVieni from '@/components/SezioneVieni'
import SezioneFAQAccordion from '@/components/SezioneFAQAccordion'
import { fetchMedia } from '@/lib/media'
import { MENU_NATALE } from '@/lib/menu-natale'
import type { FaqItem } from '@/lib/faq'

export const revalidate = 259200

export const metadata: Metadata = {
  title: 'Cena di Natale Aziendale in Brianza | Boogie Bistrot — Colle Brianza',
  description:
    'Cena di Natale aziendale al Boogie Bistrot di Colle Brianza: menù personalizzabili. Le proposte più richieste vanno da 45 a 60 € a persona. Sala privata, da 10 a 80 ospiti. Scarica i menù.',
  alternates: {
    canonical: 'https://boogiebistrot.com/cene-aziendali-natale',
  },
  openGraph: {
    title: 'Cena di Natale Aziendale in Brianza | Boogie Bistrot',
    description:
      'Cena di Natale aziendale al Boogie Bistrot di Colle Brianza: menù personalizzabili. Le proposte più richieste vanno da 45 a 60 € a persona. Sala privata, da 10 a 80 ospiti. Scarica i menù.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}

const PUNTI_FORZA = [
  {
    titolo: 'Sala riservata',
    testo: 'Spazi privati per il vostro gruppo, da 10 a 80 persone, per tutta la durata della serata.',
  },
  {
    titolo: 'Menù su misura',
    testo: 'Risotto alla zucca, brasato con polenta, tagliolini al ragù di cervo, polpo arrostito: da 45 a 60 € a persona.',
  },
  {
    titolo: 'Esigenze alimentari',
    testo: 'Prepariamo varianti vegetariane, vegane, per celiaci e per chi ha intolleranze alimentari.',
  },
]

const FAQ_NATALE: FaqItem[] = [
  {
    id: 'faq-natale-1',
    ordine: 1,
    attivo: true,
    domanda: 'Quante persone possono partecipare alla cena di Natale?',
    risposta:
      '<p>Ospitiamo gruppi da <strong>10 a 80 persone</strong>. Per gruppi più piccoli o più grandi scriveteci per verificare la disponibilità.</p>',
  },
  {
    id: 'faq-natale-2',
    ordine: 2,
    attivo: true,
    domanda: 'Quanto costa la cena di Natale aziendale a persona?',
    risposta:
      '<p>I quattro menù che trovate qui costano da <strong>45 a 60 € a persona</strong>. I primi tre includono acqua, vino (una bottiglia ogni tre persone) e caffè; il menù di pesce include acqua e caffè. Se preferite altre portate o avete in mente un altro prezzo, concordiamo insieme una proposta per il vostro gruppo.</p>',
  },
  {
    id: 'faq-natale-3',
    ordine: 3,
    attivo: true,
    domanda: 'Quando è meglio prenotare?',
    risposta:
      '<p>Le date di dicembre, in particolare i <strong>venerdì e sabato sera</strong>, si esauriscono rapidamente, spesso già da ottobre. Consigliamo di contattarci il prima possibile per verificare la disponibilità e bloccare la data.</p>',
  },
  {
    id: 'faq-natale-4',
    ordine: 4,
    attivo: true,
    domanda: 'Potete adattare il menù per chi ha esigenze alimentari?',
    risposta:
      '<p>Sì. Prepariamo <strong>varianti vegetariane, vegane e per celiaci</strong> e adattiamo i piatti a ogni tipo di intolleranza, anche al lattosio. Segnalateci eventuali intolleranze o allergie quando ci contattate, così concordiamo insieme le alternative. Nessun costo aggiuntivo.</p>',
  },
  {
    id: 'faq-natale-6',
    ordine: 6,
    attivo: true,
    domanda: 'È richiesto un acconto per confermare la prenotazione?',
    risposta:
      '<p>Sì, per bloccare la data è richiesto un <strong>acconto concordato</strong> al momento della conferma. I dettagli (importo e modalità) vengono definiti insieme in fase di preventivo.</p>',
  },
]

const heroImage = 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1791546070324-natale-boogie.avif'

const STAMPA_HREF = '/cene-aziendali-natale/stampa'

export default async function CeneAziendaliNatalePage() {
  const [mediaLocation, mediaNatale] = await Promise.all([
    fetchMedia('location'),
    fetchMedia('natale'),
  ])

  return (
    <main>
      <PaginaHero
        titolo="Cena di Natale Aziendale"
        sottotitolo="Boogie Bistrot · Colle Brianza"
        tagline="Festeggia con colleghi e collaboratori al Boogie di Colle Brianza"
        image={heroImage}
      />

      {/* ── Urgency strip ── */}
      <div className="bg-brand/15 border-b border-brand/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-neutral-700 font-medium text-center sm:text-left"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            Le date di dicembre si esauriscono in anticipo, soprattutto venerdì e sabato sera
          </p>
          <a
            href={STAMPA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-black text-white font-semibold px-6 py-2.5 rounded-btn hover:bg-neutral-800 transition-colors"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            Scarica i menù
          </a>
        </div>
      </div>

      {/* ── Intro + Punti di forza ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
            <FadeIn>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                Perché scegliere il Boogie
              </span>
              <h2
                className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Sala privata, da 10 a 80 persone,<br className="hidden md:block" /> a Colle Brianza
              </h2>
              <div className="w-10 h-px bg-neutral-200 mb-6" />
              <p
                className="text-neutral-600 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-lead)' }}
              >
                Al Boogie Bistrot di Colle Brianza organizziamo cene di Natale aziendali
                per gruppi da 10 a 80 persone, con una sala riservata. Scegliamo insieme a voi i piatti
                e il numero di portate in base al prezzo che avete in mente.
              </p>
            </FadeIn>

            {mediaNatale.length > 0 && (
              <FadeIn delay={0.15}>
                <div className="relative aspect-[4/3] rounded-card overflow-hidden">
                  <img
                    src={mediaNatale[0].url}
                    alt={mediaNatale[0].alt ?? 'Natale al Boogie Bistrot'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </FadeIn>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* ── Menu natalizi ── */}
      <section id="menu-aziendali" className="scroll-mt-20 py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-white/30 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Le proposte
            </span>
            <h2
              className="font-semibold text-white mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              I menù di Natale più richiesti
            </h2>
            <div className="w-10 h-px bg-white/10 mb-6" />
            <p
              className="text-white/60 font-light leading-relaxed max-w-2xl mb-14"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Questi quattro menù sono quelli che ci chiedete più spesso e che ci danno più
              soddisfazione in cucina. Abbiamo anche altre proposte, comprese le formule più
              tradizionali con antipasto, primo e secondo. Possiamo cambiare i piatti, il numero
              e l&apos;ordine delle portate e concordare con voi il prezzo a persona.
              Nei primi tre menù sono inclusi acqua, vino (una bottiglia ogni tre persone)
              e caffè. Nel menù di pesce sono inclusi acqua e caffè.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {MENU_NATALE.map((menu, i) => (
              <FadeIn key={menu.nome} delay={i * 0.1}>
                <div className="rounded-card border border-white/10 p-6 h-full flex flex-col">
                  <div className="flex items-baseline justify-between mb-6">
                    <h3
                      className="font-semibold text-white"
                      style={{ fontSize: 'var(--text-body)' }}
                    >
                      {menu.nome}
                    </h3>
                    <span className="text-brand font-semibold" style={{ fontSize: 'var(--text-lead)' }}>
                      {menu.prezzo}&thinsp;€
                    </span>
                  </div>
                  <div className="w-full h-px bg-white/10 mb-6" />
                  <div className="flex flex-col gap-5 flex-1">
                    {menu.portate.map((portata) => (
                      <div key={portata.tipo}>
                        <p
                          className="text-brand/70 font-medium uppercase mb-1.5"
                          style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                        >
                          {portata.tipo}
                        </p>
                        {portata.piatti.map((piatto) => (
                          <p
                            key={piatto}
                            className="text-white/60 font-light leading-relaxed"
                            style={{ fontSize: 'var(--text-meta)' }}
                          >
                            {piatto}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p
                    className="text-white/30 font-light mt-6 pt-5 border-t border-white/5"
                    style={{ fontSize: 'var(--text-label)' }}
                  >
                    a persona · {menu.bevande ?? 'bevande incluse'}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.35}>
            <div className="rounded-card border border-white/10 p-6 mt-8">
              <p
                className="text-brand font-medium mb-3"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                DA SAPERE PRIMA DI PRENOTARE
              </p>
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Per i bambini proponiamo un menù da <strong>25 €</strong>, da concordare prima della cena.
                Se nel gruppo ci sono persone vegetariane, vegane, celiache o con intolleranze alimentari,
                ditecelo alla prenotazione e sceglieremo insieme i piatti adatti.
                Anche i cani sono i benvenuti.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex justify-center mt-10">
              <a
                href={STAMPA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand text-black font-semibold px-8 py-3 rounded-btn hover:bg-brand-hover transition-colors"
                style={{ fontSize: 'var(--text-meta)' }}
              >
                Scarica i menù in PDF
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Come festeggiare ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <FadeIn>
              <span
                className="uppercase text-white/30 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                La formula
              </span>
              <h2
                className="font-semibold text-white mt-4 mb-6 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Cena, pranzo o aperitivo
              </h2>
              <div className="w-10 h-px bg-white/10 mb-6" />
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Per gli auguri con i colleghi potete scegliere una cena servita al tavolo,
                un pranzo di fine anno o un aperitivo con stuzzichini.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Cena', desc: 'Menù concordato insieme, con servizio al tavolo per gruppi da 10 a 80 persone.' },
                  { label: 'Pranzo', desc: 'Stessi menu della cena, per chi preferisce festeggiare di giorno.' },
                  { label: 'Aperitivo', desc: 'Formula più informale con stuzzichini, adatta a grandi gruppi.' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-5 rounded-card border border-white/10 p-5">
                    <span
                      className="flex-shrink-0 text-brand font-semibold"
                      style={{ fontSize: 'var(--text-body)', minWidth: '72px' }}
                    >
                      {item.label}
                    </span>
                    <p
                      className="text-white/50 font-light leading-relaxed"
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
                <p
                  className="text-white/30 font-light mt-2"
                  style={{ fontSize: 'var(--text-meta)' }}
                >
                  Per dettagli su data, orario e personalizzazioni, compilate il form qui sotto.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Foto background fixed ── */}
      <div
        className="relative min-h-[420px] md:min-h-[520px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <div className="relative z-10 text-center px-6">
          <a
            href={STAMPA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/60 text-white hover:bg-white hover:text-black font-semibold px-8 py-3 rounded-btn transition-colors"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            Scarica i menù
          </a>
        </div>
      </div>

      {/* ── Griglia foto location (senza giardino) ── */}
      {(() => {
        const fotoInterni = mediaLocation.filter(m => !m.tag.includes('giardino'))
        return fotoInterni.length > 0 && (
          <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
            <div className="max-w-6xl mx-auto">
              <FadeIn>
                <span
                  className="uppercase text-black/40 font-medium"
                  style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                >
                  I nostri spazi
                </span>
                <h2
                  className="font-semibold text-neutral-900 mt-4 mb-10 leading-snug"
                  style={{ fontSize: 'var(--text-section)' }}
                >
                  Gli spazi del Boogie Bistrot
                </h2>
              </FadeIn>
              <GrigliaFotoLocation foto={fotoInterni} />
            </div>
          </section>
        )
      })()}

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-white/30 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Domande frequenti
            </span>
            <h2
              className="font-semibold text-white mt-4 mb-10 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Domande sulla cena di Natale aziendale
            </h2>
          </FadeIn>
          <SezioneFAQAccordion faq={FAQ_NATALE} />
        </div>
      </section>

      {/* ── Form richiesta preventivo ── */}
      <section id="richiedi-preventivo" className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Preventivo gratuito
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-2 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Richiedi il preventivo
            </h2>
            <p
              className="text-neutral-500 font-light mt-3 mb-8"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Rispondiamo entro 24 ore con disponibilità, menu indicativo e preventivo senza impegno.
            </p>
            <div className="w-10 h-px bg-neutral-200 mb-8" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <FormEventoAziendale defaultTipoEvento="Cena di Natale" />
          </FadeIn>
        </div>
      </section>

      <SezioneVieni />
      <Footer
        linkOverrides={{ 'Prenota un tavolo': { label: 'Scarica i menù', href: '/cene-aziendali-natale/stampa', target: '_blank' } }}
      />
    </main>
  )
}
