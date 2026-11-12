'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getDayStatus, type OrarioRecord, type ChiusuraRecord } from '@/lib/orari'

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
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
  descrizioneBreve: string
  orario: string
  orarioFine?: string
  ricorrente: boolean
  link: string
  nascondiAltri: boolean
  evidenza: boolean
  fotoHero: string
}

interface RawApiEvent {
  data: string | null
  dataFine: string | null
  giornoSettimana: string
  titolo: string
  descrizione: string
  descrizioneBreve: string
  orario: string
  orarioFine?: string
  ricorrente: boolean
  link: string
  nascondiAltri: boolean
  evidenza: boolean
  fotoHero: string
}

// ── helpers ──────────────────────────────────────────────────────────────────

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
    if (parts[0].length === 4) return new Date(a, b - 1, c)
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
      if (isClosed) continue
      // Non mostrare se la data d'inizio è nel futuro rispetto al giorno visualizzato
      if (ev.data && ev.data.getTime() > date.getTime()) continue
      // Non mostrare se la data fine è nel passato rispetto al giorno visualizzato
      if (ev.dataFine && ev.dataFine.getTime() < date.getTime()) continue
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
  return events
}

function getTodayWeekIdx(): number {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

// ── Fascia helpers ───────────────────────────────────────────────────────────

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

function getFasceForDay(date: Date, orari: OrarioRecord[]): { pranzo: FasciaSlot[]; cena: FasciaSlot[] } {
  const dayOfWeek = date.getDay()
  const attivi = orari.filter(o => o.attivo && o.giorno === dayOfWeek && o.oraInizio && o.oraFine)
  const pranzo = mergeFasciaSlots(attivi.filter(o => o.fascia?.toLowerCase() === 'pranzo').map(o => ({ inizio: o.oraInizio, fine: o.oraFine })))
  const cena = mergeFasciaSlots(attivi.filter(o => o.fascia?.toLowerCase() === 'cena').map(o => ({ inizio: o.oraInizio, fine: o.oraFine })))
  return { pranzo, cena }
}

// ── Badge label ──────────────────────────────────────────────────────────────

const ORDINE_SETT = [1, 2, 3, 4, 5, 6, 0] // Lun → Dom

/** Map Italian day name → JS day index (0=dom … 6=sab) */
function dayNameToIndex(name: string): number {
  const map: Record<string, number> = {
    domenica: 0, lunedì: 1, martedì: 2, mercoledì: 3,
    giovedì: 4, venerdì: 5, sabato: 6,
  }
  return map[name.toLowerCase()] ?? -1
}

function formatDayRange(indices: number[]): string {
  if (indices.length === 0) return ''
  if (indices.length === 7) return 'Tutti i giorni'
  const sorted = ORDINE_SETT.filter(g => indices.includes(g))
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return `Ogni ${DAY_NAMES[sorted[0]].toLowerCase()}`

  // Build contiguous ranges
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETT.indexOf(sorted[j + 1]) === ORDINE_SETT.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1
      ? DAY_SHORT[chunk[0]]
      : `${DAY_SHORT[chunk[0]]}–${DAY_SHORT[chunk[chunk.length - 1]]}`)
    i = j + 1
  }

  // If it's a single range covering most of the week, show excluded days instead
  const all7 = new Set(ORDINE_SETT)
  const present = new Set(sorted)
  const excluded = ORDINE_SETT.filter(d => !present.has(d))
  if (excluded.length <= 2 && sorted.length >= 5) {
    const rangeLabel = `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted[sorted.length - 1]]}`
    const exclLabel = excluded.map(d => DAY_SHORT[d].toLowerCase()).join(', ')
    return excluded.length > 0 ? `${rangeLabel} (escl. ${exclLabel})` : rangeLabel
  }

  return ranges.join(', ')
}

