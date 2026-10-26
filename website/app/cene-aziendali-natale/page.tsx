import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormEventoAziendale from '@/components/FormEventoAziendale'
import GrigliaFotoLocation from '@/components/GrigliaFotoLocation'
import SezioneVieni from '@/components/SezioneVieni'
import SezioneFAQAccordion from '@/components/SezioneFAQAccordion'
import { fetchMedia } from '@/lib/media'
import type { FaqItem } from '@/lib/faq'

export const revalidate = 259200

export const metadata: Metadata = {
  title: 'Cena di Natale Aziendale in Brianza | Boogie Bistrot — Colle Brianza',
  description:
    'Organizza la cena di Natale aziendale al Boogie Bistrot di Colle Brianza: sala privata, menu natalizio su misura, da 10 a 80 ospiti. Richiedi il preventivo.',
  alternates: {
    canonical: 'https://boogiebistrot.com/cene-aziendali-natale',
  },
  openGraph: {
    title: 'Cena di Natale Aziendale in Brianza | Boogie Bistrot',
    description:
      'Organizza la cena di Natale aziendale al Boogie Bistrot di Colle Brianza: sala privata, menu natalizio su misura, da 10 a 80 ospiti. Richiedi il preventivo.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}

const PUNTI_FORZA = [
  {
    titolo: 'Atmosfera natalizia',
    testo: 'Ambienti caldi e accoglienti, pensati per rendere la serata degli auguri un momento speciale per tutto il team.',
  },
  {
    titolo: 'Sala privata',
    testo: 'Spazi riservati per gruppi da 10 a 80 persone, con privacy e comfort per l\'intera durata della serata.',
  },
  {
    titolo: 'Cucina del territorio',
    testo: 'Menu natalizi con ingredienti di stagione selezionati e preparati dal nostro chef.',
  },
]

const VOCI_MENU = [
  'Antipasti della casa',
  'Primo di stagione — risotto, pasta fresca o gnocchi',
  'Secondo con contorno (carne, pesce o entrambi)',
  'Dessert natalizio della casa',
  'Selezione di vini e birre artigianali locali in abbinamento',
  'Menu vegetariano e opzioni senza glutine su richiesta',
]


const FAQ_NATALE: FaqItem[] = [
  {
    id: 'faq-natale-1',
    ordine: 1,
    attivo: true,
    domanda: 'Quante persone possono partecipare alla cena di Natale?',
    risposta:
      '<p>Ospitiamo gruppi da <strong>10 a 80 persone</strong>. Per gruppi più piccoli o più grandi valutate insieme a noi la soluzione migliore — scriveteci e troviamo la formula adatta.</p>',
  },
  {
    id: 'faq-natale-2',
    ordine: 2,
    attivo: true,
    domanda: 'Quanto costa la cena di Natale aziendale a persona?',
    risposta:
      '<p>Il prezzo dipende dal menu scelto, dal numero di ospiti e dalla formula (cena completa, apericena o pranzo). Forniamo un <strong>preventivo personalizzato</strong> entro 24 ore dalla richiesta. Compilate il form e vi ricontattiamo.</p>',
  },
  {
    id: 'faq-natale-3',
    ordine: 3,
    attivo: true,
    domanda: 'Quando è meglio prenotare?',
    risposta:
      '<p>Le date di dicembre — in particolare i <strong>venerdì e sabato sera</strong> — si esauriscono rapidamente, spesso già da ottobre. Consigliamo di contattarci il prima possibile per verificare la disponibilità e bloccare la data.</p>',
  },
  {
    id: 'faq-natale-4',
    ordine: 4,
    attivo: true,
    domanda: 'Posso avere un menu per celiaci, vegetariani o con allergie?',
    risposta:
      '<p>Sì. Il nostro chef prepara varianti per ogni esigenza: <strong>menu vegetariano, opzioni senza glutine e adattamenti per le allergie</strong> più comuni. Segnalate le necessità al momento della prenotazione e provvederemo senza costi aggiuntivi.</p>',
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
            Le date di dicembre si esauriscono in anticipo — soprattutto venerdì e sabato sera
          </p>
          <a
            href="#richiedi-preventivo"
            className="flex-shrink-0 bg-black text-white font-semibold px-6 py-2.5 rounded-btn hover:bg-neutral-800 transition-colors"
            style={{ fontSize: 'var(--text-meta)' }}
          >
            Richiedi preventivo
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
                Un Natale aziendale<br className="hidden md:block" /> che lascia il segno
              </h2>
              <div className="w-10 h-px bg-neutral-200 mb-6" />
              <p
                className="text-neutral-600 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-lead)' }}
              >
                Al Boogie Bistrot di Colle Brianza organizziamo cene di Natale aziendali su misura,
                dalla piccola squadra al gruppo numeroso. Cucina del territorio, atmosfera autentica e
                spazi riservati: tutto quello che serve per festeggiare insieme in modo memorabile.
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

      {/* ── Come festeggiare ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
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
                Come vorresti festeggiare?
              </h2>
              <div className="w-10 h-px bg-white/10 mb-6" />
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Che si tratti di una cena completa, di un pranzo di fine anno o di un aperitivo
                con stuzzichini — siamo qui per trovare insieme la formula più adatta al vostro
                gruppo e al vostro budget. Nessun pacchetto fisso: partiamo dalle vostre esigenze
                e costruiamo la serata su misura.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Cena', desc: 'Il classico per eccellenza, con menu completo e servizio al tavolo.' },
                  { label: 'Pranzo', desc: 'Per chi preferisce festeggiare di giorno, con tempi rispettati.' },
                  { label: 'Aperitivo', desc: 'Un format più informale, perfetto per grandi gruppi o un primo incontro.' },
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
                  Contattaci e definiamo insieme tutto il resto.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Foto background fixed ── */}
      {(
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
              href="#richiedi-preventivo"
              className="inline-flex items-center gap-2 border border-white/60 text-white hover:bg-white hover:text-black font-semibold px-8 py-3 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Richiedi il preventivo
            </a>
          </div>
        </div>
      )}

      {/* ── Menu natalizio ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

            <FadeIn>
              <span
                className="uppercase text-white/30 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                La cucina
              </span>
              <h2
                className="font-semibold text-white mt-4 mb-6 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Menu natalizio su misura
              </h2>
              <div className="w-10 h-px bg-white/10 mb-6" />
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Il nostro chef compone un menu natalizio ad hoc per la vostra azienda, con i
                sapori del territorio brianzolo rivisitati in chiave moderna. Ingredienti di
                stagione, presentazioni curate e un servizio attento ai dettagli.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <ul className="flex flex-col gap-4 mb-10">
                {VOCI_MENU.map((voce) => (
                  <li
                    key={voce}
                    className="flex items-start gap-3 text-white/70 font-light"
                    style={{ fontSize: 'var(--text-body)' }}
                  >
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                    {voce}
                  </li>
                ))}
              </ul>

              <div className="rounded-card border border-white/10 p-6">
                <p
                  className="text-brand font-medium mb-3"
                  style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
                >
                  ESIGENZE ALIMENTARI
                </p>
                <p
                  className="text-white/60 font-light leading-relaxed"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  Segnalate intolleranze, allergie o preferenze alimentari al momento della
                  prenotazione. Prepariamo varianti personalizzate per ogni commensale, senza
                  costi aggiuntivi.
                </p>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── Griglia foto location ── */}
      {mediaLocation.length > 0 && (
        <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                La location
              </span>
              <h2
                className="font-semibold text-neutral-900 mt-4 mb-10 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Gli spazi del Boogie Bistrot
              </h2>
            </FadeIn>
            <GrigliaFotoLocation foto={mediaLocation} />
          </div>
        </section>
      )}

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
              Tutto quello che vuoi sapere
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
              Consulenza gratuita
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
      <Footer />
    </main>
  )
}
