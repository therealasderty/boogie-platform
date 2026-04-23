'use client'

import { useState, useEffect, useRef } from 'react'
import { inputClassDark as inputClass, selectClassDark as selectClass } from '@/lib/form-classes'

interface Slot   { ora: string; disponibili: number; pieno: boolean }
interface Fascia { fascia: string; slots: Slot[] }

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
              'luglio','agosto','settembre','ottobre','novembre','dicembre']
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

function dataLeggibile(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-faint text-xs">▾</div>
    </div>
  )
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function oggi() { return localDateStr(new Date()) }
function traUnMese() { const d = new Date(); d.setMonth(d.getMonth() + 3); return localDateStr(d) }

const GIORNI_NOMI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

function prossimaDataValida(fromIso: string, giorniConsentiti: number[]): string {
  const d = new Date(fromIso + 'T00:00:00')
  for (let i = 0; i <= 7; i++) {
    const check = new Date(d)
    check.setDate(check.getDate() + i)
    if (giorniConsentiti.includes(check.getDay())) return localDateStr(check)
  }
  return fromIso
}

export default function FormPrenotazioneEvento({
  data: dataProp,
  orario,
  orarioFine,
  slotMinuti,
  maxPosti,
  titolo,
  ricorrente,
  dataFormattata,
  giornoSettimana,
}: {
  data: string
  orario?: string
  orarioFine?: string
  slotMinuti?: number
  maxPosti?: number | string
  titolo?: string
  ricorrente?: boolean
  dataFormattata?: string
  giornoSettimana?: string
}) {
  const giorniConsentiti = ricorrente && giornoSettimana
    ? giornoSettimana.split(',').map(Number).filter(n => !isNaN(n))
    : []

  // Tre modalità:
  // 1. haRange: orario + orarioFine → fetch disponibilità, filtra slot nel range evento
  // 2. orario fisso (solo start): mostra badge fisso, non fa fetch
  // 3. nessun orario: fetch disponibilità generale
  const haRange = !!(orario && orarioFine)

  const [data, setData] = useState(() => {
    // Se dataProp è nel passato (bug timezone o cache), parti da oggi
    const todayStr = localDateStr(new Date())
    return dataProp < todayStr ? todayStr : dataProp
  })
  const [stato, setStato] = useState<'loading' | 'chiuso' | 'pronto' | 'inviando' | 'successo' | 'errore'>(
    orario && !orarioFine ? 'pronto' : 'loading'
  )
  // Conta i tentativi auto-advance (reset quando l'utente cambia data manualmente)
  const autoAdvanceRef = useRef(0)
  const userChangedDate = useRef(false)
  const [fasce, setFasce] = useState<Fascia[]>([])
  const [oraSelezionata, setOraSelezionata] = useState(orario && !orarioFine ? orario : '')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [persone, setPersone] = useState('2')
  const [dataNascita, setDataNascita] = useState('')
  const [note, setNote] = useState('')
  const [consensoPrivacy, setConsensoPrivacy] = useState(false)
  const [consensoMarketing, setConsensoMarketing] = useState(false)
  const [erroreMsg, setErroreMsg] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  function nextDay(iso: string) {
    const d = new Date(iso + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    return localDateStr(d)
  }

  useEffect(() => {
    if (orario && !orarioFine) return  // orario fisso, niente fetch
    setStato('loading')
    setOraSelezionata('')
    fetch(`/api/disponibilita?data=${data}`)
      .then(r => r.json())
      .then(json => {
        const chiuso = json.chiuso || !json.fasce?.length

        // Auto-advance: se chiuso e ricorrente e l'utente non ha cambiato data manualmente
        if (chiuso && ricorrente && !userChangedDate.current && autoAdvanceRef.current < 14) {
          autoAdvanceRef.current += 1
          setData(nextDay(data))
          return
        }

        if (chiuso) { setStato('chiuso'); return }

        // Se c'è un range evento, filtra gli slot in quell'intervallo
        const fasceFiltrate: Fascia[] = json.fasce.map((f: Fascia) => ({
          ...f,
          slots: haRange
            ? f.slots.filter((s: Slot) => {
                const m = timeToMin(s.ora)
                return m >= timeToMin(orario!) && m < timeToMin(orarioFine!)
              })
            : f.slots,
        })).filter((f: Fascia) => f.slots.length > 0)

        if (fasceFiltrate.length === 0) {
          if (ricorrente && !userChangedDate.current && autoAdvanceRef.current < 14) {
            autoAdvanceRef.current += 1
            setData(nextDay(data))
            return
          }
          setStato('chiuso'); return
        }

        autoAdvanceRef.current = 0
        setFasce(fasceFiltrate)
        const vistiInit = new Set<string>()
        for (const fascia of fasceFiltrate) {
          const primo = fascia.slots.find((s: Slot) => !s.pieno && !vistiInit.has(s.ora))
          if (primo) { setOraSelezionata(primo.ora); break }
          fascia.slots.forEach((s: Slot) => vistiInit.add(s.ora))
        }
        setStato('pronto')
      })
      .catch(() => setStato('chiuso'))
  }, [data, orario, orarioFine, haRange, ricorrente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consensoPrivacy || !oraSelezionata) return
    setStato('inviando')
    setErroreMsg('')
    try {
      const res = await fetch('/api/prenota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, cognome, data, ora: oraSelezionata,
          persone: parseInt(persone), email, telefono,
          note, evento: titolo || '',
          data_nascita: dataNascita || null,
          consenso_privacy: consensoPrivacy,
          consenso_marketing: consensoMarketing,
        }),
      })
      if (!res.ok) throw new Error()
      setStato('successo')
    } catch {
      setErroreMsg('Si è verificato un errore. Riprova o contattaci direttamente.')
      setStato('pronto')
    }
  }

  useEffect(() => {
    if (stato === 'successo') {
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }
  }, [stato])

  const slotsDisponibili = fasce.flatMap(f => f.slots).filter(s => !s.pieno)
  const hasSlots = (orario && !orarioFine) || slotsDisponibili.length > 0
  const maxPersone = maxPosti ? Math.min(Number(maxPosti), 10) : 10

  // Per eventi ricorrenti, non bloccare il form quando chiuso: mostra solo il date picker
  // così l'utente può cambiare data invece di restare bloccato sul messaggio d'errore.
  if (stato === 'chiuso' && !ricorrente) {
    return (
      <>
        {titolo && (
          <div className="mb-6">
            <h3 className="font-raleway font-semibold text-white mb-2" style={{ fontSize: '1.75rem' }}>
              Prenota per l&apos;appuntamento {titolo}
            </h3>
            {dataFormattata && (
              <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>{dataFormattata}</p>
            )}
            <p className="text-text-faint mb-6 mt-1" style={{ fontSize: 'var(--text-meta)' }}>
              Vuoi prenotare a cena o a pranzo per un altro giorno?{' '}
              <a href="/prenota" className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors">
                Vai alla pagina prenotazioni
              </a>
            </p>
          </div>
        )}
        <div className="rounded-card border border-white/10 p-6">
          <p className="text-text-muted" style={{ fontSize: 'var(--text-body)' }}>
            Le prenotazioni online non sono disponibili per questa data. Contattaci direttamente per riservare il tuo posto.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      {stato !== 'successo' && titolo && (
        <div className="mb-6">
          <h3 className="font-raleway font-semibold text-white mb-2" style={{ fontSize: '1.75rem' }}>
            Prenota per l&apos;appuntamento {titolo}
          </h3>
          {dataFormattata && (
            <p className="text-text-faint mt-1" style={{ fontSize: 'var(--text-meta)' }}>{dataFormattata}</p>
          )}
          <p className="text-text-faint mb-6 mt-1" style={{ fontSize: 'var(--text-meta)' }}>
            Vuoi prenotare a cena o a pranzo per un altro giorno?{' '}
            <a href="/prenota" className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors">
              Vai alla pagina prenotazioni
            </a>
          </p>
        </div>
      )}
      {stato === 'successo' ? (
        <div ref={successRef} className="rounded-card border border-brand/30 bg-brand/5 p-8 text-center">
          <p className="text-brand font-medium mb-2" style={{ fontSize: 'var(--text-section)' }}>Prenotazione inviata ✓</p>
          <p className="text-text-muted" style={{ fontSize: 'var(--text-body)' }}>
            Riceverai una conferma via email entro pochi minuti.
          </p>
        </div>
      ) : (
    <form onSubmit={handleSubmit} noValidate>

      {/* Data — solo per eventi ricorrenti */}
      {ricorrente && (
        <div className="mb-6">
          <label className="block text-text-faint font-medium mb-3" style={{ fontSize: 'var(--text-meta)' }}>
            Seleziona una data
          </label>
          <input
            type="date"
            required
            min={oggi()}
            max={traUnMese()}
            value={data}
            onChange={e => {
              userChangedDate.current = true
              autoAdvanceRef.current = 0
              const selected = e.target.value
              if (giorniConsentiti.length > 0) {
                const d = new Date(selected + 'T00:00:00')
                if (!giorniConsentiti.includes(d.getDay())) {
                  setData(prossimaDataValida(selected, giorniConsentiti))
                  return
                }
              }
              setData(selected)
            }}
            className={inputClass}
            style={{ fontSize: 'var(--text-body)', colorScheme: 'dark' }}
          />
          {giorniConsentiti.length > 0 && (
            <p className="mt-2 text-text-faint/70" style={{ fontSize: 'var(--text-meta)' }}>
              Disponibile ogni {giorniConsentiti.map(n => GIORNI_NOMI[n]).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Loading / chiuso inline per ricorrenti */}
      {stato === 'loading' && (
        <div className="py-4 text-text-faint" style={{ fontSize: 'var(--text-meta)' }}>Verifica disponibilità...</div>
      )}
      {stato === 'chiuso' && ricorrente && (
        <div className="rounded-card border border-white/10 p-4 mb-6">
          <p className="text-text-muted" style={{ fontSize: 'var(--text-body)' }}>
            Nessuna disponibilità per questa data. Prova a selezionare un altro giorno.
          </p>
        </div>
      )}

      {/* Orario — nascosto mentre carica o se chiuso */}
      {stato !== 'loading' && stato !== 'chiuso' && (
        <div className="mb-6">
          <label className="block text-text-faint font-medium mb-3" style={{ fontSize: 'var(--text-meta)' }}>
            Orario
          </label>
          {orario && !orarioFine ? (
            // Orario fisso senza range
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn border border-brand/40 bg-brand/10 text-brand font-medium" style={{ fontSize: 'var(--text-body)' }}>
              ore {orario}
            </div>
          ) : (
            // Slot da disponibilità (filtrati nel range evento se haRange)
            <>
              <SelectWrapper>
                <select
                  value={oraSelezionata}
                  onChange={e => setOraSelezionata(e.target.value)}
                  className={selectClass}
                  style={{ backgroundColor: '#111' }}
                  required
                >
                  <option value="" disabled>Seleziona un orario</option>
                  {(() => {
                    const visti = new Set<string>()
                    return fasce.flatMap(fascia =>
                      fascia.slots
                        .filter(slot => { if (visti.has(slot.ora)) return false; visti.add(slot.ora); return true })
                        .map(slot => (
                          <option key={slot.ora} value={slot.ora} disabled={slot.pieno}>
                            {slot.ora}{slot.pieno ? ' — esaurito' : ''}
                          </option>
                        ))
                    )
                  })()}
                </select>
              </SelectWrapper>
              {slotsDisponibili.length === 0 && (
                <p className="text-text-faint mt-2" style={{ fontSize: 'var(--text-meta)' }}>Nessun orario disponibile per questa data.</p>
              )}
            </>
          )}
        </div>
      )}

      {hasSlots && (
        <>
          {/* Persone */}
          <div className="mb-6">
            <label className="block text-text-faint font-medium mb-3" style={{ fontSize: 'var(--text-meta)' }}>
              Numero di persone
            </label>
            <SelectWrapper>
              <select
                value={persone}
                onChange={e => setPersone(e.target.value)}
                className={selectClass}
                style={{ backgroundColor: '#111' }}
              >
                {Array.from({ length: maxPersone }, (_, i) => i + 1).map(n => (
                  <option key={n} value={String(n)}>{n} {n === 1 ? 'persona' : 'persone'}</option>
                ))}
              </select>
            </SelectWrapper>
          </div>

          {/* Dati personali */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Nome *</label>
              <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Mario" />
            </div>
            <div>
              <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Cognome</label>
              <input type="text" value={cognome} onChange={e => setCognome(e.target.value)}
                className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Rossi" />
            </div>
            <div>
              <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Email *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="mario@esempio.it" />
            </div>
            <div>
              <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Telefono *</label>
              <input type="tel" required value={telefono} onChange={e => setTelefono(e.target.value)}
                className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="+39 333 000 0000" />
            </div>
          </div>

          {/* Data di nascita */}
          <div className="mb-4">
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
              Data di nascita <span className="text-text-faint/60">(opzionale)</span>
            </label>
            <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)}
              className={inputClass} style={{ fontSize: 'var(--text-body)', colorScheme: 'dark' }} />
            <p className="mt-1.5 text-text-faint/70" style={{ fontSize: 'var(--text-meta)' }}>
              🎂 Condividila per ricevere una sorpresa speciale nel mese del tuo compleanno
            </p>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Note (opzionale)</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              className={`${inputClass} resize-none`} style={{ fontSize: 'var(--text-body)' }}
              placeholder="Allergie, richieste particolari…" />
          </div>

          {/* Consensi */}
          <div className="flex flex-col gap-3 mb-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consensoPrivacy} onChange={e => setConsensoPrivacy(e.target.checked)}
                className="mt-0.5 accent-brand" required />
              <span className="text-text-faint leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Ho letto e accetto la{' '}
                <a href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">Privacy Policy</a> *
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consensoMarketing} onChange={e => setConsensoMarketing(e.target.checked)}
                className="mt-0.5 accent-brand" />
              <span className="text-text-faint leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                Acconsento a ricevere comunicazioni promozionali da Boogie Bistrot
              </span>
            </label>
          </div>

          {erroreMsg && <p className="text-red-400 mb-4" style={{ fontSize: 'var(--text-meta)' }}>{erroreMsg}</p>}

          <button
            type="submit"
            disabled={stato === 'inviando' || !consensoPrivacy || !nome || !email || !telefono || !oraSelezionata}
            className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-8 py-3.5 rounded-btn transition-colors cursor-pointer"
            style={{ fontSize: 'var(--text-body)' }}
          >
            {stato === 'inviando' ? 'Invio in corso…' : 'Conferma prenotazione'}
          </button>
        </>
      )}
    </form>
      )}
    </>
  )
}
