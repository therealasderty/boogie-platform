import Image from 'next/image'
import Link from 'next/link'
import { fetchMedia } from '@/lib/media'
import type {
  Blocco, BloccoTesto, BloccoImmagine, BloccoMenu, BloccoArtista, BloccoCardOfferte, BloccoPrezzo,
} from '@/lib/agenda'

// ─── Testo ───────────────────────────────────────────────────────────────────
function RendererTesto({ b }: { b: BloccoTesto }) {
  if (!b.titolo && !b.contenuto) return null
  return (
    <section className="py-12 border-b border-neutral-200">
      {b.titolo && (
        <h2 className="font-raleway font-semibold text-neutral-900 mb-5" style={{ fontSize: 'var(--text-section)' }}>
          {b.titolo}
        </h2>
      )}
      {b.contenuto && (
        <div
          className="rich-text text-neutral-600 leading-relaxed"
          style={{ fontSize: 'var(--text-lead)' }}
          dangerouslySetInnerHTML={{ __html: b.contenuto }}
        />
      )}
    </section>
  )
}

// ─── Immagine ────────────────────────────────────────────────────────────────
function RendererImmagine({ b }: { b: BloccoImmagine }) {
  if (!b.url) return null
  return (
    <section className="py-12 border-b border-neutral-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={b.url}
        alt={b.alt || ''}
        className="w-full rounded-card object-cover"
        style={{ aspectRatio: '16/9' }}
      />
    </section>
  )
}

