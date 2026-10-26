interface Voce {
  nome: string
  descrizione?: string
  prezzo: number | null
  formato?: string
  prezzo2?: number | null
  formato2?: string
  note?: string
  glutine?: boolean
  lattosio?: boolean
  senzaGlutine?: boolean
  senzaLattosio?: boolean
  badge?: string
  produttore?: string
  regione?: string
}

interface SezioneMenu {
  titolo: string
  voci: Voce[]
}

import { IconGlutine, IconLattosio } from '@/components/AllergenBadge'
import SectionContainer from '@/components/SectionContainer'

interface MenuListaProps {
  sezioni: SezioneMenu[]
  mostraAllergeni?: boolean
}

export default function MenuLista({ sezioni, mostraAllergeni = false }: MenuListaProps) {
  return (
    <SectionContainer bg="white">


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
                {s.voci.map((v, i) => (
                  <div
                    key={v.nome}
                    className="flex items-start justify-between gap-6 py-5"
                    style={{ borderBottom: i < s.voci.length - 1 ? '1px solid var(--color-border-separator)' : 'none' }}
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-800" style={{ fontSize: 'var(--text-lead)' }}>
                          {v.nome}
                        </span>
                        {(v.produttore || v.regione) && (
                          <span className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-body)' }}>
                            — {[v.produttore, v.regione].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {v.badge && (
                          <span className="text-tiny font-semibold px-2 py-0.5 rounded-pill bg-brand/20 text-neutral-700" style={{ letterSpacing: '0.04em' }}>
                            {v.badge}
                          </span>
                        )}
                        {v.senzaGlutine && (
                          <span className="text-tiny font-semibold px-2 py-0.5 rounded-pill bg-green-50 text-green-700" style={{ letterSpacing: '0.04em' }}>Senza glutine</span>
                        )}
                        {v.senzaLattosio && (
                          <span className="text-tiny font-semibold px-2 py-0.5 rounded-pill bg-blue-50 text-blue-600" style={{ letterSpacing: '0.04em' }}>Senza lattosio</span>
                        )}
                      </div>
                      {v.descrizione && (
                        <span className="text-neutral-400 font-light leading-relaxed" style={{ fontSize: 'var(--text-body)' }}>
                          {v.descrizione}
                        </span>
                      )}
                      {(() => {
                        if (!v.note) return null
                        let note = v.note
                        if (v.senzaGlutine) note = note.replace(/senza\s+glutine/gi, '')
                        if (v.senzaLattosio) note = note.replace(/senza\s+lattosio/gi, '')
                        const cleaned = note.replace(/^[\s,;.·\-]+|[\s,;.·\-]+$/g, '').trim()
                        if (!cleaned) return null
                        return (
                          <span className="text-neutral-300 font-light" style={{ fontSize: 'var(--text-label)' }}>
                            {cleaned}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {v.prezzo != null && (
                        <span className="font-medium text-neutral-700" style={{ fontSize: 'var(--text-lead)' }}>
                          {v.formato && <span className="text-neutral-400 font-light mr-1" style={{ fontSize: 'var(--text-label)' }}>{v.formato}</span>}
                          €{v.prezzo}
                        </span>
                      )}
                      {v.prezzo2 != null && (
                        <span className="font-medium text-neutral-700" style={{ fontSize: 'var(--text-lead)' }}>
                          {v.formato2 && <span className="text-neutral-400 font-light mr-1" style={{ fontSize: 'var(--text-label)' }}>{v.formato2}</span>}
                          €{v.prezzo2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-neutral-300 font-light mt-12 text-center" style={{ fontSize: 'var(--text-label)' }}>
          I prezzi sono IVA inclusa · Per allergeni non indicati informare il personale
        </p>

    </SectionContainer>
  )
}
