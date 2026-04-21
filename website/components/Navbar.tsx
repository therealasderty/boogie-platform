'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import type { EventoAgenda } from '@/lib/agenda'
import { usePageContext } from '@/lib/page-context'

const MESI_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const MESI_FULL  = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const GIORNI_BREVI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const GIORNI_LABEL = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const GIORNI_FULL  = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const GIORNI_ESTESI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const ORDINE_SETTIMANA = [1, 2, 3, 4, 5, 6, 0]

function formatDataShort(dataStr: string): string {
  const d = new Date(dataStr + 'T00:00:00')
  return `${GIORNI_ESTESI[d.getDay()]} ${d.getDate()} ${MESI_FULL[d.getMonth()]}`
}

function formatGiorniSettimana(giorniStr: string): string {
  const nums = giorniStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
  if (nums.length === 0) return ''
  const sorted = ORDINE_SETTIMANA.filter(g => nums.includes(g))
  // Build ranges
  const ranges: string[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j + 1 < sorted.length && ORDINE_SETTIMANA.indexOf(sorted[j + 1]) === ORDINE_SETTIMANA.indexOf(sorted[j]) + 1) j++
    const chunk = sorted.slice(i, j + 1)
    ranges.push(chunk.length === 1 ? GIORNI_LABEL[chunk[0]] : `${GIORNI_LABEL[chunk[0]]}–${GIORNI_LABEL[chunk[chunk.length - 1]]}`)
    i = j + 1
  }
  return ranges.join(', ')
}

function formatRicorrente(e: EventoAgenda, giorniChiusi: number[] = []): string {
  let label = 'ricorrente'
  if (e.ricorrenza === 'giornaliera') {
    const esclusiEvento = e.giorniEsclusione
      ? e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n))
      : []
    // Range base = tutti i giorni meno quelli chiusi per orari ordinari
    const baseDays = ORDINE_SETTIMANA.filter(g => !(giorniChiusi ?? []).includes(g))
    label = formatGiorniSettimana(baseDays.join(','))
    // Aggiungi esclusioni specifiche dell'evento
    if (esclusiEvento.length > 0) {
      const nomi = esclusiEvento.map(n => GIORNI_FULL[n]).filter(Boolean)
      if (nomi.length > 0) label += ` (escluso il ${nomi.join(', ')})`
    }
  } else if (e.ricorrenza === 'settimanale' && e.giornoSettimana) {
    label = formatGiorniSettimana(e.giornoSettimana) || 'ricorrente'
  } else if (e.data) {
    const from = formatDataShort(e.data)
    const to = e.dataFine ? formatDataShort(e.dataFine) : ''
    label = from && to ? `da ${from} a ${to}` : `dal ${from}`
  }
  // Per settimanale aggiungi le esclusioni esplicite (per giornaliera sono già sottratte dai giorni attivi)
  if (e.ricorrenza !== 'giornaliera' && e.giorniEsclusione) {
    const esclusi = e.giorniEsclusione.split(',').map(Number).filter(n => !isNaN(n) && GIORNI_BREVI[n])
    if (esclusi.length > 0) label += ` (escluso ${esclusi.map(n => GIORNI_BREVI[n]).join(', ')})`
  }
  return label
}

const PHONES = ['+39 039 9260568', '+39 320 1465504', '+39 346 5813309']
const PHONE = PHONES[0]
const MAPS_HREF = 'https://maps.google.com/?q=Via+Europa+2+Colle+Brianza'

const menuVoci = [
  { label: 'Specialità alla Carta', href: '/menu/specialita' },
  { label: 'La Pizza', href: '/menu/pizza' },
  { label: 'Carta dei Vini', href: '/menu/vini' },
  { label: 'Le Birre', href: '/menu/birre' },
  { label: 'Cocktails', href: '/menu/cocktails' },
]