// ─── Menù ────────────────────────────────────────────────────────────────────
function RendererMenu({ b }: { b: BloccoMenu }) {
  // Normalizza: sezioni (nuovo) o voci flat (legacy)
  const sezioni = b.sezioni?.length
    ? b.sezioni
    : b.voci?.length
    ? [{ voci: b.voci }]
    : []
  if (!sezioni.length) return null
  return (
    <section className="py-12 border-b border-neutral-200">
      {b.titolo && (
        <h3 className="font-raleway font-semibold text-neutral-900 mb-8" style={{ fontSize: '1.75rem' }}>
          {b.titolo}
        </h3>
      )}
      <div className="flex flex-col gap-10">
        {sezioni.map((s, si) => (
          <div key={si}>
            {s.titolo && (
              <p className="uppercase font-semibold text-neutral-400 mb-4" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}>
                {s.titolo}
              </p>
            )}
            <div className="flex flex-col">
              {(s.voci || []).map((v, i) => (
                <div key={i} className="flex items-start justify-between gap-6 py-4 border-b border-neutral-200 last:border-0">
                  <div className="flex-1">
                    <span className="text-neutral-900 font-medium" style={{ fontSize: 'var(--text-body)' }}>{v.nome}</span>
                    {v.descrizione && (
                      <p className="text-neutral-500 mt-0.5" style={{ fontSize: 'var(--text-meta)' }}>{v.descrizione}</p>
                    )}
                  </div>
                  {v.prezzo && (
                    <span className="text-brand font-medium flex-shrink-0" style={{ fontSize: 'var(--text-body)' }}>
                      {v.prezzo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Artista / Ospite ────────────────────────────────────────────────────────
function RendererArtista({ b }: { b: BloccoArtista }) {
  if (!b.nome) return null
  return (
    <section className="py-12 border-b border-neutral-200">
      <div className="flex items-start gap-6">
        {b.foto && (
          <div className="relative w-20 h-20 rounded-pill overflow-hidden flex-shrink-0">
            <Image src={b.foto} alt={b.nome} fill className="object-cover" />
          </div>
        )}
        <div>
          <h3 className="font-raleway font-semibold text-neutral-900" style={{ fontSize: '1.5rem' }}>{b.nome}</h3>
          {b.bio && (
            <p className="text-neutral-600 mt-2 leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              {b.bio}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Card Offerte ─────────────────────────────────────────────────────────────
const OFFERTE_CONFIG: Record<string, { titolo: string; descrizione: string; href: string; tag: string }> = {
  carta:     { titolo: 'Specialità alla carta', descrizione: 'Cucina del territorio rivisitata con creatività, ingredienti freschi e prodotti locali.', href: '/menu/specialita',         tag: 'carta' },
  pizza:     { titolo: 'Pizza',                  descrizione: 'Impasto a lunga lievitazione, cotta nel forno a legna con ingredienti selezionati.',      href: '/menu/pizza',              tag: 'pizza' },
  aperitivo: { titolo: 'Apericena del Boogie',   descrizione: 'Il nostro apericena a 26€: stuzzichini, primo dello chef e un drink a scelta.',           href: '/eventi-speciali/aperitivo', tag: 'aperitivo' },
  birre:     { titolo: 'Birre',                  descrizione: 'Birre selezionate dalla Lombardia e oltre.',                                              href: '/menu/birre',              tag: 'birra' },
  vini:      { titolo: 'Carta dei Vini',         descrizione: 'Etichette italiane e locali selezionate con cura.',                                       href: '/menu/vini',               tag: 'vino' },
  cocktails: { titolo: 'Cocktail',               descrizione: 'Aperitivi, long drink e signature cocktail preparati al momento.',                         href: '/menu/cocktails',          tag: 'cocktail' },
}

async function RendererCardOfferte({ b }: { b: BloccoCardOfferte }) {
  const keys = (b.voci || []).filter(k => OFFERTE_CONFIG[k])
  if (!keys.length) return null

  const fotos = await Promise.all(
    keys.map(k => fetchMedia(OFFERTE_CONFIG[k].tag).then(items => items[0]?.url ?? null))
  )
  const voci = keys.map((k, i) => ({ ...OFFERTE_CONFIG[k], foto: fotos[i] }))
  const cols = voci.length === 2 ? 'sm:grid-cols-2' : voci.length >= 3 ? 'sm:grid-cols-3' : ''

  return (
    <section
      className="py-20 md:py-28 bg-surface-warm w-screen"
      style={{ marginLeft: 'calc(50% - 50vw)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-14">
        {b.titolo && (
          <div className="mb-12">
            <span
              className="uppercase text-black/40 font-medium"
              style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-label)' }}
            >
              Offerte serata
            </span>
            <h2
              className="font-semibold text-neutral-900 leading-snug mt-4"
              style={{ fontSize: 'var(--text-section)' }}
            >
              {b.titolo}
            </h2>
          </div>
        )}
        <div className={`grid grid-cols-1 ${cols} gap-4`}>
          {voci.map(v => (
            <Link
              key={v.href}
              href={v.href}
              className="group relative rounded-card overflow-hidden flex items-end"
              style={{ minHeight: '220px' }}
            >
              {v.foto && (
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                  <Image
                    src={v.foto}
                    alt={v.titolo}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
              />
              <div className="relative z-10 p-5">
                <p className="font-semibold text-white leading-tight" style={{ fontSize: 'var(--text-lead)' }}>
                  {v.titolo}
                </p>
                <p className="text-white/60 font-light mt-1" style={{ fontSize: 'var(--text-label)' }}>
                  {v.descrizione}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Prezzo ──────────────────────────────────────────────────────────────────
function RendererPrezzo({ b }: { b: BloccoPrezzo }) {
  if (!b.importo && !b.titolo && !b.voci?.length) return null
  return (
    <section className="py-12">
      <div className="rounded-card px-6 py-8 bg-white">
        {b.importo && (
          <div className="font-raleway font-semibold text-brand mb-1" style={{ fontSize: '2.5rem' }}>
            {b.importo}
          </div>
        )}
        {b.titolo && (
          <h3 className="font-raleway font-semibold text-neutral-900 mb-5" style={{ fontSize: '1.4rem' }}>
            {b.titolo}
          </h3>
        )}
        {b.voci?.length > 0 && (
          <ul className="flex flex-col gap-3">
            {b.voci.map((v, i) => (
              <li key={i} className="flex items-start gap-3 text-neutral-600" style={{ fontSize: 'var(--text-body)' }}>
                <span className="text-brand flex-shrink-0 mt-px">✓</span>
                {v}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ─── Renderer principale ─────────────────────────────────────────────────────
export default function BlocchiRenderer({ blocchi, data, orario, orarioFine, eventoTitolo }: { blocchi: Blocco[]; data?: string | null; orario?: string; orarioFine?: string; eventoTitolo?: string }) {
  if (!blocchi?.length) return null
  return (
    <div>
      {blocchi.map((b, i) => {
        switch (b.tipo) {
          case 'testo':        return <RendererTesto        key={i} b={b} />
          case 'immagine':     return <RendererImmagine     key={i} b={b} />
          case 'menu':         return <RendererMenu         key={i} b={b} />
          case 'artista':      return <RendererArtista      key={i} b={b as BloccoArtista} />
          case 'card-offerte': return <RendererCardOfferte  key={i} b={b as BloccoCardOfferte} />
          case 'prezzo':       return <RendererPrezzo       key={i} b={b as BloccoPrezzo} />
          default:             return null
        }
      })}
    </div>
  )
}
