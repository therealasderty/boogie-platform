import type { Metadata } from 'next'
import BlocchiRenderer from '@/components/BlocchiRenderer'
import type { BloccoMenu } from '@/lib/agenda'
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
  title: 'Cenone di Capodanno 2026 | Boogie Bistrot — Colle Brianza — 70 €',
  description:
    'Cenone di Capodanno 2026 al Boogie Bistrot di Colle Brianza: 70 € a persona con 6 antipasti, bis di primi, secondo di pesce, dolce, prosecco al brindisi e musica dal vivo.',
  alternates: {
    canonical: 'https://boogiebistrot.com/capodanno',
  },
  openGraph: {
    title: 'Capodanno 2026 al Boogie Bistrot | Colle Brianza',
    description:
      'Cenone di Capodanno 2026 al Boogie Bistrot di Colle Brianza: 70 € a persona con 6 antipasti, bis di primi, secondo di pesce, dolce, prosecco al brindisi e musica dal vivo.',
    locale: 'it_IT',
    siteName: 'Boogie Bistrot',
  },
}

const MENU_CAPODANNO: BloccoMenu = {
  id: 'menu-capodanno-2026',
  tipo: 'menu',
  titolo: 'Menu di Capodanno',
  importo: '70 € a persona',
  notePrezzo: ['Acqua, vino (bianco o rosso, una bottiglia ogni 3 persone) e caffè inclusi', 'Musica dal vivo'],
  sezioni: [
    {
      titolo: 'Benvenuto',
      voci: [
        { nome: 'Focacce miste di benvenuto con prosecco' },
      ],
    },
    {
      titolo: 'Antipasti',
      voci: [
        { nome: 'Cotechino della tradizione su spuma di lenticchie e julienne di patate croccanti' },
        { nome: 'Crostino dorato di polenta con baccalà mantecato con olio di cottura' },
        { nome: 'Flan di broccoli e gamberi su insalatina di seppia e mousse di caprino erborinato' },
        { nome: 'Dadolata di polpo verace su vellutata di patate allo zafferano e polvere di olive taggiasche' },
        { nome: 'Frittelline di cavolfiore con lardo di colonnata e miele alle castagne' },
        { nome: 'Cuscinetto di pasta lievitata e fritta ripieno di crema di ricotta e salame nostrano' },
      ],
    },
    {
      titolo: 'Primi',
      voci: [
        { nome: 'Calamarata con rana pescatrice, datterini e crumble al limone' },
        { nome: 'Scrigni ripieni di funghi e taleggio e besciamella al tartufo' },
      ],
    },
    {
      titolo: 'Secondo',
      voci: [
        { nome: 'Filetti di branzino in crosta di patate con panure di pomodorini secchi e cavolo ripassato leggermente piccante e bastoncini di zucca' },
      ],
    },
    {
      titolo: 'Dolce',
      voci: [
        { nome: 'Moussecake cioccolato fondente, arance e cannella' },
      ],
    },
    {
      titolo: 'Brindisi',
      voci: [
        { nome: 'Prosecco al brindisi di mezzanotte' },
      ],
    },
  ],
}

const FAQ_CAPODANNO: FaqItem[] = [
  {
    id: 'faq-cap-1',
    ordine: 1,
    attivo: true,
    domanda: 'Quanto costa il cenone di Capodanno?',
    risposta:
      '<p><strong>70 € a persona</strong>, tutto incluso: 6 antipasti, bis di primi, secondo di pesce, dolce, prosecco al brindisi, acqua, vino (una bottiglia ogni 3 persone), caffè e musica dal vivo.</p>',
  },
  {
    id: 'faq-cap-2',
    ordine: 2,
    attivo: true,
    domanda: 'Come posso prenotare?',
    risposta:
      '<p>Compilate il form in fondo alla pagina o chiamateci al <strong>039 9260568</strong>. I posti sono limitati, consigliamo di prenotare il prima possibile.</p>',
  },
  {
    id: 'faq-cap-3',
    ordine: 3,
    attivo: true,
    domanda: 'È richiesto un acconto?',
    risposta:
      '<p>Sì, per confermare la prenotazione è richiesto un <strong>acconto concordato</strong>. Importo e modalità vengono definiti al momento della prenotazione.</p>',
  },
  {
    id: 'faq-cap-4',
    ordine: 4,
    attivo: true,
    domanda: 'Ci sono opzioni per allergie o intolleranze?',
    risposta:
      '<p>Sì. Prepariamo <strong>varianti senza glutine e senza lattosio</strong>. Segnalateci le vostre esigenze al momento della prenotazione.</p>',
  },
  {
    id: 'faq-cap-5',
    ordine: 5,
    attivo: true,
    domanda: 'A che ora inizia la serata?',
    risposta:
      '<p>L\'accoglienza con focacce e prosecco inizia intorno alle <strong>20:30</strong>. La serata prosegue con cena, musica dal vivo e brindisi di mezzanotte.</p>',
  },
]

const heroImage = 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1791546070324-natale-boogie.avif'

export default async function CapodannoPage() {
  const [mediaLocation, mediaNatale] = await Promise.all([
    fetchMedia('location'),
    fetchMedia('natale'),
  ])

  return (
    <main>
      <PaginaHero
        titolo="Capodanno 2026"
        sottotitolo="Boogie Bistrot · Colle Brianza"
        tagline="Cenone con musica dal vivo — 70 € a persona, tutto incluso"
        image={heroImage}
      />

      {/* ── Intro ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span
                className="uppercase text-black/40 font-medium"
                style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
              >
                31 dicembre 2026
              </span>
              <h2
                className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
                style={{ fontSize: 'var(--text-section)' }}
              >
                Capodanno al Boogie Bistrot
              </h2>
              <div className="w-10 h-px bg-neutral-200 mb-6" />
              <p
                className="text-neutral-600 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-lead)' }}
              >
                Cenone di Capodanno con 6 antipasti, bis di primi, secondo di pesce,
                dolce e prosecco al brindisi di mezzanotte. Musica dal vivo per tutta la serata.
                70 € a persona, bevande incluse.
              </p>
            </FadeIn>

            {mediaNatale.length > 0 && (
              <FadeIn delay={0.15}>
                <div className="relative aspect-[4/3] rounded-card overflow-hidden">
                  <img
                    src={mediaNatale[0].url}
                    alt={mediaNatale[0].alt ?? 'Capodanno al Boogie Bistrot'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      <div className="pt-14 pb-4 px-6 md:px-14 bg-neutral-100">
        <div className="max-w-3xl mx-auto">
          <BlocchiRenderer blocchi={[MENU_CAPODANNO]} />
        </div>
      </div>

      {/* ── Foto location ── */}
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
              Domande sul cenone di Capodanno
            </h2>
          </FadeIn>
          <SezioneFAQAccordion faq={FAQ_CAPODANNO} />
        </div>
      </section>

      {/* ── Form prenotazione ── */}
      <section id="prenota-capodanno" className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Prenota
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-2 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Prenota il cenone di Capodanno
            </h2>
            <p
              className="text-neutral-500 font-light mt-3 mb-8"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Posti limitati. Rispondiamo entro 24 ore per confermare la disponibilità.
            </p>
            <div className="w-10 h-px bg-neutral-200 mb-8" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <FormEventoAziendale defaultTipoEvento="Cenone di Capodanno" />
          </FadeIn>
        </div>
      </section>

      <SezioneVieni />
      <Footer />
    </main>
  )
}
