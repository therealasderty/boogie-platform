'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDayStatus, type OrarioRecord, type ChiusuraRecord } from '@/lib/orari'


const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

interface CalEvent {
  data: Date | null
  dataFine: Date | null
  giornoSettimana: string
  titolo: string
  descrizione: string
  orario: string
  orarioFine?: string
  ricorrente: boolean
  link: string
  nascondiAltri: boolean
  evidenza: boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function getWeekDates(offset = 0): Date[] {
  const today = new Date()
  today.setDate(today.getDate() + offset * 7)
  const monday = getMonday(today)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}


function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function inRange(date: Date, start: Date, end: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return d >= s && d <= e
}

function parseDate(raw: string): Date | null {
  const str = raw.toString().trim()
  if (!str) return null
  const parts = str.split(/[\/\-\.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    // ISO format YYYY-MM-DD (first part is year, 4 digits)
    if (parts[0].length === 4) {
      return new Date(a, b - 1, c)
    }
    // Legacy m/d/y format
    const year = c < 100 ? c + 2000 : c
    return new Date(year, a - 1, b)
  }
  const date = new Date(str)
  return isNaN(date.getTime()) ? null : date
}

function getEventsForDay(date: Date, allEvents: CalEvent[], status?: ReturnType<typeof getDayStatus>): CalEvent[] {
  const isClosed = status === 'chiuso' || status === 'chiusura-straordinaria'
  const dayName = DAY_NAMES[date.getDay()]
  const events: CalEvent[] = []

  for (const ev of allEvents) {
    if (ev.ricorrente) {
      if (isClosed) continue  // eventi ricorrenti non appaiono nei giorni chiusi
      const giorni = ev.giornoSettimana.toLowerCase()
      if (giorni === 'tutti' || giorni.split(',').map(g => g.trim()).includes(dayName.toLowerCase())) {
        events.push(ev)
      }
    } else if (ev.data) {
      if (ev.dataFine) {
        if (inRange(date, ev.data, ev.dataFine)) events.push(ev)
      } else {
        if (isSameDay(ev.data, date)) events.push(ev)
      }
    }
  }

  const override = events.find(e => e.nascondiAltri)
  if (override) return [override]
  // Sort by orario first, then one-time before recurring as tiebreaker
  return [...events].sort((a, b) => {
    const aTime = a.orario || '00:00'
    const bTime = b.orario || '00:00'
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    return Number(a.ricorrente) - Number(b.ricorrente)
  })
}

// ── Fascia helpers ────────────────────────────────────────────────────────────

interface FasciaSlot { inizio: string; fine: string }

function mergeFasciaSlots(slots: FasciaSlot[]): FasciaSlot[] {
  const sorted = [...slots].sort((a, b) => a.inizio.localeCompare(b.inizio))
  const merged: FasciaSlot[] = []
  for (const slot of sorted) {
    const last = merged[merged.length - 1]
    if (last && slot.inizio <= last.fine) { if (slot.fine > last.fine) last.fine = slot.fine }
    else merged.push({ ...slot })
  }
  return merged
}

function formatSlots(slots: FasciaSlot[]): string {
  return slots.map(s => `${s.inizio}–${s.fine}`).join(' · ')
}

function getFasceForDay(date: Date, orari: OrarioRecord[]): {
  pranzo: FasciaSlot[]
  cena: FasciaSlot[]
  hasFasce: boolean
} {
  const dayOfWeek = date.getDay()
  const attivi = orari.filter(o => o.attivo && o.giorno === dayOfWeek && o.oraInizio && o.oraFine)
  const pranzoRaw = attivi.filter(o => o.fascia?.toLowerCase() === 'pranzo').map(o => ({ inizio: o.oraInizio, fine: o.oraFine }))
  const cenaRaw   = attivi.filter(o => o.fascia?.toLowerCase() === 'cena').map(o => ({ inizio: o.oraInizio, fine: o.oraFine }))
  const pranzo = mergeFasciaSlots(pranzoRaw)
  const cena   = mergeFasciaSlots(cenaRaw)
  return { pranzo, cena, hasFasce: pranzo.length > 0 || cena.length > 0 }
}

function getEventFascia(ev: CalEvent, hasPranzo: boolean, hasCena: boolean): 'pranzo' | 'cena' | 'any' {
  if (!ev.orario) return 'any'
  if (hasPranzo && hasCena) return ev.orario >= '16:00' ? 'cena' : 'pranzo'
  if (hasPranzo) return 'pranzo'
  if (hasCena) return 'cena'
  return 'any'
}

// ── EventCard ─────────────────────────────────────────────────────────────────

// Tier 1: one-time → brand gold, max prominence
// Tier 2: ricorrente 1 giorno/settimana → bianco medio
// Tier 3: ricorrente più giorni / tutti → bianco molto attenuato
function getRicorrenteType(ev: CalEvent): 'single' | 'multi' {
  const g = ev.giornoSettimana?.toLowerCase() || ''
  if (g === 'tutti' || g.includes(',')) return 'multi'
  return 'single'
}

function EventCard({ ev }: { ev: CalEvent }) {
  const isChiuso = ev.titolo.toLowerCase().includes('chiuso')

  let borderColor: string
  let bgColor: string
  let titleColor: string
  let metaColor: string
  let hoverBg: string
  let showBadge = false

  if (isChiuso) {
    borderColor = 'border-white/10'
    bgColor     = 'bg-transparent'
    titleColor  = 'text-white/25'
    metaColor   = 'text-white/15'
    hoverBg     = ''
  } else if (!ev.ricorrente) {
    // Tier 1 — evento speciale una tantum
    borderColor = 'border-brand'
    bgColor     = 'bg-brand/10'
    titleColor  = 'text-brand'
    metaColor   = 'text-brand/60'
    hoverBg     = 'hover:bg-brand/20'
  } else if (getRicorrenteType(ev) === 'single') {
    // Tier 2 — ricorrente fisso 1 giorno
    borderColor = 'border-white/35'
    bgColor     = 'bg-white/[0.06]'
    titleColor  = 'text-white/75'
    metaColor   = 'text-white/40'
    hoverBg     = 'hover:bg-white/[0.10]'
    showBadge   = true
  } else {
    // Tier 3 — ricorrente multi-giorno / quotidiano
    borderColor = 'border-white/15'
    bgColor     = 'bg-transparent'
    titleColor  = 'text-white/40'
    metaColor   = 'text-white/25'
    hoverBg     = 'hover:bg-white/[0.04]'
  }

  const giornoLabel = ev.giornoSettimana
    ? ev.giornoSettimana.charAt(0).toUpperCase() + ev.giornoSettimana.slice(1).toLowerCase()
    : ''

  const inner = (
    <div className={`border-l-2 ${borderColor} ${bgColor} rounded-btn px-3 py-2.5 text-left transition-colors ${ev.link && !isChiuso ? hoverBg : ''}`}>
      {ev.orario && (
        <div className={`text-xs ${metaColor} mb-1 font-medium`}>
          {ev.orario}{ev.orarioFine ? `–${ev.orarioFine}` : ''}
        </div>
      )}
      <div className={`text-sm font-semibold leading-snug ${titleColor}`}>{ev.titolo}</div>
      {ev.descrizione && !isChiuso && (
        <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{ev.descrizione}</div>
      )}
      {showBadge && giornoLabel && (
        <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-pill ${ev.evidenza ? 'bg-brand/15 text-brand/80' : 'bg-white/8 text-white/30'}`}>
          ogni {giornoLabel}
        </span>
      )}
    </div>
  )

  if (ev.link) {
    return (
      <a href={ev.link} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }
  return inner
}

function MenuLink() {
  return (
    <div className="px-2 py-1.5 text-[11px] text-white/20 leading-relaxed">
      <Link href="/#menu" className="underline decoration-white/15 hover:text-white/40 hover:decoration-white/30 transition-colors">
        Carta e pizze
      </Link>
    </div>
  )
}

function FasciaHeader({ label, slots }: { label: string; slots: FasciaSlot[] }) {
  return (
    <div className="flex items-center gap-2 border-t border-neutral-700/60 pt-2 mt-1">
      <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">{label}</span>
      {slots.length > 0 && (
        <span className="text-[10px] text-neutral-600">{formatSlots(slots)}</span>
      )}
    </div>
  )
}

// ── DayColumn ─────────────────────────────────────────────────────────────────

function DayColumn({ date, events, isToday, status, orari }: {
  date: Date
  events: CalEvent[]
  isToday: boolean
  status: ReturnType<typeof getDayStatus>
  orari: OrarioRecord[]
}) {
  const isClosed = status === 'chiuso' || status === 'chiusura-straordinaria'
  const { pranzo: pranzoSlots, cena: cenaSlots, hasFasce } = getFasceForDay(date, orari)

  // Categorize events by fascia
  const hasPranzo = pranzoSlots.length > 0
  const hasCena   = cenaSlots.length > 0

  const pranzoEvents = hasFasce ? events.filter(ev => getEventFascia(ev, hasPranzo, hasCena) === 'pranzo') : []
  const cenaEvents   = hasFasce ? events.filter(ev => getEventFascia(ev, hasPranzo, hasCena) === 'cena')   : []
  const anyEvents    = hasFasce ? events.filter(ev => getEventFascia(ev, hasPranzo, hasCena) === 'any')    : events

  return (
    <div className="flex flex-col min-h-48 border-r border-neutral-800 last:border-r-0">
      <div className={`px-3 py-3 text-center border-b border-neutral-800 flex flex-col items-center justify-center h-[72px] ${isToday ? 'bg-brand' : 'bg-neutral-900'}`}>
        <div className={`text-[10px] uppercase tracking-widest font-semibold leading-none ${isToday ? 'text-black/50' : 'text-neutral-500'}`}>
          {DAY_NAMES[date.getDay()]}
        </div>
        <div className={`text-2xl font-bold leading-none mt-1.5 ${isToday ? 'text-black' : isClosed ? 'text-neutral-600' : 'text-white'}`}>
          {date.getDate()}
        </div>
        {(isClosed) && (
          <div className="h-4 flex items-center justify-center mt-1">
            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${status === 'chiusura-straordinaria' ? 'bg-red-900/60 text-red-400' : 'bg-neutral-700 text-neutral-400'}`}>
              Chiuso
            </span>
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-2 p-2.5 flex-1 bg-neutral-800 ${isToday ? 'border-x border-b border-brand/40 rounded-b-card' : ''}`}>
        {isClosed && events.length === 0 && (
          <div className="text-xs text-neutral-300 text-center mt-3">—</div>
        )}

        {/* Uncategorized events (no orario) always at top */}
        {anyEvents.map((ev, i) => <EventCard key={`any-${i}`} ev={ev} />)}

        {!isClosed && hasFasce ? (
          <>
            {hasPranzo && (
              <>
                <FasciaHeader label="Pranzo" slots={pranzoSlots} />
                {pranzoEvents.map((ev, i) => <EventCard key={`p-${i}`} ev={ev} />)}
                <MenuLink />
              </>
            )}
            {hasCena && (
              <>
                <FasciaHeader label="Cena" slots={cenaSlots} />
                {cenaEvents.map((ev, i) => <EventCard key={`c-${i}`} ev={ev} />)}
                <MenuLink />
              </>
            )}
          </>
        ) : !isClosed ? (
          <>
            {events.length > 0 && <div className="border-t border-neutral-700/50 mt-1 pt-1" />}
            <MenuLink />
          </>
        ) : null}
      </div>
    </div>
  )
}

// ── MonthPicker ───────────────────────────────────────────────────────────────

function MonthPicker({
  baseDate,
  allEvents,
  onSelect,
  onClose,
}: {
  baseDate: Date
  allEvents: CalEvent[]
  onSelect: (d: Date) => void
  onClose: () => void
}) {
  const [view, setView] = useState(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1))
  const today = new Date()

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-card p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-btn bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-neutral-800 font-semibold">{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setView(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-btn bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-center text-[11px] text-neutral-400 py-1 font-medium">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: startOffset }, (_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1)
            const isToday = isSameDay(d, today)
            const hasEv = getEventsForDay(d, allEvents).length > 0
            return (
              <button
                key={i}
                onClick={() => { onSelect(d); onClose() }}
                className={`aspect-square flex flex-col items-center justify-center rounded-pill text-sm relative
                  ${isToday ? 'bg-brand text-black font-bold' : 'text-neutral-700 hover:bg-neutral-100'}`}
              >
                {i + 1}
                {hasEv && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-pill ${isToday ? 'bg-black/30' : 'bg-brand'}`} />
                )}
              </button>
            )
          })}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-2.5 bg-neutral-100 text-neutral-500 text-sm rounded-btn hover:bg-neutral-200 transition-colors">
          Chiudi
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Calendario({ orari = [], chiusure = [] }: { orari?: OrarioRecord[]; chiusure?: ChiusuraRecord[] }) {
  const [allEvents, setAllEvents] = useState<CalEvent[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [weekOffset, setWeekOffset] = useState(0)
  const [mobileDate, setMobileDate] = useState(() => new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/agenda')
      .then(r => r.json())
      .then((json: { success: boolean; events: Array<{
        data: string | null
        dataFine: string | null
        giornoSettimana: string
        titolo: string
        descrizione: string
        orario: string
        orarioFine?: string
        ricorrente: boolean
        link: string
        nascondiAltri: boolean
        evidenza: boolean
      }> }) => {
        if (!json.success || !json.events) { setStatus('error'); return }
        const events: CalEvent[] = json.events
          .filter(e => e.titolo)
          .map(e => ({
            ...e,
            data:     e.data ? parseDate(e.data) : null,
            dataFine: e.dataFine ? parseDate(e.dataFine) : null,
          }))
        setAllEvents(events)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const today = new Date()
  const weekDates = getWeekDates(weekOffset)
  const firstDay = weekDates[0]
  const lastDay = weekDates[6]

  const weekLabel = `${firstDay.getDate()} ${MONTH_NAMES[firstDay.getMonth()]} — ${lastDay.getDate()} ${MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`
  const mobileDateLabel = `${DAY_NAMES[mobileDate.getDay()]} ${mobileDate.getDate()} ${MONTH_NAMES[mobileDate.getMonth()]} ${mobileDate.getFullYear()}`

  return (
    <section id="calendario" className="bg-neutral-800 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-white mb-10" style={{ fontSize: 'var(--text-section)' }}>
          {isMobile ? 'Appuntamenti del giorno' : 'Gli appuntamenti della settimana'}
        </h2>

        <div className="rounded-card overflow-hidden border border-neutral-800 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">

          {/* Navigation bar */}
          <div className="bg-neutral-900 border-b border-neutral-800 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-sm text-neutral-300 font-medium">
              {isMobile ? mobileDateLabel : weekLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => isMobile
                  ? setMobileDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
                  : setWeekOffset(o => o - 1)
                }
                className="h-9 px-4 rounded-btn bg-neutral-800 text-white/70 text-xs font-medium hover:bg-neutral-700 transition-colors"
              >
                ←
              </button>

              <button
                onClick={() => { setWeekOffset(0); setMobileDate(new Date()) }}
                className="h-9 px-4 rounded-btn bg-neutral-800 text-white/70 text-xs font-medium hover:bg-neutral-700 transition-colors"
              >
                Oggi
              </button>

              <button
                onClick={() => isMobile
                  ? setMobileDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
                  : setWeekOffset(o => o + 1)
                }
                className="h-9 px-4 rounded-btn bg-neutral-800 text-white/70 text-xs font-medium hover:bg-neutral-700 transition-colors"
              >
                →
              </button>

              {isMobile && (
                <button
                  onClick={() => setShowMonthPicker(true)}
                  className="h-9 w-9 rounded-btn bg-neutral-800 text-white/70 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                  aria-label="Apri calendario"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M1 7h14M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {status === 'loading' && (
            <div className="bg-neutral-900 py-16 text-center text-neutral-500 text-sm">
              Caricamento eventi...
            </div>
          )}

          {status === 'error' && (
            <div className="bg-neutral-900 py-16 text-center text-rose-400 text-sm">
              Errore nel caricamento degli eventi.
            </div>
          )}

          {status === 'ready' && (
            <>
              <div className="hidden sm:grid grid-cols-7">
                {weekDates.map((date) => {
                  const s = getDayStatus(date, orari, chiusure)
                  return (
                    <DayColumn
                      key={date.toISOString()}
                      date={date}
                      events={getEventsForDay(date, allEvents, s)}
                      isToday={isSameDay(date, today)}
                      status={s}
                      orari={orari}
                    />
                  )
                })}
              </div>

              <div className="sm:hidden">
                {(() => {
                  const s = getDayStatus(mobileDate, orari, chiusure)
                  return (
                    <DayColumn
                      date={mobileDate}
                      events={getEventsForDay(mobileDate, allEvents, s)}
                      isToday={isSameDay(mobileDate, today)}
                      status={s}
                      orari={orari}
                    />
                  )
                })()}
              </div>
            </>
          )}
        </div>

      </div>

      {showMonthPicker && (
        <MonthPicker
          baseDate={mobileDate}
          allEvents={allEvents}
          onSelect={setMobileDate}
          onClose={() => setShowMonthPicker(false)}
        />
      )}
    </section>
  )
}
