import Link from 'next/link'
import type { Metadata } from 'next'
import PaginaHero from '@/components/PaginaHero'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'
import FormEventoAziendale from '@/components/FormEventoAziendale'
import GrigliaFotoLocation from '@/components/GrigliaFotoLocation'
import SezioneVieni from '@/components/SezioneVieni'
import { vociMenuAziendale } from '@/lib/menu-aziendali'
import { fetchMedia } from '@/lib/media'


export const revalidate = 259200

export const metadata: Metadata = {
  title: 'Eventi Aziendali | Boogie Bistrot — Colle Brianza',
  description: 'Eventi aziendali al Boogie Bistrot di Colle Brianza (LC): sala riservata da 10 a 80 persone, giardino estivo, cucina del territorio rivisitata. Richiedi un preventivo.',
}

const PUNTI_FORZA = [
  {
    titolo: 'Sala riservata',
    testo: 'Spazi privati per il vostro gruppo, da 10 a 80 persone, per tutta la durata della serata.',
  },
  {
    titolo: 'Giardino estivo',
    testo: 'Da aprile a ottobre, il giardino ospita aperitivi e cene all\'aperto tra le colline brianzole.',
  },
  {
    titolo: 'Cucina del territorio',
    testo: 'Menu costruito insieme a voi: piatti brianzoli rivisitati, ingredienti di stagione, vini e birre artigianali locali.',
  },
  {
    titolo: 'Formule flessibili',
    testo: 'Cena, pranzo di lavoro, aperitivo, team building: adattiamo tempi e portate al tipo di evento.',
  },
]

export default async function EventiAziendaliPage() {
  const mediaLocation = await fetchMedia('location')
  const heroImage = 'https://pub-412a895afa8e491c84ad5df75bc1458b.r2.dev/media/1780389736209-media_1.1_TaY9KSJq6.jpg'

  return (
    <main>
      <PaginaHero
        titolo="Eventi Aziendali"
        sottotitolo="Boogie Bistrot"
        tagline="Cene aziendali e team building a Colle Brianza, da 10 a 80 persone"
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
              Eventi aziendali
            </span>
            <h2
              className="font-semibold text-neutral-900 mt-4 mb-6 leading-snug"
              style={{ fontSize: 'var(--text-section)' }}
            >
              Dal pranzo di lavoro<br className="hidden md:block" /> alla cena di Natale
            </h2>
            <div className="w-10 h-px bg-neutral-200 mb-6" />
            <p
              className="text-neutral-600 font-light leading-relaxed max-w-2xl"
              style={{ fontSize: 'var(--text-lead)' }}
            >
              Al Boogie Bistrot di Colle Brianza organizziamo eventi aziendali per gruppi
              da 10 a 80 persone: sala riservata, giardino nella bella stagione e cucina
              del territorio rivisitata. Costruiamo il menu insieme a voi.
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

      {/* ── Il menu ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-surface-dark">
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
                Il menu del vostro evento
              </h2>
              <div className="w-10 h-px bg-white/10 mb-6" />
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: 'var(--text-body)' }}
              >
                Lo chef parte dalla cucina del territorio rivisitata e adatta portate,
                tempi e abbinamenti al tipo di serata. Ingredienti di stagione,
                molti da produttori della Brianza.
              </p>
              <Link href="/cene-aziendali-natale#menu-aziendali" className="inline-block mt-4 text-brand underline underline-offset-4">
                Scoprite i tre menù aziendali più richiesti per Natale
              </Link>
            </FadeIn>

            <FadeIn delay={0.1}>
              <ul className="flex flex-col gap-4 mb-10">
                {vociMenuAziendale.map((voce) => (
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
                  Si parte dal dolce e si chiude con l&apos;antipasto. Un formato che sorprende
                  e funziona bene come icebreaker quando i colleghi non si conoscono tutti.
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
                I nostri spazi
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

      {/* ── Form richiesta evento ── */}
      <section className="py-20 md:py-28 px-6 md:px-14 bg-white">
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
            <div className="w-10 h-px bg-neutral-200 mb-8" />
          </FadeIn>
          <FadeIn delay={0.1}>
            <FormEventoAziendale />
          </FadeIn>
        </div>
      </section>

      <SezioneVieni />
      <Footer />
    </main>
  )
}
