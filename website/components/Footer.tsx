import Image from 'next/image'
import Link from 'next/link'
import GestisciCookieButton from '@/components/GestisciCookieButton'

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/boogiebistrot',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/BoogieBistrot',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'TripAdvisor',
    href: 'https://www.tripadvisor.it',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4.5 6.5c0 2.49-2.01 4.5-4.5 4.5s-4.5-2.01-4.5-4.5S9.51 7 12 7s4.5 2.01 4.5 4.5zM12 9.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5S13.38 9.5 12 9.5z" />
      </svg>
    ),
  },
]

const infoItems = [
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5a4.5 4.5 0 0 1 4.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    text: 'Via Europa, 2 — Colle Brianza (LC)',
    href: 'https://maps.google.com/?q=Via+Europa+2+Colle+Brianza',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 3.6C2 2.72 2.72 2 3.6 2h1.4a.8.8 0 0 1 .76.54l.72 2.16a.8.8 0 0 1-.18.82L5.28 6.54a8.4 8.4 0 0 0 4.18 4.18l1.02-1.02a.8.8 0 0 1 .82-.18l2.16.72a.8.8 0 0 1 .54.76V12.4A1.6 1.6 0 0 1 12.4 14C6.43 14 2 9.57 2 3.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    text: '+39 039 9260568',
    href: 'tel:+390399260568',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 3.6C2 2.72 2.72 2 3.6 2h1.4a.8.8 0 0 1 .76.54l.72 2.16a.8.8 0 0 1-.18.82L5.28 6.54a8.4 8.4 0 0 0 4.18 4.18l1.02-1.02a.8.8 0 0 1 .82-.18l2.16.72a.8.8 0 0 1 .54.76V12.4A1.6 1.6 0 0 1 12.4 14C6.43 14 2 9.57 2 3.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    text: '+39 346 5813309',
    href: 'tel:+393465813309',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 5.5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    text: 'info@boogiebistrot.com',
    href: 'mailto:info@boogiebistrot.com',
  },
]

const navColumns = [
  {
    title: 'Esplora',
    links: [
      { label: 'Specialità alla Carta', href: '/menu/specialita' },
      { label: 'La Pizza', href: '/menu/pizza' },
      { label: 'Carta dei Vini', href: '/menu/vini' },
      { label: 'Le Birre', href: '/menu/birre' },
      { label: 'Galleria', href: '/galleria' },
    ],
  },
  {
    title: 'Vieni da noi',
    links: [
      { label: 'Prenota un tavolo', href: '/prenota' },
      { label: 'Appuntamenti', href: '/eventi-speciali' },
      { label: 'Fidelity Card', href: '/fidelity' },
      { label: 'Contattaci', href: '/contattaci' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a1a1a' }} className="text-white/70">
      <div className="max-w-7xl mx-auto px-6 md:px-14 py-16 md:py-20">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">

          {/* Logo + social */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-8">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-white.svg"
                alt="Boogie Bistrot"
                width={100}
                height={40}
                className="opacity-90"
              />
            </Link>

            <div className="flex items-center gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-white/40 hover:text-brand transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {navColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <p className="text-white/30 font-medium uppercase tracking-widest" style={{ fontSize: '0.65rem' }}>
                {col.title}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-white/50 hover:text-white/90 transition-colors font-light"
                      style={{ fontSize: 'var(--text-meta)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contatti */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <p className="text-white/30 font-medium uppercase tracking-widest" style={{ fontSize: '0.65rem' }}>
              Contatti
            </p>
            <div className="flex flex-col gap-3">
              {infoItems.map((item) => (
                <a
                  key={item.text}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors font-light"
                  style={{ fontSize: 'var(--text-meta)' }}
                >
                  <span className="text-white/30 flex-shrink-0">{item.icon}</span>
                  {item.text}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/25 font-light" style={{ fontSize: 'var(--text-label)' }}>
            © {new Date().getFullYear()} Boogie Bistrot · Via Europa, 2 · Colle Brianza (LC)
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-white/25 hover:text-white/50 transition-colors font-light"
              style={{ fontSize: 'var(--text-label)' }}
            >
              Privacy Policy
            </Link>
            <span className="text-white/15" style={{ fontSize: 'var(--text-label)' }}>·</span>
            <Link
              href="/cookie-policy"
              className="text-white/25 hover:text-white/50 transition-colors font-light"
              style={{ fontSize: 'var(--text-label)' }}
            >
              Cookie Policy
            </Link>
            <span className="text-white/15" style={{ fontSize: 'var(--text-label)' }}>·</span>
            <GestisciCookieButton />
          </div>
        </div>

      </div>
    </footer>
  )
}
