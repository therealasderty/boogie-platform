'use client'

/**
 * FormPrenotazioneMultiStep
 * Interfaccia Typeform-style: una domanda alla volta.
 *
 * Modalità generica — nessuna prop:
 *   Step 1 — Quante persone sarete?
 *   Step 2 — Quando volete venire? (date picker libero + slot)
 *   Step 3 — Diteci chi siete
 *   Step 4 — Quasi fatto! (email, telefono, consensi)
 *
 * Modalità evento — prop `titolo` (+ dataProp, orario, …):
 *   Step 1 — Quante persone sarete?
 *   Step 2 — Scegli l'orario (data fissa mostrata come badge; date picker solo per ricorrenti)
 *   Step 3 — Diteci chi siete
 *   Step 4 — Quasi fatto!
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { inputClass, labelClass } from '@/lib/form-classes'
import { track } from '@/lib/tracking'

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface Slot   { ora: string; disponibili: number; pieno: boolean }
interface Fascia { fascia: string; slots: Slot[] }

export interface FormPrenotazioneMultiStepProps {
  /** Modalità evento: data di partenza (ISO). Se nel passato, si usa oggi. */
  dataProp?: string
  /** Orario fisso dell'evento (es. "20:00"). Se senza orarioFine = badge fisso, niente fetch. */
  orario?: string
  /** Fine range per filtrare gli slot (es. "23:00"). */
  orarioFine?: string
  slotMinuti?: number
  maxPosti?: number | string
  /** Titolo evento — attiva la modalità evento. */
  titolo?: string
  /** Se true: mostra date picker vincolato ai giorni dell'evento. */
  ricorrente?: boolean
  /** Data già formattata da mostrare nel badge (es. "venerdì 2 maggio 2025"). */
  dataFormattata?: string
  /** Giorni della settimana consentiti per ricorrenti, es. "3,5" (mer, ven). */
  giornoSettimana?: string
}

// ─── Costanti ────────────────────────────────────────────────────────────────

const MESI   = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                'luglio','agosto','settembre','ottobre','novembre','dicembre']
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

const STEP_NAMES = ['Ospiti', 'Data e orario', 'Dati personali', 'Contatti']
const TOTAL_STEPS = 4
const AUTO_ADVANCE_MAX_STEPS = 3

// ─── Utilities ───────────────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function primoGiornoAperto(): string {
  const d = new Date()
  if (d.getDay() === 1) d.setDate(d.getDate() + 1)
  return localDateStr(d)
}

function oggi(): string { return localDateStr(new Date()) }

function traUnMese(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return localDateStr(d)
}

function dataLeggibile(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function prossimaDataValida(fromIso: string, giorniConsentiti: number[]): string {
  const d = new Date(fromIso + 'T00:00:00')
  for (let i = 0; i <= 7; i++) {
    const check = new Date(d)
    check.setDate(check.getDate() + i)
    if (giorniConsentiti.includes(check.getDay())) return localDateStr(check)
  }
  return fromIso
}

function nextDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return localDateStr(d)
}

// ─── Barra di progresso ──────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const base = 20
  const perStep = (100 - base) / total
  const percent = Math.min(base + (step - 1) * perStep, 100)

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          Step {step} di {total}
        </span>
        <span className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Bottone navigazione ─────────────────────────────────────────────────────

function NavButton({
  onClick, disabled, variant = 'primary', children,
}: {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost'
  children: React.ReactNode
}) {
  const base = 'font-semibold rounded-btn transition-colors cursor-pointer'
  const styles =
    variant === 'primary'
      ? `${base} bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black px-8`
      : `${base} bg-transparent text-neutral-400 hover:text-neutral-600 px-4`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles}
      style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
    >
      {children}
    </button>
  )
}

// ─── Componente principale ───────────────────────────────────────────────────

