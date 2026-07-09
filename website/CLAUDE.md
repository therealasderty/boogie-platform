@AGENTS.md

# Website — CLAUDE.md

Next.js 16.2.3, React 19, TypeScript, Tailwind CSS v4.

---

## Design System (`app/globals.css`)

Tutto in `@theme inline` (Tailwind v4). **Mai colori/radius/font hardcoded nei componenti.**

### Colori
| Token | Valore | Uso |
|-------|--------|-----|
| `--color-brand` | `#eece9d` | CTA prenotazioni (gold/beige) |
| `--color-brand-hover` | `#f5deb3` | Hover brand (più chiaro, non scuro) |
| `--color-surface-dark` | `#1a1a1a` | Sfondo sezioni dark, footer |
| `--color-navbar-bg` | `#000000` | Navbar scrolled |
| `--color-surface-warm` | `#faf8f4` | Sfondo sezioni chiare |
| `--color-text-muted` | oklch(100% 0 0 / 75%) | Testo secondario su dark |
| `--color-text-faint` | oklch(100% 0 0 / 45%) | Label uppercase, meta su dark |

### Tipografia
- `--font-sans: var(--font-raleway)` (Google Fonts) — corpo testo e UI
- `--font-ivy: 'IvyMode', serif` (self-hosted in `public/fonts/`) — **solo h1/h2**
- Scale: `--text-label` (0.7rem), `--text-meta` (0.875rem), `--text-body` (1rem), `--text-lead` (1.125rem), `--text-section` (1.75rem), `--text-title` (2rem)
- `--tracking-label: 0.12em` per label uppercase

### Radius & Animazioni
- `--radius-btn` (8px), `--radius-card` (12px), `--radius-pill` (999px)
- Keyframes: `slide-in-right`, `navbar-in`, `kenburns-1/2` (hero)
- Entrance pattern: `cubic-bezier(0.16, 1, 0.3, 1)` a ~1.4s. Usa `mounted` (useState + useEffect) per evitare flash SSR.
- **Transizioni di pagina** — doppio layer:
  1. `@view-transition { navigation: auto }` in globals.css — cross-fade automatico viewport (Chrome/Edge/Safari moderni).
  2. `PageTransition.tsx` wrappa `{children}` in `layout.tsx` con `motion.div` + `key={pathname}`: fade-in + slide-up 10px, 0.45s. La Navbar è fuori dal wrapper. Nessuna exit animation lato React.
- **AnimatePresence sui componenti UI**: CookieBanner (slide-up/down), Navbar dropdown (fade+slide 0.18s), Navbar FAB hamburger mobile (spring stiffness 320, damping 24, entra/esce da destra)

### CSS globale
- `.rich-text`, `.faq-risposta` — formattano HTML da Tiptap su sfondo dark

---

## Pagine (`app/`)

| Rotta | Note |
|-------|------|
| `/` | Homepage: Hero + SezioneMenu + SezioneBlog + SezioneRecensioni + SezioneContatti |
| `/prenota` | Form prenotazione tavolo con slot disponibilità |
| `/menu/[categoria]` | specialita, pizza, vini, birre, cocktails — dati da Airtable Menu |
| `/eventi-speciali` | Lista eventi da Airtable Agenda |
| `/eventi-speciali/[slug]` | BlocchiRenderer + form iscrizione + JSON-LD Event |
| `/blog` | Lista articoli blog da Airtable |
| `/blog/[slug]` | Articolo rich text HTML + JSON-LD BlogPosting |
| `/faq` | FAQ accordion da Airtable |
| `/galleria` | Mosaico foto da Airtable Media — tag `location`, `carta`, `galleria` (TODO: filtri tag UI) |
| `/fidelity` | Programma fidelity + form iscrizione |
| `/contattaci` | Form contatti + mappa |
| `/links` | Pagina link social — proprio layout |
| `/privacy` | Privacy policy |
| `/cookie-policy` | Cookie policy |
| `/design` | Design system showcase (DEV only) |
| `/vicino-a/[city]` | Local SEO: intro città, foto, menu, appuntamenti, mappa embed |
| `/vicino-a/[city]/[service]` | Local SEO: BlocchiRenderer evento; JSON-LD Event; canonical self-referencing |
| `/eventi-aziendali` | Landing: punti forza, gastronomia, griglia foto, FormEventoAziendale, SezioneVieni |
| `/eventi-aziendali/[city]` | Variante localizzata 10 città; `generateStaticParams` da Airtable Localita |
| `/conferma-prenotazione` | Pagina interna (no navbar) — legge `?id=`, conferma via `conferma.js` |
| `(standalone)/feedback` | Standalone senza navbar — form feedback negativo post-cena. Legge `?nome=&data=` |
| `/sitemap.ts` | Sitemap dinamica (events, blog, vicino-a, eventi-aziendali) |
| `/robots.ts` | Robots.txt dinamico |

