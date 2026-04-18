interface Piatto {
  nome: string
  descrizione?: string
  prezzo: number | null
  note?: string
  glutine?: boolean
  lattosio?: boolean
  senzaGlutine?: boolean
  senzaLattosio?: boolean
  badge?: string
}

interface Sezione {
  titolo: string
  voci?: Piatto[]
  piatti?: Piatto[]
}

interface MenuCartaProps {
  sezioni: Sezione[]
}

function IconGlutine() {
  return (
    <span
      title="Contiene glutine"
      className="inline-flex items-center justify-center w-6 h-6 rounded-pill bg-amber-100 text-amber-700 font-semibold"
      style={{ fontSize: '0.6rem', letterSpacing: '0.02em' }}
    >
      G
    </span>
  )
}

function IconLattosio() {
  return (
    <span
      title="Contiene lattosio"
      className="inline-flex items-center justify-center w-6 h-6 rounded-pill bg-blue-50 text-blue-600 font-semibold"
      style={{ fontSize: '0.6rem', letterSpacing: '0.02em' }}
    >
      L
    </span>
  )
}

export default function MenuCarta({ sezioni }: MenuCartaProps) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-14">


        {/* Sezioni */}
        <div className="flex flex-col gap-16">
          {sezioni.map((s) => (
            <div key={s.titolo}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-semibold text-neutral-900" style={{ fontSize: 'var(--text-section)' }}>
                  {s.titolo}
                </h2>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>

              <div className="flex flex-col">
                {(s.voci || s.piatti || []).map((p, i) => (
                  <div
                    key={p.nome}
                    className="flex items-start justify-between gap-6 py-5"
                    style={{ borderBottom: i < (s.voci || s.piatti || []).length - 1 ? '1px solid #f5f5f5' : 'none' }}
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-800" style={{ fontSize: 'var(--text-lead)' }}>
                          {p.nome}
                        </span>
                        {p.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-brand/20 text-neutral-700" style={{ letterSpacing: '0.04em' }}>{p.badge}</span>
                        )}
                        {p.senzaGlutine && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-green-50 text-green-700" style={{ letterSpacing: '0.04em' }}>Senza glutine</span>
                        )}
                        {p.senzaLattosio && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-blue-50 text-blue-600" style={{ letterSpacing: '0.04em' }}>Senza lattosio</span>
                        )}
                      </div>
                      {p.descrizione && (
                        <span className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-body)' }}>
                          {p.descrizione}
                        </span>
                      )}
                      {p.note && (
                        <span className="text-neutral-300 font-light" style={{ fontSize: 'var(--text-label)' }}>
                          {p.note}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-neutral-700 flex-shrink-0" style={{ fontSize: 'var(--text-lead)' }}>
                      €{p.prezzo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-neutral-300 font-light mt-12 text-center" style={{ fontSize: 'var(--text-label)' }}>
          I prezzi sono IVA inclusa · Per allergeni non indicati informare il personale
        </p>

      </div>
    </section>
  )
}