function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export default function Navbar({ orariDisplay, eventi = [] }: { orariDisplay?: { righe: string[]; avvisoSettimana: boolean; giorniChiusi?: number[] }; eventi?: EventoAgenda[] }) {
  const pathname = usePathname()
  const { eventoTitolo, eventoDormiente } = usePageContext()
  const isHome = pathname === '/'
  const isPrenotaPage = pathname === '/prenota'
  const isFidelityPage = pathname === '/fidelity'
  const isEventoPage = /^\/eventi-speciali\/.+/.test(pathname)
  const isCityServicePage = /^\/vicino-a\/.+\/.+/.test(pathname)
  const prenotaHref = (isEventoPage || isCityServicePage) ? '#prenota' : '/prenota'
  const prenotaLabel = (isEventoPage || isCityServicePage) && eventoTitolo
    ? (eventoDormiente ? `Rimani aggiornato su ${eventoTitolo}` : `Prenota ${eventoTitolo}`)
    : 'Prenota un tavolo'
  const prenotaBottomLabel = prenotaLabel
  const showPrenotaBtn = !isPrenotaPage

  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuScrolled, setMenuScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [prenotaVisible, setPrenotaVisible] = useState(false)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Blocca scroll body quando menu mobile è aperto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Chiudi menu e torna in cima quando si naviga
  useEffect(() => {
    setMobileOpen(false)
    setMenuScrolled(false)
    setPrenotaVisible(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  // Nascondi bottom bar quando la sezione #prenota è visibile
  useEffect(() => {
    const el = document.getElementById('prenota')
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setPrenotaVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [pathname])

  const showLogoAndPrenota = !isHome || scrolled
  const isTopHome = isHome && !scrolled

  function openDropdown(name: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(name)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  // Voci nav desktop
  const desktopNav = (
    <>
      <li className="relative" onMouseEnter={() => openDropdown('menu')} onMouseLeave={scheduleClose}>
        <button className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-base tracking-wide font-light cursor-pointer">
          I nostri menù <ChevronDown />
        </button>
        {activeDropdown === 'menu' && (
          <div
            className="absolute top-full left-0 mt-3 bg-white rounded-card overflow-hidden min-w-52 shadow-xl"
            onMouseEnter={() => openDropdown('menu')}
            onMouseLeave={scheduleClose}
          >
            {menuVoci.map((v) => (
              <Link key={v.href} href={v.href} onClick={() => setActiveDropdown(null)} className="block px-5 py-2.5 text-sm text-black/70 hover:text-black hover:bg-brand transition-colors">
                {v.label}
              </Link>
            ))}
          </div>
        )}
      </li>

      <li className="relative" onMouseEnter={() => openDropdown('eventi')} onMouseLeave={scheduleClose}>
        <button className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-base tracking-wide font-light cursor-pointer">
          Appuntamenti <ChevronDown />
        </button>
        {activeDropdown === 'eventi' && (
          <div
            className="absolute top-full left-0 mt-3 bg-white rounded-card overflow-hidden min-w-72 shadow-xl"
            onMouseEnter={() => openDropdown('eventi')}
            onMouseLeave={scheduleClose}
          >
            {eventi.map((e, i) => (
              <Link key={i} href={e.slug ? `/eventi-speciali/${e.slug}` : '/eventi-speciali'} onClick={() => setActiveDropdown(null)} className="block px-5 py-3 hover:bg-brand transition-colors border-b border-black/5 last:border-b-0">
                <span className="text-[11px] text-black/40 uppercase tracking-wider block">
                  {e.ricorrente ? formatRicorrente(e, orariDisplay?.giorniChiusi) : e.data ? formatDataShort(e.data) : ''}
                </span>
                <span className="text-sm text-black/70">{e.titolo}</span>
              </Link>
            ))}
            {eventi.length > 0 && <div className="border-t border-black/10" />}
            <Link href="/eventi-speciali" onClick={() => setActiveDropdown(null)} className="block px-5 py-2.5 text-sm text-black/50 hover:text-black hover:bg-brand transition-colors">
              Tutti gli eventi →
            </Link>
          </div>
        )}
      </li>

      {[
        { label: 'Gallery', href: '/galleria' },
        { label: 'Fidelity Card', href: '/fidelity' },
        { label: 'Contattaci', href: '/contattaci' },
        { label: 'FAQ', href: '/faq' },
      ].map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="text-white/90 hover:text-white transition-colors text-base tracking-wide font-light">
            {item.label}
          </Link>
        </li>
      ))}

    </>
  )

  return (
    <>
      {/* ── Navbar statica homepage — solo voci, scorre con la pagina ── */}
      {isTopHome && (
        <nav
          className="hidden lg:block absolute top-0 left-0 right-0 z-50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-32px)',
            transition: mounted ? 'opacity 1s ease 0.3s, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' : 'none',
          }}
        >
          <div className="w-full px-14 pt-12 pb-4">
            <ul className="flex items-center gap-8">{desktopNav}</ul>
          </div>
        </nav>
      )}

      {/* ── Navbar statica pagine interne — logo + voci + prenota, scorre con la pagina ── */}
      {!isHome && !scrolled && (
        <nav className="hidden lg:block absolute top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-14 w-full pt-12 pb-4 flex items-center justify-between">
            <Link href="/" className="flex-shrink-0 inline-block">
              <Image src="/logo-white.svg" alt="Boogie" width={96} height={40} className="h-10 w-auto" priority />
            </Link>
            <ul className="flex items-center gap-8">{desktopNav}</ul>
            <Link href={prenotaHref} className={`flex-shrink-0 bg-brand hover:bg-brand-hover text-sm font-semibold text-black px-6 py-3 rounded-btn transition-colors whitespace-nowrap${!showPrenotaBtn ? ' invisible pointer-events-none' : ''}`} data-umami-event="prenota" data-umami-event-source="navbar">
              {prenotaLabel}
            </Link>
          </div>
        </nav>
      )}

      {/* ── Navbar scrollata — fixed, transizione su transform e opacity ── */}
      <nav
        className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-black/55 backdrop-blur-md"
        style={{
          transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
          opacity: scrolled ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
          pointerEvents: scrolled ? 'auto' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-14 w-full h-20 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0 inline-block">
            <Image src="/logo-white.svg" alt="Boogie" width={96} height={40} className="h-10 w-auto" priority />
          </Link>
          <ul className="flex items-center gap-8">{desktopNav}</ul>
          <Link href={prenotaHref} className={`flex-shrink-0 bg-brand hover:bg-brand-hover text-sm font-semibold text-black px-6 py-3 rounded-btn transition-colors whitespace-nowrap${!showPrenotaBtn ? ' invisible pointer-events-none' : ''}`}>
            {prenotaLabel}
          </Link>
        </div>
      </nav>

      {/* ── Logo + hamburger mobile in alto ── */}
      {!isHome && (
        <Link
          href="/"
          className="lg:hidden fixed top-4 left-6 z-50"
          style={{
            transform: (!scrolled || mobileOpen) ? 'translateY(0)' : 'translateY(-250%)',
            opacity: mobileOpen && menuScrolled ? 0 : 1,
            pointerEvents: ((!scrolled || mobileOpen) && !(mobileOpen && menuScrolled)) ? 'auto' : 'none',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          <Image src="/logo-white.svg" alt="Boogie" width={100} height={40} className="h-10 w-auto" />
        </Link>
      )}
      <button
        className="lg:hidden fixed top-4 right-6 z-50 text-white cursor-pointer"
        style={{
          transform: (!scrolled || mobileOpen) ? 'translateY(0)' : 'translateY(-250%)',
          opacity: mobileOpen && menuScrolled ? 0 : 1,
          pointerEvents: ((!scrolled || mobileOpen) && !(mobileOpen && menuScrolled)) ? 'auto' : 'none',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Menu"
      >
        <HamburgerIcon open={mobileOpen} />
      </button>

      {/* ── Hamburger mobile scrollato — bollo bianco floating in basso (solo se menu chiuso) */}
      {scrolled && !mobileOpen && (
        <button
          className="lg:hidden fixed bottom-20 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-pill bg-white text-black shadow-lg border border-black/10 cursor-pointer"
          style={{ animation: 'slide-in-right 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          <HamburgerIcon open={false} />
        </button>
      )}


      {/* ── Menu mobile fullscreen ────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Contenuto menu — padding top per non sovrapporsi alla navbar */}
        <div
          ref={menuRef}
          className="h-full overflow-y-auto pt-20 px-6 pb-32 flex flex-col"
          onScroll={(e) => setMenuScrolled((e.currentTarget as HTMLDivElement).scrollTop > 20)}
        >

          {/* Voci principali */}
          <ul className="flex flex-col flex-1">

            {/* I nostri menù */}
            <li className="border-b border-white/10">
              <button
                className="w-full flex items-center justify-between py-4 text-white text-base cursor-pointer"
                onClick={() => setMobileExpanded(mobileExpanded === 'menu' ? null : 'menu')}
              >
                I nostri menù
                <span className={`transition-transform duration-200 ${mobileExpanded === 'menu' ? 'rotate-180' : ''}`}>
                  <ChevronDown />
                </span>
              </button>
              {mobileExpanded === 'menu' && (
                <ul className="pl-4 pb-3">
                  {menuVoci.map((v) => (
                    <li key={v.href}>
                      <Link href={v.href} className="block py-2.5 text-sm text-white/60">
                        {v.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Eventi Speciali */}
            <li className="border-b border-white/10">
              {eventi.length > 0 ? (
                <>
                  <button
                    className="w-full flex items-center justify-between py-4 text-white text-base cursor-pointer"
                    onClick={() => setMobileExpanded(mobileExpanded === 'eventi' ? null : 'eventi')}
                  >
                    Appuntamenti
                    <span className={`transition-transform duration-200 ${mobileExpanded === 'eventi' ? 'rotate-180' : ''}`}>
                      <ChevronDown />
                    </span>
                  </button>
                  {mobileExpanded === 'eventi' && (
                    <div className="pb-4 flex flex-col gap-2">
                      {eventi.map((e, i) => (
                        <Link
                          key={i}
                          href={e.slug ? `/eventi-speciali/${e.slug}` : '/eventi-speciali'}
                          className="flex items-center gap-3 rounded-card overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 transition-colors"
                        >
                          {e.fotoHero ? (
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image src={e.fotoHero} alt={e.titolo} fill className="object-cover" sizes="64px" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 bg-white/5 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/20">
                                <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M2 9h16M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 py-2 pr-3 min-w-0">
                            <span className="text-[10px] text-white/40 uppercase tracking-wider block mb-0.5">
                              {e.ricorrente
                                ? formatRicorrente(e, orariDisplay?.giorniChiusi)
                                : e.data ? formatDataShort(e.data) : ''}
                            </span>
                            <span className="text-sm text-white font-medium leading-snug block truncate">{e.titolo}</span>
                          </div>
                        </Link>
                      ))}
                      <Link href="/eventi-speciali" className="text-xs text-white/30 hover:text-white/60 transition-colors pt-1 text-right pr-1">
                        Tutti gli appuntamenti →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/eventi-speciali" className="block py-4 text-white text-base">
                  Appuntamenti
                </Link>
              )}
            </li>

            {[
              { label: 'Gallery', href: '/galleria' },
              { label: 'Fidelity Card', href: '/fidelity' },
              { label: 'Contattaci', href: '/contattaci' },
              { label: 'FAQ', href: '/faq' },
            ].map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <Link href={item.href} className="block py-4 text-white text-base">
                  {item.label}
                </Link>
              </li>
            ))}

          </ul>

          {/* Orari */}
          {orariDisplay && (
            <div className="mt-8 flex items-start gap-2.5 text-white/50" style={{ fontSize: '0.875rem' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex flex-col gap-0.5">
                {orariDisplay.righe.map((r, i) => <span key={i}>{r}</span>)}
                {orariDisplay.avvisoSettimana && (
                  <span className="text-brand/80 text-xs mt-1">⚠ Orari cambiati questa settimana — controlla il calendario</span>
                )}
              </div>
            </div>
          )}

          {/* Prenota in fondo al menu */}
          <div className="mt-4">
            <Link
              href="/prenota"
              className="block text-center text-sm font-semibold text-black bg-brand hover:bg-brand-hover px-5 py-4 rounded-btn transition-colors"
            >
              Prenota un tavolo
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom bar mobile ─────────────────────────────────────── */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-black/10 transition-transform duration-300 ${mobileOpen || prenotaVisible ? 'translate-y-full' : 'translate-y-0'}`} style={{ backgroundColor: '#1a1a1a' }}>
        {isFidelityPage ? (
          <div className="flex items-stretch h-16">
            <a
              href="#iscriviti"
              className="flex-1 flex items-center justify-center font-semibold text-black bg-brand hover:bg-brand-hover active:bg-brand-hover transition-colors"
              style={{ fontSize: 'var(--text-meta)' }}
            >
              Iscriviti alla Fidelity
            </a>
          </div>
        ) : (
          <div className="flex items-stretch h-16">

            {/* Contattaci → chiama */}
            <a
              href={`tel:${PHONE.replace(/\s/g, '')}`}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white/70 active:bg-white/5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 4.5C2.5 3.4 3.4 2.5 4.5 2.5h1.75a1 1 0 0 1 .95.68l.9 2.7a1 1 0 0 1-.23 1.02L6.6 8.18a10.5 10.5 0 0 0 5.22 5.22l1.28-1.27a1 1 0 0 1 1.02-.23l2.7.9a1 1 0 0 1 .68.95V15.5A2 2 0 0 1 15.5 17.5C8.32 17.5 2.5 11.68 2.5 4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] tracking-wide">Contattaci</span>
            </a>

            {/* Divisore */}
            <div className="w-px bg-white/10 my-3" />

            {/* Come raggiungerci → Maps */}
            <a
              href={MAPS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white/70 active:bg-white/5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6Z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span className="text-[10px] tracking-wide">Come raggiungerci</span>
            </a>

            {/* Divisore */}
            {showPrenotaBtn && <div className="w-px bg-white/10 my-3" />}

            {/* Prenota */}
            {showPrenotaBtn && (
              <Link
                href={prenotaHref}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-black bg-brand hover:bg-brand-hover active:bg-brand-hover px-2 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] tracking-wide text-center leading-tight line-clamp-1">{prenotaBottomLabel}</span>
              </Link>
            )}

          </div>
        )}
      </div>

    </>
  )
}