### API Routes (`app/api/`)
`/prenota`, `/disponibilita`, `/agenda`, `/fidelity`, `/iscriviti-aggiornamenti`, `/get-popup`, `/contatta`

---

## Componenti (`components/`)

### Layout & Navigation
- **Navbar.tsx** — Fixed, trasparente → `bg-black/55 backdrop-blur` allo scroll. Dropdown eventi con preview prossimi appuntamenti. Mobile: hamburger + bottom bar fissa (Contattaci / Come raggiungerci / Menù / Prenota).
- **Footer.tsx** — 4 colonne. Sfondo `#1a1a1a`.
- **PaginaHero.tsx** — 50vh, parallax Framer Motion, slide dall'alto al mount.

### Hero
- **Hero.tsx** — Carosello (80%) + pannello news brand (20%). Cross dissolve, Ken Burns, auto-avanza 5s.

### Form
`FormPrenotazioneMultiStep.tsx`, `FormIscrizioneEvento.tsx`, `FormFidelity.tsx`, `FormContatti.tsx`, `FormEventoAziendale.tsx`

Tutti i form con dati cliente raccolgono `data_nascita` → inviata a Brevo come `BIRTHDAY` (Unix timestamp).

### Menu
- **SezioneMenu.tsx** — Server component asincrono. Nav tabs: Specialità, Pizza, Vini, Birre, Cocktail.
- **MenuLista.tsx** / **MenuCarta.tsx** — Lista ed elenco con descrizione, prezzo, badge intolleranze.

### Sezioni homepage
- **SezioneBlog.tsx** — Priorità: articoli Airtable → eventi con foto → placeholder.
- **SezioneRecensioni.tsx** + **SezioneRecensioniCarousel.tsx** — Google Reviews.
- **SezioneContatti.tsx** + **SezioneContattiClient.tsx** — form contatto + foto (NON mappa).
- **SezioneVieni.tsx** — async server. Indirizzo, telefoni, orari, mappa embed. Usata in `/eventi-aziendali`.

### Media & Rich Content
- **MosaicoFoto.tsx** — Grid masonry con fade-in, hover zoom.
- **BlocchiRenderer.tsx** — Renderizza `Blocco[]` (Testo, Immagine, Menu, Prenotazione, Artista, CardOfferte, Prezzo).

### Interactive
- **PopupManager.tsx** — Client, in `layout.tsx`. Mode: `chiusura`, `evento`, `entrambi` (layout split, card `max-w-2xl`). Delay 2s se chiusura, altrimenti delay per urgency evento. z-index 100.
- **CookieBanner.tsx** + **GestisciCookieButton.tsx** — Cookie consent con localStorage.

### Utility
`FadeIn.tsx`, `PageTransition.tsx`, `LinksPrenotaSticky.tsx`, `ArrowRightIcon.tsx`, `SetEventoTitolo.tsx`

---

## Lib (`lib/`)

