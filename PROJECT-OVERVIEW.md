# Boogie Platform — Project Overview

Monorepo in `/boogie-platform` su GitHub: therealasderty.

## Stack e struttura

- `website/` — Next.js 15 App Router, TypeScript, Tailwind CSS v4 (via `@import "tailwindcss"` in globals.css, nessun tailwind.config.js)
- `dashboard/` — React + Vite, JSX, FullCalendar, Phosphor Icons, @dnd-kit, Tiptap
- `netlify/functions/` — Netlify Functions condivise per tutte le API

**Deploy:** Netlify. `netlify.toml` nella root: `base=website`, `publish=.next`, `functions=../netlify/functions`.

---

## Design System (`website/app/globals.css`)

Tutto in `@theme inline`. Mai colori/radius/font hardcoded nei componenti.

- `--color-brand: #eece9d` → `bg-brand`, `text-brand` (CTA prenotazioni)
- `--color-brand-hover: #f5deb3` → `hover:bg-brand-hover` (più chiaro, non scuro)
- `--color-surface-dark: #0a0a0a`, `--color-navbar-bg: #000000`, `--color-surface-warm` (beige chiaro)
- Font: `--font-sans: var(--font-raleway)` (Google), `--font-ivy: 'IvyMode', serif` (self-hosted in `public/fonts/`)
  - **IvyMode solo per titoli h1/h2.** Tutto il resto Raleway.
- Radius: `rounded-btn` (8px), `rounded-card` (12px), `rounded-pill` (999px)
- Tipografia: `--text-label` (0.7rem), `--text-meta` (0.875rem), `--text-body` (1rem), `--text-lead` (1.125rem), `--text-section`
- CSS globale per rich text: `.rich-text` e `.faq-risposta` (formattano HTML da Tiptap)
- Animazioni entrance: `cubic-bezier(0.16, 1, 0.3, 1)` a 1.4s. Pattern `mounted` (useState + useEffect) per evitare flash SSR.

---

## Componenti website (`website/components/`)

### `Navbar.tsx`
- Desktop: fixed, trasparente → `bg-black/55 backdrop-blur` allo scroll
- Homepage non scrollata: no logo, voci left-aligned. Scrollata/altre pagine: logo + voci + prenota
- Mobile: hamburger fixed, no bar. Bottom bar fissa con Contattaci/Maps/Prenota
- Dropdown eventi con preview prossimi appuntamenti da Airtable
- Voci: Menu (dropdown), Appuntamenti (dropdown), Gallery, Blog, Fidelity Card, Contattaci, FAQ

### `Hero.tsx`
- Carosello principale (80%) + pannello news brand (20%)
- Cross dissolve, Ken Burns, auto-avanza 5s
- Animazioni entrance: logo+h1+buttons da sinistra (delay 0s), info/orari dal basso (delay 0.6s)
- Pannello news: slide orizzontali, foto sfuma verso brand

### `PaginaHero.tsx`
- Hero per pagine interne: 50vh, parallax con Framer Motion
- Animazione: slide dall'alto (translateY(-100%) → 0) al mount

### `Footer.tsx`
- 4 colonne: Logo+social | Esplora | Vieni da noi | Contatti
- Sfondo `#1a1a1a`

### `SezioneMenu.tsx`
- Server component asincrono
- Voci: Specialità alla Carta, La Pizza, Carta dei Vini, Le Birre, Cocktail
- Foto dinamiche da `fetchMedia(tag)` per tag: carta, pizza, vini, birra, cocktail
- Carta dei Vini: full width

### `SezioneBlog.tsx`
- Priorità 1: articoli blog pubblicati da Airtable (`fetchArticoli()`)
- Priorità 2: eventi con foto+descrizione breve da Airtable
- Fallback: articoli placeholder statici
- Link → `/blog` o `/eventi-speciali` in base a cosa mostra

### `SezioneFAQ.tsx` + `SezioneFAQAccordion.tsx`
- Server component + client accordion
- Dati da `fetchFaq()`, risposta come HTML con `dangerouslySetInnerHTML`

### `BlocchiRenderer.tsx`
- Renderizza array `Blocco[]` (testo, immagine, menu, prenotazione, artista)

### `FormPrenotazioneEvento.tsx` / `FormIscrizioneEvento.tsx`
- Form prenotazione dedicato per eventi, con slot

### `FadeIn.tsx`
- Wrapper animazione fade+translateY via Intersection Observer

### `PopupManager.tsx`
- Client component, inserito in `layout.tsx`
- Fetch da `/.netlify/functions/get-popup` dopo 3s dal mount
- localStorage: key `bb-popup-{slug}`, TTL 24h — non mostra se già visto
- Animazione: `translateY(24px) → 0`, `opacity 0 → 1`, `cubic-bezier(0.16, 1, 0.3, 1)` 0.6s
- Card fixed bottom-right: foto hero con gradient, IvyMode title, Raleway description, CTA brand
- Controllato dal campo `InPrimoPiano` (checkbox) in Airtable Agenda

