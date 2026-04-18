import Image from 'next/image'
import Link from 'next/link'
import { fetchEventi } from '@/lib/agenda'

const MESI_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const GIORNI_LABEL = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function formatLabel(evento: { ricorrente: boolean; data: string | null; giornoSettimana: string; orario: string }): string {
  if (!evento.ricorrente && evento.data) {
    const d = new Date(evento.data + 'T00:00:00')
    return `${d.getDate()} ${MESI_SHORT[d.getMonth()]}`
  }
  if (evento.ricorrente && evento.giornoSettimana) {
    const giorni = evento.giornoSettimana.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
    if (giorni.length === 1) return `ogni ${GIORNI_LABEL[giorni[0]]}`
    if (giorni.length > 1) return `${GIORNI_LABEL[giorni[0]]}–${GIORNI_LABEL[giorni[giorni.length - 1]]}`
  }
  return 'Appuntamento fisso'
}

export default async function AltriAppuntamenti({ slugCorrente }: { slugCorrente: string }) {
  const tutti = await fetchEventi()
  const oggi = new Date().toISOString().split('T')[0]

  const visibili = tutti.filter(e =>
    e.stato === 'attivo' &&
    e.slug &&
    e.slug !== slugCorrente &&
    e.fotoHero &&
    (e.ricorrente || (e.data && e.data >= oggi))
  ).slice(0, 4)

  if (visibili.length === 0) return null

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
            Altri appuntamenti
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibili.map((e) => (
            <Link
              key={e.slug}
              href={`/eventi-speciali/${e.slug}`}
              className="group relative rounded-card overflow-hidden flex items-end"
              style={{ minHeight: '220px' }}
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                <Image src={e.fotoHero} alt={e.titolo} fill className="object-cover" sizes="25vw" />
              </div>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
              />
              <div className="relative z-10 p-5">
                <p className="font-semibold text-white leading-tight" style={{ fontSize: 'var(--text-lead)' }}>
                  {e.titolo}
                </p>
                <p className="text-white/60 font-light mt-1" style={{ fontSize: 'var(--text-label)' }}>
                  {formatLabel(e)}
                  {e.orario ? ` · ore ${e.orario}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
