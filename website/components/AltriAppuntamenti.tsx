import Image from 'next/image'
import Link from 'next/link'
import { fetchEventi, formatBadgeRicorrente } from '@/lib/agenda'
import { fetchOrari, fetchChiusure } from '@/lib/orari'

const MESI_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function formatLabel(evento: { ricorrente: boolean; data: string | null; ricorrenza: string; giornoSettimana: string; giorniEsclusione: string; orario: string; orarioFine: string }, giorniChiusi: number[]): string {
  if (evento.ricorrente) {
    return formatBadgeRicorrente(evento, giorniChiusi)
  }
  if (evento.data) {
    const d = new Date(evento.data + 'T00:00:00')
    const data = `${d.getDate()} ${MESI_SHORT[d.getMonth()]}`
    return evento.orario ? `${data} · ore ${evento.orario}` : data
  }
  return ''
}

export default async function AltriAppuntamenti({ slugCorrente }: { slugCorrente: string }) {
  const [tutti, orari, chiusure] = await Promise.all([fetchEventi(), fetchOrari(), fetchChiusure()])
  const oggi = new Date().toISOString().split('T')[0]

  const giorniConOrari = new Set(orari.filter(o => o.attivo && o.giorno !== null).map(o => o.giorno as number))
  const chiusiOrdinari = [0,1,2,3,4,5,6].filter(d => !giorniConOrari.has(d))
  const chiusiSettimanali = chiusure
    .filter(c => c.tipo === 'Giorno della settimana' && c.tipoApertura === 'Chiusura' && c.giorno !== null)
    .map(c => c.giorno as number)
  const giorniChiusi = [...new Set([...chiusiOrdinari, ...chiusiSettimanali])]

  const visibili = tutti.filter(e =>
    e.stato === 'attivo' &&
    e.slug &&
    e.slug !== slugCorrente &&
    e.fotoHero &&
    (e.ricorrente || (e.data && e.data >= oggi))
  ).slice(0, 4)

  if (visibili.length === 0) return null

  return (
    <section className="pt-8 pb-14 md:pb-20 bg-surface-warm">
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
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)' }}
              />
              <div className="relative z-10 p-5">
                <p className="font-semibold text-white leading-tight" style={{ fontSize: 'var(--text-lead)' }}>
                  {e.titolo}
                </p>
                <p className="text-white/60 font-light mt-1" style={{ fontSize: 'var(--text-label)' }}>
                  {formatLabel(e, giorniChiusi)}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
