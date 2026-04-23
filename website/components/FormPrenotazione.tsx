'use client'

import { useState, useEffect, useRef } from 'react'

interface Slot   { ora: string; disponibili: number; pieno: boolean }
interface Fascia { fascia: string; slots: Slot[] }

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
              'luglio','agosto','settembre','ottobre','novembre','dicembre']
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

function dataLeggibile(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function primoGiornoAperto() {
  const d = new Date()
  if (d.getDay() === 1) d.setDate(d.getDate() + 1) // lunedì → martedì
  return d.toISOString().split('T')[0]
}

function oggi() {
  return new Date().toISOString().split('T')[0]
}

function traUnMese() {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
}

import { inputClass, labelClass, selectClass } from '@/lib/form-classes'

const sectionLabelClass = 'block text-neutral-500 font-medium mb-3 leading-snug'

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/50 text-xs">▾</div>
    </div>
  )
}

export default function FormPrenotazione() {
  const [data, setData] = useState(primoGiornoAperto)
  const [disponibilita, setDisponibilita] = useState<'idle' | 'loading' | 'chiuso' | 'bloccato' | 'pronto'>('idle')
  const [fasce, setFasce] = useState<Fascia[]>([])
  const [oraSelezionata, setOraSelezionata] = useState('')
  const [fasceSelezionate, setFasceSelezionate] = useState<string[]>([])
  const [eventoBloccante, setEventoBloccante] = useState<{ titolo: string; slug: string } | null>(null)
  const [eventiDelGiorno, setEventiDelGiorno] = useState<{ titolo: string; slug: string; foto: string }[]>([])

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [persone, setPersone] = useState('2')
  const [dataNascita, setDataNascita] = useState('')
  const [preferenza, setPreferenza] = useState<'pizza' | 'cucina' | ''>('')
  const [note, setNote] = useState('')
  const [consensoPrivacy, setConsensoPrivacy] = useState(false)
  const [consensoMarketing, setConsensoMarketing] = useState(false)

  const [accordionAperto, setAccordionAperto] = useState(false)
  const [stato, setStato] = useState<'pronto' | 'inviando' | 'successo' | 'errore'>('pronto')
  const [erroreMsg, setErroreMsg] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data) return
    setDisponibilita('loading')
    setOraSelezionata('')
    setFasceSelezionate([])
    setAccordionAperto(false)
    fetch(`/api/disponibilita?data=${data}`)
      .then(r => r.json())
      .then(json => {
        if (json.bloccatoDaEvento) {
          setEventoBloccante({ titolo: json.eventoTitolo || '', slug: json.eventoSlug || '' })
          setDisponibilita('bloccato')
          return
        }
        if (json.chiuso || !json.fasce?.length) { setDisponibilita('chiuso'); return }
        setFasce(json.fasce)
        setEventiDelGiorno(json.eventiDelGiorno || [])
        // Slot unici per ora (deduplicati tra fasce), primo disponibile
        const visti = new Set<string>()
        for (const fascia of json.fasce) {
          const primo = fascia.slots.find((s: Slot) => !s.pieno && !visti.has(s.ora))
          if (primo) { setOraSelezionata(primo.ora); break }
          fascia.slots.forEach((s: Slot) => visti.add(s.ora))
        }
        setDisponibilita('pronto')
      })
      .catch(() => setDisponibilita('chiuso'))
  }, [data])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consensoPrivacy || !oraSelezionata || !data) return
    setStato('inviando')
    setErroreMsg('')
    try {
      const res = await fetch('/api/prenota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, cognome, data, ora: oraSelezionata,
          fascia: fasceSelezionate.length > 0 ? fasceSelezionate.join(', ') : undefined,
          persone: parseInt(persone), email, telefono,
          note, evento: '',
          preferenza: preferenza || null,
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

  if (stato === 'successo') {
    return (
      <div ref={successRef} className="rounded-card border border-brand/30 bg-brand/10 p-10 text-center mt-10">
        <p className="text-black font-medium mb-3" style={{ fontSize: 'var(--text-section)' }}>Prenotazione inviata ✓</p>
        <p className="text-neutral-600" style={{ fontSize: 'var(--text-body)' }}>
          Riceverai una conferma via email entro pochi minuti.
        </p>
      </div>
    )
  }

  const slotsDisponibili = fasce.flatMap(f => f.slots).filter(s => !s.pieno)

  // Fasce che contengono l'orario selezionato (per il selettore fascia)
  const fascePerOrario = oraSelezionata
    ? fasce.filter(f => f.slots.some(s => s.ora === oraSelezionata))
    : []

  function toggleFascia(nome: string) {
    setFasceSelezionate(prev =>
      prev.includes(nome) ? prev.filter(f => f !== nome) : [...prev, nome]
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <p className="text-black/50 leading-relaxed" style={{ fontSize: 'var(--text-lead)' }}>
        Scegli la data e l&apos;orario, compila i tuoi dati e invia la richiesta.
        Riceverai una conferma via email entro pochi minuti.
      </p>

      {/* Data */}
      <div>
        <label className={`${sectionLabelClass}`} style={{ fontSize: 'var(--text-meta)' }}>
          Seleziona una data
        </label>
        <input
          type="date"
          required
          min={oggi()}
          max={traUnMese()}
          value={data}
          onChange={e => setData(e.target.value)}
          className={inputClass}
          style={{ fontSize: 'var(--text-body)', colorScheme: 'light' }}
        />
      </div>

      {/* Feedback disponibilità */}
      {disponibilita === 'loading' && (
        <p className="text-neutral-500" style={{ fontSize: 'var(--text-meta)' }}>Verifica disponibilità…</p>
      )}
      {disponibilita === 'chiuso' && (
        <div className="rounded-card border border-black/10 bg-black/3 p-5">
          <p className="text-black/70 font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
            Il Boogie è chiuso in questa data
          </p>
          <p className="text-neutral-600" style={{ fontSize: 'var(--text-meta)' }}>
            Scegli un altro giorno oppure contattaci direttamente per esigenze particolari.
          </p>
        </div>
      )}
      {disponibilita === 'bloccato' && eventoBloccante && (
        <div className="rounded-card border border-brand/20 bg-brand/5 p-5">
          <p className="text-black/60 mb-3" style={{ fontSize: 'var(--text-body)' }}>
            In questa data è in programma un evento speciale. Le prenotazioni generali non sono disponibili.
          </p>
          {eventoBloccante.slug ? (
            <a
              href={`/eventi-speciali/${eventoBloccante.slug}`}
              className="inline-block bg-brand hover:bg-brand-hover text-black font-medium px-6 py-2.5 rounded-btn transition-colors"
              style={{ fontSize: 'var(--text-body)' }}
            >
              Prenota per {eventoBloccante.titolo || 'l\'evento'}
            </a>
          ) : (
            <p className="text-brand font-medium" style={{ fontSize: 'var(--text-body)' }}>
              {eventoBloccante.titolo}
            </p>
          )}
        </div>
      )}

      {disponibilita === 'pronto' && eventiDelGiorno.length > 0 && (
        <div className="rounded-card border border-black/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setAccordionAperto(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-black/3 hover:bg-black/5 transition-colors text-left"
          >
            <span className="text-neutral-700 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
              {eventiDelGiorno.length === 1
                ? '1 appuntamento speciale questa sera'
                : `${eventiDelGiorno.length} appuntamenti speciali questa sera`}
            </span>
            <span className={`text-black/40 text-xs transition-transform duration-200 ${accordionAperto ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {accordionAperto && (
            <div className="flex flex-col divide-y divide-black/5">
              {eventiDelGiorno.map(e => (
                <a
                  key={e.slug}
                  href={`/eventi-speciali/${e.slug}`}
                  className="flex items-stretch gap-4 overflow-hidden hover:bg-black/3 transition-colors"
                >
                  {e.foto ? (
                    <div className="relative w-16 flex-shrink-0 min-h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.foto} alt={e.titolo} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-brand/10 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand/40">
                        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 py-2.5 pr-4 min-w-0">
                    <span className="text-neutral-800 font-medium block leading-snug" style={{ fontSize: 'var(--text-meta)' }}>{e.titolo}</span>
                    <span className="text-black/40 text-xs mt-0.5 block">Scopri di più →</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {disponibilita === 'pronto' && (
        <>
          {/* Orario */}
          <div>
            <label className={sectionLabelClass} style={{ fontSize: 'var(--text-meta)' }}>
              Scegli l&apos;orario
            </label>
            <SelectWrapper>
              <select value={oraSelezionata} onChange={e => setOraSelezionata(e.target.value)}
                className={selectClass} style={{ backgroundColor: '#fafafa' }} required>
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
              <p className="text-black/50 mt-2" style={{ fontSize: 'var(--text-meta)' }}>Nessun orario disponibile per questa data.</p>
            )}
            {fascePerOrario.length > 1 && (
              <div className="mt-3">
                <p className="text-neutral-500 font-medium mb-2" style={{ fontSize: 'var(--text-meta)' }}>Per:</p>
                <div className="flex gap-2">
                  {fascePerOrario.map(f => (
                    <button
                      key={f.fascia}
                      type="button"
                      onClick={() => toggleFascia(f.fascia)}
                      className={`flex-1 px-4 py-2 rounded-btn border font-light transition-colors ${
                        fasceSelezionate.includes(f.fascia)
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300'
                      }`}
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {f.fascia}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {slotsDisponibili.length > 0 && (
            <>
              {/* Persone */}
              <div>
                <label className={sectionLabelClass} style={{ fontSize: 'var(--text-meta)' }}>
                  Numero di persone
                </label>
                <SelectWrapper>
                  <select value={persone} onChange={e => setPersone(e.target.value)}
                    className={selectClass} style={{ backgroundColor: '#fafafa' }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n} {n === 1 ? 'persona' : 'persone'}</option>
                    ))}
                  </select>
                </SelectWrapper>
              </div>

              {/* Dati personali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Nome *</label>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                    className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Mario" />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Cognome</label>
                  <input type="text" value={cognome} onChange={e => setCognome(e.target.value)}
                    className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Rossi" />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Email *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="mario@esempio.it" />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Telefono *</label>
                  <input type="tel" required value={telefono} onChange={e => setTelefono(e.target.value)}
                    className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="+39 333 000 0000" />
                </div>
              </div>

              {/* Data di nascita */}
              <div>
                <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
                  Data di nascita <span className="text-neutral-400 font-light">(opzionale)</span>
                </label>
                <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)}
                  className={inputClass} style={{ fontSize: 'var(--text-body)', colorScheme: 'light', minHeight: '46px' }} />
                <p className="mt-1.5 text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                  🎂 Compilala per ricevere una sorpresa speciale nel mese del tuo compleanno
                </p>
              </div>

              {/* Preferenza */}
              <div>
                <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
                  Preferenza <span className="text-neutral-400 font-light">(opzionale)</span>
                </label>
                <div className="flex gap-2 w-full">
                  {(['pizza', 'cucina'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPreferenza(prev => prev === v ? '' : v)}
                      className={`flex-1 px-5 py-2.5 rounded-btn border font-light transition-colors capitalize ${
                        preferenza === v
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300'
                      }`}
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {v === 'pizza' ? '🍕 Pizza' : '🍽️ Cucina'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Note (opzionale)</label>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                  className={`${inputClass} resize-none`} style={{ fontSize: 'var(--text-body)' }}
                  placeholder="Allergie, richieste particolari, occasione speciale…" />
              </div>

              {/* Consensi */}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consensoPrivacy} onChange={e => setConsensoPrivacy(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-brand w-4 h-4 cursor-pointer" required />
                  <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                    Ho letto e accetto la{' '}
                    <a href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">Privacy Policy</a> *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consensoMarketing} onChange={e => setConsensoMarketing(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-brand w-4 h-4 cursor-pointer" />
                  <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                    Acconsento a ricevere comunicazioni promozionali da Boogie Bistrot
                  </span>
                </label>
              </div>

              {erroreMsg && <p className="text-red-600" style={{ fontSize: 'var(--text-meta)' }}>{erroreMsg}</p>}

              <div>
                <button
                  type="submit"
                  disabled={stato === 'inviando' || !consensoPrivacy || !nome || !email || !telefono || !oraSelezionata || (fascePerOrario.length > 1 && fasceSelezionate.length === 0)}
                  className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-8 py-3.5 rounded-btn transition-colors cursor-pointer"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  {stato === 'inviando' ? 'Invio in corso…' : 'Conferma prenotazione'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </form>
  )
}