function formatEventBadge(ev: CalEvent): string {
  if (ev.ricorrente) {
    const dayNames = ev.giornoSettimana.split(',').map(g => g.trim()).filter(Boolean)
    const indices = dayNames.map(dayNameToIndex).filter(i => i >= 0)
    return formatDayRange(indices)
  }
  if (ev.data) {
    return `${DAY_NAMES[ev.data.getDay()]} ${ev.data.getDate()} ${MONTH_NAMES[ev.data.getMonth()]}`
  }
  return ''
}

// ── Closed label ─────────────────────────────────────────────────────────────

function closedLabel(status: ReturnType<typeof getDayStatus>): string {
  return status === 'chiusura-straordinaria' ? 'Chiusura straordinaria' : 'Chiuso'
}

// ── EventCard (large) ────────────────────────────────────────────────────────

function EventCard({ ev }: { ev: CalEvent }) {
  const badge = formatEventBadge(ev)
  const desc = ev.descrizioneBreve || ev.descrizione

  const card = (
    <div className={`group flex gap-4 p-4 rounded-card border transition-shadow ${
      !ev.ricorrente
        ? 'border-amber-200 bg-amber-50/50 hover:shadow-md'
        : 'border-neutral-100 bg-white hover:shadow-md'
    } ${ev.link ? 'cursor-pointer' : ''}`}>
      {ev.fotoHero && (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-btn overflow-hidden bg-neutral-100">
          <Image
            src={ev.fotoHero}
            alt={ev.titolo}
            fill
            sizes="(min-width: 640px) 96px, 80px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0">
        <h3
          className={`font-semibold leading-snug ${!ev.ricorrente ? 'text-amber-900' : 'text-neutral-800'}`}
          style={{ fontSize: 'var(--text-meta)' }}
        >
          {ev.titolo}
        </h3>
        {desc && (
          <p
            className="text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed"
            style={{ fontSize: 'var(--text-label)' }}
          >
            {desc}
          </p>
        )}
        {badge && (
          <span
            className={`inline-block mt-1.5 px-2 py-0.5 rounded-pill w-fit ${
              ev.ricorrente ? 'bg-neutral-100 text-neutral-500' : 'bg-amber-100 text-amber-700'
            }`}
            style={{ fontSize: '0.65rem', fontWeight: 500 }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )

  if (ev.link) return <Link href={ev.link} className="block">{card}</Link>
  return card
}

// ── CompactEventCard (small) ─────────────────────────────────────────────────

function CompactEventCard({ ev }: { ev: CalEvent }) {
  const badge = formatEventBadge(ev)
  const inner = (
    <div className={`group flex items-center gap-2.5 p-2 rounded-btn transition-colors ${
      !ev.ricorrente ? 'bg-amber-50/60' : 'bg-neutral-50'
    } ${ev.link ? 'hover:bg-neutral-100 cursor-pointer' : ''}`}>
      {ev.fotoHero && (
        <div className="relative w-9 h-9 flex-shrink-0 rounded overflow-hidden bg-neutral-200">
          <Image src={ev.fotoHero} alt={ev.titolo} fill sizes="36px" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span
          className={`font-medium leading-snug ${!ev.ricorrente ? 'text-amber-900' : 'text-neutral-700'}`}
          style={{ fontSize: 'var(--text-label)' }}
        >
          {ev.titolo}
        </span>
        {badge && (
          <span
            className={`mt-0.5 ${ev.ricorrente ? 'text-neutral-400' : 'text-amber-600'}`}
            style={{ fontSize: '0.6rem' }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
  if (ev.link) return <Link href={ev.link} className="block">{inner}</Link>
  return inner
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Calendario({ orari = [], chiusure = [] }: { orari?: OrarioRecord[]; chiusure?: ChiusuraRecord[] }) {
  const [allEvents, setAllEvents] = useState<CalEvent[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIdx, setSelectedDayIdx] = useState(getTodayWeekIdx)

  useEffect(() => {
    fetch('/api/agenda')
      .then(r => r.json())
      .then((json: { success: boolean; events: RawApiEvent[] }) => {
        if (!json.success || !json.events) { setLoadStatus('error'); return }
        const events: CalEvent[] = json.events
          .filter(e => e.titolo)
          .map(e => ({
            ...e,
            data: e.data ? parseDate(e.data) : null,
            dataFine: e.dataFine ? parseDate(e.dataFine) : null,
            descrizioneBreve: e.descrizioneBreve ?? '',
            fotoHero: e.fotoHero ?? '',
          }))
        setAllEvents(events)
        setLoadStatus('ready')
      })
      .catch(() => setLoadStatus('error'))
  }, [])

  const today = new Date()
  const weekDates = getWeekDates(weekOffset)
  const firstDay = weekDates[0]
  const lastDay = weekDates[6]
  const selectedDate = weekDates[selectedDayIdx]
  const isSelectedToday = isSameDay(selectedDate, today)

  const weekLabel = firstDay.getMonth() === lastDay.getMonth()
    ? `${firstDay.getDate()}–${lastDay.getDate()} ${MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`
    : `${firstDay.getDate()} ${MONTH_NAMES[firstDay.getMonth()]} – ${lastDay.getDate()} ${MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`

  // Selected day data
  const selectedStatus = getDayStatus(selectedDate, orari, chiusure)
  const selectedIsClosed = selectedStatus === 'chiuso' || selectedStatus === 'chiusura-straordinaria'
  const selectedEvents = selectedIsClosed
    ? []
    : getEventsForDay(selectedDate, allEvents, selectedStatus)
        .filter(ev => !ev.titolo.toLowerCase().includes('chiuso'))
  const { pranzo: selectedPranzo, cena: selectedCena } = getFasceForDay(selectedDate, orari)

  // All other active events this week (deduplicated vs selected day)
  // Exclude events whose start date is after the end of this week
  const lastDayEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59)
  const seenTitles = new Set(selectedEvents.map(ev => ev.titolo))
  const otherWeekEvents: CalEvent[] = []
  for (const date of weekDates) {
    if (isSameDay(date, selectedDate)) continue
    const status = getDayStatus(date, orari, chiusure)
    for (const ev of getEventsForDay(date, allEvents, status)) {
      if (ev.titolo.toLowerCase().includes('chiuso')) continue
      if (ev.data && ev.data.getTime() > lastDayEnd.getTime()) continue
      if (!seenTitles.has(ev.titolo)) {
        seenTitles.add(ev.titolo)
        otherWeekEvents.push(ev)
      }
    }
  }

  function handleWeekChange(delta: number) {
    const newOffset = weekOffset + delta
    setWeekOffset(newOffset)
    const newWeek = getWeekDates(newOffset)
    const todayIdx = newWeek.findIndex(d => isSameDay(d, today))
    setSelectedDayIdx(todayIdx >= 0 ? todayIdx : 0)
  }

  function handleToday() {
    setWeekOffset(0)
    setSelectedDayIdx(getTodayWeekIdx())
  }

  return (
    <section id="calendario" className="py-16 md:py-20" style={{ backgroundColor: 'var(--color-surface-warm)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-neutral-900 mb-10" style={{ fontSize: 'var(--text-section)' }}>
          Gli appuntamenti della settimana
        </h2>

        <div className="rounded-card overflow-hidden border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">

          {/* ── Navigation bar ── */}
          <div className="bg-white border-b border-neutral-100 px-5 py-4 flex items-center justify-between gap-3">
            <span className="text-neutral-600 font-medium hidden sm:block" style={{ fontSize: 'var(--text-meta)' }}>
              {weekLabel}
            </span>
            <span className="text-neutral-600 font-medium sm:hidden" style={{ fontSize: 'var(--text-label)' }}>
              {weekLabel}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleWeekChange(-1)}
                className="h-9 px-4 rounded-btn bg-neutral-100 text-neutral-600 font-medium hover:bg-neutral-200 transition-colors"
                style={{ fontSize: 'var(--text-label)' }}
              >
                ←
              </button>
              <button
                onClick={handleToday}
                className="h-9 px-4 rounded-btn bg-neutral-100 text-neutral-600 font-medium hover:bg-neutral-200 transition-colors"
                style={{ fontSize: 'var(--text-label)' }}
              >
                Oggi
              </button>
              <button
                onClick={() => handleWeekChange(1)}
                className="h-9 px-4 rounded-btn bg-neutral-100 text-neutral-600 font-medium hover:bg-neutral-200 transition-colors"
                style={{ fontSize: 'var(--text-label)' }}
              >
                →
              </button>
            </div>
          </div>

          {/* ── Mobile: day pills ── */}
          <div className="sm:hidden flex bg-white border-b border-neutral-100">
            {weekDates.map((date, idx) => {
              const isSelected = idx === selectedDayIdx
              const isToday = isSameDay(date, today)
              const status = getDayStatus(date, orari, chiusure)
              const isClosed = status === 'chiuso' || status === 'chiusura-straordinaria'

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`flex-1 flex flex-col items-center py-3 transition-colors relative cursor-pointer ${
                    isSelected ? 'bg-neutral-800' : ''
                  }`}
                >
                  <span
                    className={`uppercase font-semibold leading-none ${
                      isSelected ? 'text-white/50' : 'text-neutral-400'
                    }`}
                    style={{ fontSize: 'var(--text-tiny)', letterSpacing: 'var(--tracking-label)' }}
                  >
                    {DAY_SHORT[date.getDay()]}
                  </span>
                  <span
                    className={`text-lg font-bold leading-none mt-1 ${
                      isSelected
                        ? isClosed ? 'text-white/40 line-through' : 'text-white'
                        : isClosed ? 'text-neutral-300 line-through' : 'text-neutral-800'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-pill bg-brand" />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Desktop: orari grid (clickable) ── */}
          <div className="hidden sm:block bg-white">
            <div className="grid grid-cols-7">
              {weekDates.map((date, idx) => {
                const isSelected = idx === selectedDayIdx
                const isToday = isSameDay(date, today)
                const status = getDayStatus(date, orari, chiusure)
                const isClosed = status === 'chiuso' || status === 'chiusura-straordinaria'
                const isSpecialOpen = status === 'apertura-straordinaria'
                const { pranzo, cena } = getFasceForDay(date, orari)
                const hasSlots = pranzo.length > 0 || cena.length > 0

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex flex-col items-center py-4 px-2 border-r border-neutral-100 last:border-r-0 transition-colors relative cursor-pointer ${
                      isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <span
                      className={`uppercase tracking-widest font-semibold leading-none ${
                        isSelected ? 'text-white/50' : 'text-neutral-400'
                      }`}
                      style={{ fontSize: 'var(--text-tiny)', letterSpacing: 'var(--tracking-label)' }}
                    >
                      {DAY_SHORT[date.getDay()]}
                    </span>
                    <span
                      className={`text-xl font-bold leading-none mt-1.5 ${
                        isSelected
                          ? isClosed ? 'text-white/40 line-through' : 'text-white'
                          : isClosed ? 'text-neutral-300 line-through' : 'text-neutral-800'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {isToday && !isSelected && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-pill bg-brand" />
                    )}
                    <div className="mt-3 text-center" style={{ fontSize: 'var(--text-label)' }}>
                      {isClosed ? (
                        <span className={`font-medium leading-tight ${
                          status === 'chiusura-straordinaria'
                            ? isSelected ? 'text-red-300' : 'text-red-400'
                            : isSelected ? 'text-white/40' : 'text-neutral-300'
                        }`}>
                          {closedLabel(status)}
                        </span>
                      ) : hasSlots ? (
                        <div className={`flex flex-col gap-0.5 ${isSelected ? 'text-white/60' : 'text-neutral-500'}`}>
                          {pranzo.map((s, i) => <span key={`p-${i}`}>{s.inizio}–{s.fine}</span>)}
                          {cena.map((s, i) => <span key={`c-${i}`}>{s.inizio}–{s.fine}</span>)}
                        </div>
                      ) : isSpecialOpen ? (
                        <span className={`font-medium ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                          Aperto
                        </span>
                      ) : (
                        <span className={isSelected ? 'text-white/30' : 'text-neutral-300'}>—</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Loading / Error ── */}
          {loadStatus === 'loading' && (
            <div className="bg-white py-12 text-center text-neutral-400 border-t border-neutral-100" style={{ fontSize: 'var(--text-meta)' }}>
              Caricamento eventi...
            </div>
          )}
          {loadStatus === 'error' && (
            <div className="bg-white py-12 text-center text-red-400 border-t border-neutral-100" style={{ fontSize: 'var(--text-meta)' }}>
              Errore nel caricamento degli eventi.
            </div>
          )}

          {/* ── Selected day events ── */}
          {loadStatus === 'ready' && (
            <>
              <div className="bg-white border-t border-neutral-100 p-5">
                {/* Day heading */}
                <div className="flex items-baseline gap-2 mb-3">
                  {isSelectedToday && (
                    <span
                      className="uppercase tracking-widest font-bold text-neutral-800"
                      style={{ fontSize: 'var(--text-tiny)', letterSpacing: 'var(--tracking-label)' }}
                    >
                      Oggi
                    </span>
                  )}
                  <span
                    className={isSelectedToday ? 'text-neutral-400' : 'text-neutral-600 font-semibold'}
                    style={{ fontSize: 'var(--text-label)' }}
                  >
                    {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}
                  </span>
                </div>

                {/* Mobile: inline orari for selected day */}
                <div className="sm:hidden mb-4">
                  {selectedIsClosed ? (
                    <span className={`font-medium ${
                      selectedStatus === 'chiusura-straordinaria' ? 'text-red-500' : 'text-neutral-400'
                    }`} style={{ fontSize: 'var(--text-label)' }}>
                      {closedLabel(selectedStatus)}
                    </span>
                  ) : (selectedPranzo.length > 0 || selectedCena.length > 0) ? (
                    <div className="flex items-center gap-3 text-neutral-500" style={{ fontSize: 'var(--text-label)' }}>
                      {selectedPranzo.map((s, i) => <span key={`p-${i}`}>{s.inizio}–{s.fine}</span>)}
                      {selectedPranzo.length > 0 && selectedCena.length > 0 && <span className="text-neutral-300">·</span>}
                      {selectedCena.map((s, i) => <span key={`c-${i}`}>{s.inizio}–{s.fine}</span>)}
                    </div>
                  ) : null}
                </div>

                {/* Events for selected day */}
                {selectedIsClosed ? (
                  <div className="py-6 text-center">
                    <span
                      className={`font-medium ${selectedStatus === 'chiusura-straordinaria' ? 'text-red-400' : 'text-neutral-400'}`}
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {closedLabel(selectedStatus)}
                    </span>
                  </div>
                ) : selectedEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvents.map(ev => <EventCard key={ev.titolo} ev={ev} />)}
                  </div>
                ) : (
                  <div className="py-6 text-center text-neutral-400" style={{ fontSize: 'var(--text-meta)' }}>
                    Nessun appuntamento
                  </div>
                )}
              </div>

              {/* ── Other week events — compact ── */}
              {otherWeekEvents.length > 0 && (
                <div className="bg-white border-t border-neutral-100 p-5">
                  <div
                    className="uppercase tracking-widest font-bold text-neutral-400 mb-3"
                    style={{ fontSize: 'var(--text-tiny)', letterSpacing: 'var(--tracking-label)' }}
                  >
                    Altro questa settimana
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {otherWeekEvents.map(ev => <CompactEventCard key={ev.titolo} ev={ev} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