---

## Pagine website (`website/app/`)

| Rotta | Note |
|-------|------|
| `/` | Homepage: Hero + SezioneMenu + SezioneBlog + SezioneRecensioni + SezioneContatti |
| `/menu/[categoria]` | specialita, pizza, vini, birre, cocktails — dati da Airtable Menu |
| `/eventi-speciali` | Lista eventi da Airtable Agenda |
| `/eventi-speciali/[slug]` | Pagina evento con BlocchiRenderer + form prenotazione + JSON-LD Event |
| `/blog` | Lista articoli blog da Airtable |
| `/blog/[slug]` | Articolo con rich text HTML + JSON-LD BlogPosting |
| `/prenota` | Form prenotazione tavolo |
| `/galleria` | Galleria foto da Cloudinary/Airtable Media |
| `/faq` | FAQ da Airtable |
| `/fidelity` | Programma fidelity |
| `/contattaci` | Pagina contatti |
| `/privacy` | Privacy policy |
| `/vicino-a/[city]` | Local SEO: pagina città con intro, foto location, SezioneMenu, appuntamenti → `/eventi-speciali/[slug]`, mappa Google Maps embed + directions dinamici |
| `/vicino-a/[city]/[service]` | Local SEO: pagina servizio per città — 404 se city/service non trovati o service non in `serviziAttivi`; BlocchiRenderer da evento Agenda madre; JSON-LD Event; canonical self-referencing |
| `/eventi-aziendali` | Pagina eventi aziendali: punti di forza, sezione gastronomica, griglia foto location navigabile, `FormEventoAziendale` |
| `/eventi-aziendali/[city]` | Variante localizzata per le 10 città ("vicino a [Città]"); `generateStaticParams` da Airtable Localita; canonical per città; TODO: filtrare per `ServiziAttivi` |
| `/sitemap.ts` | Sitemap dinamica — include `/vicino-a/[city]` (priority 0.7), `/vicino-a/[city]/[service]` (priority 0.6), `/eventi-aziendali` (0.8), `/eventi-aziendali/[city]` (0.7) |

---

## Lib website (`website/lib/`)

| File | Contenuto |
|------|-----------|
| `agenda.ts` | `fetchEventi()`, `fetchEventoBySlug()`, tipo `EventoAgenda` + tipi `Blocco*` |
| `blog.ts` | `fetchArticoli()`, `fetchArticoloBySlug()`, tipo `ArticoloBlog` |
| `faq.ts` | `fetchFaq()`, tipo `FaqItem` |
| `localita.ts` | `fetchLocalita()`, `fetchLocalitaBySlug(slug)`, tipo `LocalitaItem` |
| `media.ts` | `fetchMedia(tag?)` da Airtable Media |
| `orari.ts` | `fetchOrari()` |
| `page-context.ts` | Context client per titolo evento corrente |

Tutti usano `next: { revalidate: 30 }` (test) — da portare a 300 in produzione.

---

## Netlify Functions (`netlify/functions/`)

Tutte protette da `verifyToken` salvo eccezioni. Header CORS su tutte.

| Funzione | Auth | Scopo |
|----------|------|-------|
| `gestisci-appuntamenti.js` | sì | GET/POST/DELETE agenda (Airtable `Agenda`) |
| `gestisci-blog.js` | sì | GET/POST/PATCH/DELETE articoli blog (Airtable `Blog`) |
| `gestisci-faq.js` | sì | GET/POST/PATCH/DELETE FAQ (Airtable `FAQ`) |
| `gestisci-localita.js` | sì | GET/POST/PATCH/DELETE località Local SEO (Airtable `Localita`) |
| `gestisci-menu.js` | sì | GET/POST/PATCH/DELETE menu (Airtable `Menu`) |
| `get-menu.js` | no | GET pubblico menu |
| `get-popup.js` | no | GET pubblico — evento `InPrimoPiano=true` più rilevante |
| `contatta.js` | no | POST pubblico — form contatti generico; salva su Airtable `RichiesteContatti` + email Brevo |
| `contatta-evento-aziendale.js` | no | POST pubblico — form eventi aziendali; salva su Airtable `RichiesteEventi` + email Brevo |
| `statistiche-settimanali.js` | sì | aggregazione statistiche |
| varie altri | sì | prenotazioni, fidelity, orari, chiusure, note, tag, recensioni, media |

---

## Airtable — Tabelle principali