| File | Contenuto |
|------|-----------|
| `agenda.ts` | `fetchEventi()`, `fetchEventoBySlug()`, tipo `EventoAgenda`, tipi `Blocco*`, `formatBadgeRicorrente()` |
| `blog.ts` | `fetchArticoli()`, `fetchArticoloBySlug()`, tipo `ArticoloBlog` |
| `menu.ts` | `fetchPizza/Birre/Vini/Cocktails/Specialita()`, tipo `SezioneMenu`, parsing allergeni |
| `faq.ts` | `fetchFaq()`, tipo `FaqItem` |
| `orari.ts` | `fetchOrari()`, `fetchChiusure()` (revalidate 1800s), `fetchGiorniAperti()`, `buildOrariLines()` |
| `media.ts` | `fetchMedia(tag?)`, `fetchMediaByTag()` da Airtable Media |
| `localita.ts` | `fetchLocalita()`, `fetchLocalitaBySlug()`. 10 città: Lecco, Merate, Oggiono, Calolziocorte, Casatenovo, Missaglia, Olgiate Molgora, Cernusco Lombardone, Lomagna, Airuno |
| `recensioni.ts` | Fetch recensioni Google/TripAdvisor |
| `form-classes.ts` | Classi Tailwind centralizzate (inputClass, labelClass…) |
| `page-context.tsx` | React Context client per titolo evento corrente |
| `revalidate.ts` | Tempi centralizzati: blog/media/recensioni/FAQ/località → 259200s (3gg); agenda/orari/popup → 86400s (1gg) |

---

## SEO

- `generateMetadata` dinamico su `/eventi-speciali/[slug]` e `/blog/[slug]`
- JSON-LD `Event` su pagine evento, `BlogPosting` su articoli, `Restaurant` in `layout.tsx`
- `og:image` dinamica da `fotoHero` per eventi e blog
- Local SEO: `/vicino-a/[city]` + `/vicino-a/[city]/[service]` con canonical; sitemap include tutte le varianti
- **Caratteristiche Boogie nei testi:** cucina del territorio rivisitata, pizza tradizionale forno a legna, birre locali, eventi tutto l'anno, giardino nella bella stagione
- **NON citare:** pizza napoletana, hamburger (rimossi), menu fisso pranzo (non attivo)

---

## Note tecniche

### Image loader (`image-loader.ts`)
1. URL `ik.imagekit.io` (foto vecchie) → trasformazione via ImageKit CDN
2. URL R2/altri esterni in produzione → Netlify Image CDN (`/.netlify/images?url=...&w=...&q=...&fm=auto`)
3. Dev → URL originale

**6 foto 404 da sostituire manualmente in Airtable:** record Media `recP3zsnvll4IL2eo`, `recVmIA3KPVS56znf`, `recksHLl7fkaAsXck`, `recu8SCvC4Vdes8j4`; Agenda `recVmdWNfQIglh8vD`; Blog `recmPswNGVpBsIbik`.

### Hero images locali (`public/images/hero/`)
- `sala-boogie-bistrot-colle-brianza.webp`
- `giardino-boogie-bistrot-colle-brianza.avif` ← fallback universale in tutto il sito

### Route group `(standalone)` — pagine senza navbar
`app/(standalone)/` — layout restituisce solo `{children}`. Visibilità Navbar/Banner/Popup controllata da `NavbarShell.tsx` (client, `usePathname`). Array `STANDALONE_PATHS` in `NavbarShell.tsx`. Attualmente: `/feedback`.

### BannerChiusure (`components/BannerChiusure.tsx`)
Striscia chiusure/aperture straordinarie nei prossimi 7 giorni. Desktop: `sticky top-20 z-[45]`. Mobile: `fixed bottom-16 z-[45]` con marquee infinito. Filtraggio date lato client (evita stale ISR). Dismiss localStorage TTL 24h (`bb-banner-chiusure`).

### Hydration mismatch `<html>`
`suppressHydrationWarning` su `<html>` in `layout.tsx` — estensioni browser (Avast ecc.) iniettano `data-arp=""` prima che React idrati.

### Dev refresh loop (fix 2026-05-24)
`turbopack: {}` esplicito in `next.config.ts` causava reload loop ogni ~1s. **Fix**: rimosso (ridondante in Next.js 16). Se ricompare: `rm -rf website/.next` e riavviare.

### Allergeni menu
`Allergeni` (CSV "1,3,7") su Airtable Menu. `senzaGlutine` = allergene #1 assente; `senzaLattosio` = #7 assente. Fallback ai bool legacy `Senza Glutine`/`Senza Lattosio` se campo vuoto.

### Email feedback — alternanza recensioni
`feedback.js`: giorno pari → Google Reviews, giorno dispari → TripAdvisor. URL TripAdvisor overridabile via `TRIPADVISOR_REVIEW_URL`.