export default function FormPrenotazioneMultiStep({
  dataProp,
  orario,
  orarioFine,
  maxPosti,
  titolo,
  ricorrente,
  dataFormattata,
  giornoSettimana,
}: FormPrenotazioneMultiStepProps = {}) {

  const isEventoMode = !!titolo
  const haRange      = !!(orario && orarioFine)
  const orarioFisso  = !!(orario && !orarioFine)  // badge fisso, niente fetch
  const maxPersone   = maxPosti ? Math.min(Number(maxPosti), 10) : 10
  const giorniConsentiti = ricorrente && giornoSettimana
    ? giornoSettimana.split(',').map(Number).filter(n => !isNaN(n))
    : []

  // ── Navigazione ──────────────────────────────────────────────────────────

  const [step, setStep]       = useState(1)
  const [started, setStarted] = useState(false)
  const topRef                = useRef<HTMLDivElement>(null)
  const successRef            = useRef<HTMLDivElement>(null)

  // ── Dati form ────────────────────────────────────────────────────────────

  const [persone, setPersone]   = useState<number>(2)
  const [data, setData]         = useState(() => {
    if (!dataProp) return primoGiornoAperto()
    return dataProp < oggi() ? oggi() : dataProp
  })
  const [nome, setNome]         = useState('')
  const [cognome, setCognome]   = useState('')
  const [email, setEmail]       = useState('')
  const [telefono, setTelefono] = useState('')
  const [dataNascita, setDataNascita]     = useState('')
  const [preferenza, setPreferenza]       = useState<'pizza' | 'cucina' | ''>('')
  const [note, setNote]                   = useState('')
  const [consensoPrivacy, setConsensoPrivacy]     = useState(false)
  const [consensoMarketing, setConsensoMarketing] = useState(false)

  // ── Disponibilità ────────────────────────────────────────────────────────

  // Orario fisso: partiamo già in stato pronto (niente fetch)
  const [disponibilita, setDisponibilita] = useState<'idle' | 'loading' | 'chiuso' | 'bloccato' | 'pronto'>(
    orarioFisso ? 'pronto' : 'idle'
  )
  const [fasce, setFasce]                         = useState<Fascia[]>([])
  const [oraSelezionata, setOraSelezionata]       = useState(orarioFisso ? (orario ?? '') : '')
  const [fasceSelezionate, setFasceSelezionate]   = useState<string[]>([])
  const [eventoBloccante, setEventoBloccante]     = useState<{ titolo: string; slug: string } | null>(null)

  const autoAdvanceRef  = useRef(0)
  const userChangedDate = useRef(false)

  // ── Submit ───────────────────────────────────────────────────────────────

  const [stato, setStato]     = useState<'pronto' | 'inviando' | 'successo' | 'errore'>('pronto')
  const [erroreMsg, setErroreMsg] = useState('')

  // ── Tracking ─────────────────────────────────────────────────────────────

  function handleFirstInteraction() {
    if (!started) {
      setStarted(true)
      track.formStart()
    }
  }

  // ── Fetch disponibilità ───────────────────────────────────────────────────

  useEffect(() => {
    if (orarioFisso) return  // niente fetch per orario badge fisso
    if (!data) return
    setDisponibilita('loading')
    setOraSelezionata('')
    setFasceSelezionate([])

    fetch(`/api/disponibilita?data=${data}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        const chiuso = json.chiuso || !json.fasce?.length

        // Auto-advance per eventi ricorrenti
        if (chiuso && ricorrente && !userChangedDate.current && autoAdvanceRef.current < AUTO_ADVANCE_MAX_STEPS) {
          autoAdvanceRef.current += 1
          setData(nextDay(data))
          return
        }

        // In modalità generica mostra "bloccato da evento"
        if (!isEventoMode && json.bloccatoDaEvento) {
          setEventoBloccante({ titolo: json.eventoTitolo || '', slug: json.eventoSlug || '' })
          setDisponibilita('bloccato')
          return
        }

        if (chiuso) { setDisponibilita('chiuso'); return }

        // Filtra slot nel range evento se haRange
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
          if (ricorrente && !userChangedDate.current && autoAdvanceRef.current < AUTO_ADVANCE_MAX_STEPS) {
            autoAdvanceRef.current += 1
            setData(nextDay(data))
            return
          }
          setDisponibilita('chiuso')
          return
        }

        autoAdvanceRef.current = 0
        setFasce(fasceFiltrate)

        const visti = new Set<string>()
        for (const fascia of fasceFiltrate) {
          const primo = fascia.slots.find((s: Slot) => !s.pieno && !visti.has(s.ora))
          if (primo) { setOraSelezionata(primo.ora); break }
          fascia.slots.forEach((s: Slot) => visti.add(s.ora))
        }
        setDisponibilita('pronto')
      })
      .catch(() => setDisponibilita('chiuso'))
  }, [data, orario, orarioFine, haRange, ricorrente, isEventoMode, orarioFisso])

  // ── Navigazione step ──────────────────────────────────────────────────────

  const scrollTop = useCallback(() => {
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [])

  function goToStep(n: number) {
    setStep(n)
    track.stepReached(n, STEP_NAMES[n - 1])
    scrollTop()
  }

  function nextStep() { goToStep(step + 1) }
  function prevStep() { goToStep(step - 1) }

  // ── Submit ────────────────────────────────────────────────────────────────

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
          persone,
          email, telefono,
          note,
          evento: titolo || '',
          preferenza: preferenza || null,
          data_nascita: dataNascita || null,
          consenso_privacy: consensoPrivacy,
          consenso_marketing: consensoMarketing,
        }),
      })
      if (!res.ok) throw new Error()
      track.bookingComplete()
      setStato('successo')
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } catch {
      setErroreMsg('Si è verificato un errore. Riprova o contattaci direttamente.')
      setStato('pronto')
    }
  }

  // ── Slot helpers ──────────────────────────────────────────────────────────

  const slotsDisponibili = fasce.flatMap(f => f.slots).filter(s => !s.pieno)
  const fascePerOrario   = oraSelezionata
    ? fasce.filter(f => f.slots.some(s => s.ora === oraSelezionata))
    : []

  function toggleFascia(nomeFascia: string) {
    setFasceSelezionate(prev =>
      prev.includes(nomeFascia) ? prev.filter(f => f !== nomeFascia) : [...prev, nomeFascia]
    )
  }

  // ── Validazione ───────────────────────────────────────────────────────────

  const step2Valid = (() => {
    if (orarioFisso) return true
    if (disponibilita !== 'pronto') return false
    if (!oraSelezionata) return false
    if (slotsDisponibili.length === 0) return false
    if (!isEventoMode && fascePerOrario.length > 1 && fasceSelezionate.length === 0) return false
    return true
  })()

  const step3Valid = nome.trim() !== ''

  const step4Valid =
    email.trim() !== '' &&
    telefono.trim() !== '' &&
    consensoPrivacy

  // ── Successo ──────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={topRef}>
      {/* Header evento */}
      {isEventoMode && (
        <div className="mb-6">
          <p className="text-black font-semibold" style={{ fontSize: 'var(--text-section)' }}>
            Prenota per {titolo}
          </p>
          {dataFormattata && (
            <p className="text-neutral-500 font-light mt-1" style={{ fontSize: 'var(--text-meta)' }}>
              {dataFormattata}
            </p>
          )}
        </div>
      )}

      <ProgressBar step={step} total={TOTAL_STEPS} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

        {/* ── STEP 1: Ospiti ────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="text-black font-medium mb-6" style={{ fontSize: 'var(--text-section)' }}>
              Quante persone sarete?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: maxPersone }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { handleFirstInteraction(); setPersone(n) }}
                  className={`rounded-btn border font-medium transition-colors ${
                    persone === n
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                  }`}
                  style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                >
                  {n}
                </button>
              ))}
            </div>
            {maxPersone >= 10 && (
              <p className="mt-3 text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                Per gruppi &gt; 10 persone contattaci direttamente.
              </p>
            )}
            <div className="mt-8 flex justify-end">
              <NavButton onClick={nextStep}>Avanti →</NavButton>
            </div>
          </div>
        )}

        {/* ── STEP 2: Data + Orario ─────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <p className="text-black font-medium mb-6" style={{ fontSize: 'var(--text-section)' }}>
              {isEventoMode && !ricorrente ? 'Scegli l\'orario' : 'Quando volete venire?'}
            </p>

            <div className="flex flex-col gap-5">

              {/* Data fissa evento — badge */}
              {isEventoMode && !ricorrente && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn border border-brand/30 bg-brand/5 text-brand self-start"
                  style={{ fontSize: 'var(--text-body)' }}>
                  📅 {dataFormattata || dataLeggibile(data)}
                </div>
              )}

              {/* Date picker — generico o evento ricorrente */}
              {(!isEventoMode || ricorrente) && (
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Seleziona una data</label>
                  <input
                    type="date"
                    required
                    min={oggi()}
                    max={traUnMese()}
                    value={data}
                    onChange={e => {
                      const selected = e.target.value
                      userChangedDate.current = true
                      autoAdvanceRef.current  = 0
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
                    style={{ fontSize: 'var(--text-body)', colorScheme: 'light', minHeight: '48px' }}
                  />
                  {giorniConsentiti.length > 0 && (
                    <p className="mt-2 text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                      Disponibile ogni {giorniConsentiti.map(n => GIORNI[n]).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Orario fisso — badge */}
              {orarioFisso && (
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Orario</label>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn border border-brand/40 bg-brand/10 text-brand font-medium"
                    style={{ fontSize: 'var(--text-body)' }}>
                    🕐 ore {orario}
                  </div>
                </div>
              )}

              {/* Feedback disponibilità */}
              {disponibilita === 'loading' && (
                <p className="text-neutral-500" style={{ fontSize: 'var(--text-meta)' }}>Verifica disponibilità…</p>
              )}

              {disponibilita === 'chiuso' && !ricorrente && (
                <div className="rounded-card border border-black/10 bg-black/3 p-5">
                  <p className="text-black/70 font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                    {isEventoMode ? 'Nessuna disponibilità per questa data.' : 'Il Boogie è chiuso in questa data'}
                  </p>
                  {!isEventoMode && (
                    <p className="text-neutral-600" style={{ fontSize: 'var(--text-meta)' }}>Scegli un altro giorno.</p>
                  )}
                </div>
              )}

              {disponibilita === 'chiuso' && ricorrente && (
                <div className="rounded-card border border-black/10 bg-black/3 p-4">
                  <p className="text-black/70" style={{ fontSize: 'var(--text-body)' }}>
                    Nessuna disponibilità per questa data. Prova un altro giorno.
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
                      className="inline-block bg-brand hover:bg-brand-hover text-black font-medium px-6 rounded-btn transition-colors"
                      style={{ fontSize: 'var(--text-body)', minHeight: '48px', lineHeight: '48px' }}
                    >
                      Prenota per {eventoBloccante.titolo || 'l\'evento'}
                    </a>
                  ) : (
                    <p className="text-brand font-medium">{eventoBloccante.titolo}</p>
                  )}
                </div>
              )}

              {/* Slot orari — bottoni visivi */}
              {disponibilita === 'pronto' && !orarioFisso && (
                <>
                  <div>
                    <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Scegli l&apos;orario</label>
                    {slotsDisponibili.length === 0 ? (
                      <p className="text-black/50 mt-2" style={{ fontSize: 'var(--text-meta)' }}>
                        Nessun orario disponibile per questa data.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const visti = new Set<string>()
                          return fasce.flatMap(fascia =>
                            fascia.slots
                              .filter(slot => { if (visti.has(slot.ora)) return false; visti.add(slot.ora); return true })
                              .map(slot => (
                                <button
                                  key={slot.ora}
                                  type="button"
                                  disabled={slot.pieno}
                                  onClick={() => setOraSelezionata(slot.ora)}
                                  className={`px-5 rounded-btn border font-light transition-colors ${
                                    slot.pieno
                                      ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400'
                                      : oraSelezionata === slot.ora
                                        ? 'border-brand bg-brand/10 text-brand'
                                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                                  }`}
                                  style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                                >
                                  {slot.ora}{slot.pieno ? ' — esaurito' : ''}
                                </button>
                              ))
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Fascia — solo in modalità generica */}
                  {!isEventoMode && fascePerOrario.length > 1 && (
                    <div>
                      <p className="text-neutral-500 font-medium mb-2" style={{ fontSize: 'var(--text-meta)' }}>Per:</p>
                      <div className="flex gap-2">
                        {fascePerOrario.map(f => (
                          <button
                            key={f.fascia}
                            type="button"
                            onClick={() => toggleFascia(f.fascia)}
                            className={`flex-1 px-4 rounded-btn border font-light transition-colors ${
                              fasceSelezionate.includes(f.fascia)
                                ? 'border-brand bg-brand/10 text-brand'
                                : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300'
                            }`}
                            style={{ fontSize: 'var(--text-meta)', minHeight: '48px' }}
                          >
                            {f.fascia}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <NavButton variant="ghost" onClick={prevStep}>← Indietro</NavButton>
              <NavButton onClick={nextStep} disabled={!step2Valid}>Avanti →</NavButton>
            </div>
          </div>
        )}

        {/* ── STEP 3: Dati personali ────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <p className="text-black font-medium mb-6" style={{ fontSize: 'var(--text-section)' }}>
              Diteci chi siete
            </p>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Nome *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                    placeholder="Mario"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Cognome</label>
                  <input
                    type="text"
                    value={cognome}
                    onChange={e => setCognome(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                    placeholder="Rossi"
                  />
                </div>
              </div>

              {!isEventoMode && (
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
                    Preferenza <span className="text-neutral-400 font-light">(opzionale)</span>
                  </label>
                  <div className="flex gap-2">
                    {(['pizza', 'cucina'] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreferenza(prev => prev === v ? '' : v)}
                        className={`flex-1 px-5 rounded-btn border font-light transition-colors capitalize ${
                          preferenza === v
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300'
                        }`}
                        style={{ fontSize: 'var(--text-meta)', minHeight: '48px' }}
                      >
                        {v === 'pizza' ? '🍕 Pizza' : '🍽️ Cucina'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
                  Data di nascita <span className="text-neutral-400 font-light">(opzionale)</span>
                </label>
                <input
                  type="date"
                  value={dataNascita}
                  onChange={e => setDataNascita(e.target.value)}
                  className={inputClass}
                  style={{ fontSize: 'var(--text-body)', colorScheme: 'light', minHeight: '48px' }}
                />
                <p className="mt-1.5 text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
                  🎂 Compilala per ricevere una sorpresa nel mese del tuo compleanno
                </p>
              </div>

              <div>
                <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
                  Note <span className="text-neutral-400 font-light">(opzionale)</span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className={`${inputClass} resize-none`}
                  style={{ fontSize: 'var(--text-body)' }}
                  placeholder="Allergie, richieste particolari, occasione speciale…"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <NavButton variant="ghost" onClick={prevStep}>← Indietro</NavButton>
              <NavButton onClick={nextStep} disabled={!step3Valid}>Avanti →</NavButton>
            </div>
          </div>
        )}

        {/* ── STEP 4: Contatti + Consensi + Submit ──────────────────────── */}
        {step === 4 && (
          <div>
            <p className="text-black font-medium mb-2" style={{ fontSize: 'var(--text-section)' }}>
              Quasi fatto!
            </p>
            <p className="text-neutral-500 font-light mb-6" style={{ fontSize: 'var(--text-body)' }}>
              Come possiamo contattarti per la conferma?
            </p>

            <div className="flex flex-col gap-5">
              {/* Riepilogo */}
              <div className="rounded-card border border-black/8 bg-black/2 p-4 flex flex-col gap-1">
                <p className="text-neutral-500 font-medium mb-1" style={{ fontSize: 'var(--text-meta)' }}>Riepilogo</p>
                {isEventoMode && titolo && (
                  <p className="text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>🎟 {titolo}</p>
                )}
                <p className="text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>
                  📅 {dataFormattata || dataLeggibile(data)}
                </p>
                <p className="text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>🕐 {oraSelezionata}</p>
                <p className="text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>
                  👥 {persone} {persone === 1 ? 'persona' : 'persone'}
                </p>
                {nome && (
                  <p className="text-neutral-700" style={{ fontSize: 'var(--text-meta)' }}>👤 {nome} {cognome}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                    placeholder="mario@esempio.it"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Telefono *</label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className={inputClass}
                    style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
                    placeholder="+39 333 000 0000"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consensoPrivacy}
                    onChange={e => setConsensoPrivacy(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-brand cursor-pointer"
                    style={{ width: '18px', height: '18px' }}
                    required
                  />
                  <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                    Ho letto e accetto la{' '}
                    <a href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                      Privacy Policy
                    </a> *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consensoMarketing}
                    onChange={e => setConsensoMarketing(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-brand cursor-pointer"
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
                    Acconsento a ricevere comunicazioni promozionali da Boogie Bistrot
                  </span>
                </label>
              </div>

              {erroreMsg && (
                <p className="text-red-600" style={{ fontSize: 'var(--text-meta)' }}>{erroreMsg}</p>
              )}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <NavButton variant="ghost" onClick={prevStep}>← Indietro</NavButton>
              <button
                type="submit"
                disabled={stato === 'inviando' || !step4Valid}
                className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-8 rounded-btn transition-colors cursor-pointer"
                style={{ fontSize: 'var(--text-body)', minHeight: '48px' }}
              >
                {stato === 'inviando' ? 'Invio in corso…' : 'Conferma prenotazione'}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  )
}