| Tabella | Campi rilevanti |
|---------|----------------|
| `Agenda` | Titolo, Slug, Data, Ora, OraFine, Ricorrenza, GiorniSettimana, DescrizioneBreve, FotoHero, TitoloIntro, TestoIntro, TagFotoIntro, Blocchi (JSON), Stato, MetaTitle, MetaDescription, InPrimoPiano (checkbox) |
| `Blog` | Titolo, Slug, Autore, DataPubblicazione, Categoria, DescrizioneBreve, FotoHero, Contenuto (HTML), MetaTitle, MetaDescription, Pubblicato, Ordine |
| `FAQ` | Domanda, Risposta (HTML con link), Ordine, Attivo — 9 voci caricate |
| `Localita` | Citta, Slug, ServiziAttivi (Long text, comma-separated), IntroText (HTML), MetaTitle, MetaDescription, Attiva, Ordine — 10 città caricate (Lecco, Merate, Oggiono, Calolziocorte, Casatenovo, Missaglia, Olgiate Molgora, Cernusco Lombardone, Lomagna, Airuno) |
| `Menu` | Nome, Categoria, Descrizione, Prezzo, Ordine, Attivo, FotoUrl |
| `Media` | Url, Alt, Tag (multi), Ordine |
| `Orari` | Giorno, Aperturapranzo, ChiusuraPranzo, AperturaCena, ChiusuraCena, Chiuso |
| `RichiesteEventi` | Nome, Cognome, Email, Telefono, TipoEvento, NumOspiti, DataEvento, Note, ConsensoMarketing, DataRichiesta — popolata da `contatta-evento-aziendale.js` |
| `RichiesteContatti` | Nome, Cognome, Email, Telefono, Messaggio, ConsensoMarketing, DataRichiesta — popolata da `contatta.js` |

---

## Dashboard (`dashboard/src/`)

### Pannelli attivi
- `CalendarioPanel` — FullCalendar prenotazioni
- `AgendaPanel` — eventi/appuntamenti con BlocchiEditor, RichTextEditor, drag foto; checkbox "In primo piano" per popup; sezione SEO (MetaTitle/MetaDescription) per pagine dedicate
- `MenuPanel` — gestione menu con DnD
- `MediaPanel` — libreria media con upload Cloudinary
- `FaqPanel` — FAQ con DnD e RichTextEditor
- `BlogPanel` — articoli blog con DnD, toggle pubblicato, modal editor RichTextEditor + sezione SEO
- `LocalSeoPanel` — lista città con toggle attiva, modal editor con RichTextEditor intro, servizi dinamici da Agenda, sezione SEO, preview URL
- `FidelityPanel`, `ClientiPanel`, `AnalyticsPanel`, `GestisciOrariPanel`

### Sidebar — sezioni
1. Home
2. Prenotazioni: Calendario, Gestisci Orari
3. Clienti: Programma Fidelity, Database Clienti
4. Gestione sito: Menu, Appuntamenti, Libreria Media, FAQ, Blog, Local SEO
5. Statistiche: Analytics
6. Marketing: Mail massive (Brevo)

---

## SEO

- Meta tag statici su tutte le pagine statiche
- `generateMetadata` dinamico su `/eventi-speciali/[slug]` e `/blog/[slug]`
- JSON-LD `Event` su pagine evento, `BlogPosting` su articoli blog
- `og:image` dinamica da `fotoHero` per eventi e blog (Cloudinary URLs)
- MetaTitle e MetaDescription compilati in Airtable per tutti gli eventi con slug
- Local SEO: `/vicino-a/[city]` con canonical self-referencing; `/vicino-a/[city]/[service]` con JSON-LD Event e canonical; sitemap include tutte le varianti
- **Caratteristiche Boogie (da usare nei testi):** cucina del territorio rivisitata, pizza tradizionale forno a legna, birre locali, eventi tutto l'anno, giardino nella bella stagione. NON citare: pizza napoletana, hamburger (rimossi), menu fisso pranzo (non più attivo), eventi specifici come "Girorisotti" nei testi statici
- **TODO produzione:** `og:image` statica in `public/og-image.jpg` per pagine statiche, `og:url` canonico, `robots.ts`, `LocalBusiness` JSON-LD, revalidate → 300

---

## TODO produzione (file `TODO-PRODUZIONE.md`)

- Filtri tag nella galleria
- Progress bar di navigazione (NProgress-style con `usePathname`)
- `revalidate = 300` su tutte le pagine (ora a 30s per test)
- `og:image` statica in `public/og-image.jpg` → aggiungere in `layout.tsx`
- Creare lista Brevo "Aggiornamenti eventi" e aggiungere env vars
- Rimuovere fascia "Aperitivo" da Airtable Orari
- Aggiungere campo `InPrimoPiano` (Checkbox) alla tabella Airtable `Agenda`
- `/eventi-aziendali/[city]`: filtrare `generateStaticParams` per `ServiziAttivi` in Airtable
- Analisi Gemini in `AnalyticsPanel` su dati `RichiesteEventi` e `RichiesteContatti`
- Aggiornare Privacy Policy (raccolta dati personali in Airtable)
- **Multilingua (futuro):** `next-intl`, prefisso `/en` `/fr` `/de` `/es`, tradurre UI + FAQ + descrizioni brevi menu, Airtable con campi `_EN/_FR/_DE/_ES` solo dove serve
