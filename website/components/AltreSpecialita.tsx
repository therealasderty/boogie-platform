import Image from 'next/image'
import Link from 'next/link'
import { fetchMedia } from '@/lib/media'

const SPECIALITA = [
  { titolo: 'Pizza',    descrizione: 'Impasto a lunga lievitazione, forno a legna',      href: '/menu/pizza',     tag: 'pizza',     fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif' },
  { titolo: 'Cocktail', descrizione: 'Aperitivi e signature drink',                       href: '/menu/cocktails', tag: 'cocktail', fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif' },
  { titolo: 'Birre',    descrizione: 'Selezione di birre locali alla spina e in bottiglia', href: '/menu/birre',   tag: 'birra',     fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif' },
  { titolo: 'Vini',     descrizione: 'Carta dei vini con etichette locali e nazionali',   href: '/menu/vini',      tag: 'vino',      fallback: '/images/hero/giardino-boogie-bistrot-colle-brianza.avif' },
]

export default async function AltreSpecialita({ escludi }: { escludi?: string }) {
  const visibili = SPECIALITA.filter((s) => s.href !== escludi)

  const immagini = await Promise.all(
    visibili.map(async (s) => {
      const media = await fetchMedia(s.tag)
      const foto = media.length > 0 ? media[0] : null
      return { ...s, image: foto ? foto.url : s.fallback, alt: foto?.alt || s.titolo }
    })
  )
  return (
    <section className="py-20 md:py-28 bg-surface-warm">
      <div className="max-w-7xl mx-auto px-6 md:px-14">

        <div className="mb-12">
          <span
            className="uppercase text-black/40 font-medium"
            style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
          >
            Scopri anche
          </span>
          <h2
            className="font-semibold text-neutral-900 leading-snug mt-4"
            style={{ fontSize: 'var(--text-section)' }}
          >
            Altre specialità
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {immagini.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative rounded-card overflow-hidden flex items-end"
              style={{ minHeight: '220px' }}
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                <Image src={s.image} alt={s.alt} fill className="object-cover" sizes="25vw" />
              </div>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
              />
              <div className="relative z-10 p-5">
                <p className="font-semibold text-white leading-tight" style={{ fontSize: 'var(--text-lead)' }}>
                  {s.titolo}
                </p>
                <p className="text-white/60 font-light mt-1" style={{ fontSize: 'var(--text-label)' }}>
                  {s.descrizione}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
