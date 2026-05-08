import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormEventoAziendale from '@/components/FormEventoAziendale'
import GrigliaFotoLocation from '@/components/GrigliaFotoLocation'
import { fetchMedia } from '@/lib/media'

function shuffle<T>(arr: T[]): T[] {
  return [...arr]
}

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Eventi Aziendali | Boogie Bistrot — Colle Brianza',
  description: 'Organizza il tuo evento aziendale al Boogie Bistrot di Colle Brianza: sala esclusiva, ampio giardino, menu personalizzati e atmosfera unica nel cuore della Brianza.',
}

const PUNTI_FORZA = [
  {
    titolo: 'Sala esclusiva',
    testo: 'Spazi riservati per il vostro gruppo, con privacy e comfort per ogni tipo di incontro professionale.',
  },
  {
    titolo: 'Ampio giardino',
    testo: "Un'area verde che nella bella stagione diventa la cornice ideale per aperitivi e momenti di networking.",
  },
  {
    titolo: 'Location storica',
    testo: 'Un edificio dal fascino unico, circondato dalle colline brianzole, che unisce tradizione ed eleganza senza risultare austero.',
  },
  {
    titolo: 'Menu personalizzati',
    testo: 'Il nostro chef crea per voi un menu su misura, studiato nei minimi dettagli per soddisfare ogni esigenza.',
  },
]

const VOCI_MENU = [
  'Menu personalizzati e flessibili nel numero di portate',
  'Timing del servizio adattabile alle vostre esigenze',
  'Possibilità di menu tematici o concept originali',
  'Selezione di vini e birre artigianali brianzole abbinate ad ogni portata',
]

export default async function EventiAziendaliPage() {
  const mediaLocation = await fetchMedia('location')
  const fotoShuffled = shuffle(mediaLocation)
  const heroImage = fotoShuffled[0]?.url ?? '/images/hero/1.webp'

  return (
    <main>
      <PaginaHero
        titolo="Eventi Aziendali"
        sottotitolo="Boogie Bistrot"
        tagline="La location perfetta per il tuo evento aziendale nel cuore della Brianza"
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
              Una proposta su misura
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Un'esperienza memorabile<br className="hidden md:block" /> per ogni esigenza aziendale
            </h2>
            <div className="w-10 h-px bg-neutral-200 mb-6" />
            <p
              className="text-neutral-600 font-light leading-relaxed max-w-2xl"
              style={{ fontSize: 'var(--text-lead)' }}
            >
              Al Boogie Bistrot trasformiamo ogni evento aziendale in un momento da ricordare, dove il piacere della
              buona cucina del territorio si unisce all'atmosfera rilassata e accogliente dei nostri spazi — il
              contesto ideale per rafforzare i legami professionali in una location dal fascino unico.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
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

      {/* ── Esperienza gastronomica ── */}
      <section className="py-20 md:py-28 px-6 md:px-14" style={{ backgroundColor: '#1a1a1a' }}>
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
                Un'esperienza gastronomica personalizzata
              </h2>
              <div className="w-10 h-px bg-white/10 mb-6" />
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Il vero punto di forza degli eventi aziendali al Boogie Bistrot è la nostra cucina. Il nostro chef
                creerà per voi un menu su misura, con piatti del territorio rivisitati e ingredienti freschi
                selezionati — pensato nei minimi dettagli per soddisfare le vostre preferenze.
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
                  IL MENU AL CONTRARIO
                </p>
                <p
                  className="text-white/60 font-light leading-relaxed"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  Per chi cerca qualcosa di davvero originale: un'esperienza culinaria insolita che inverte
                  l'ordine tradizionale delle portate. Un modo divertente e diverso di vivere la cena aziendale,
                  perfetto per stimolare la conversazione e rompere il ghiaccio.
                </p>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── Griglia foto location ── */}
      {fotoShuffled.length > 0 && (
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
            <GrigliaFotoLocation foto={fotoShuffled} />
          </div>
        </section>
      )}

      {/* ── Form richiesta evento ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Consulenza personalizzata
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-2 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Parliamo del tuo evento
            </h2>
            <div className="w-10 h-px bg-neutral-200 mb-8" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <FormEventoAziendale />
          </FadeIn>
        </div>
      </section>

      <Footer />
    </main>
  )
}
