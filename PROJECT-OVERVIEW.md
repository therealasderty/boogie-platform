# Boogie Platform — Project Overview

Monorepo in `/boogie-platform` su GitHub: therealasderty.

**Boogie Bistrot** — ristorante a Colle Brianza (LC). Cucina del territorio rivisitata, pizza forno a legna, birre locali, eventi tutto l'anno, giardino in estate.

---

## Stack e struttura

- `website/` — Next.js 16.2.3, React 19, TypeScript, Tailwind CSS v4
- `dashboard/` — React 18 + Vite, JSX, FullCalendar, Phosphor Icons, @dnd-kit, Tiptap
- `netlify/functions/` — 42 funzioni serverless Node.js (backend + automazioni)

**Deploy:** Netlify. `netlify.toml` nella root: `base=website`, `publish=.next`, `functions=../netlify/functions`.

---

## Design System (`website/app/globals.css`)

Tutto in `@theme inline` (Tailwind v4). Mai colori/radius/font hardcoded nei componenti.

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

### CSS globale
- `.rich-text`, `.faq-risposta` — formattano HTML da Tiptap su sfondo dark

---

## Pagine website (`website/app/`)

| Rotta | Note |
|-------|------|
| `/` | Homepage: Hero + SezioneMenu + SezioneBlog + SezioneRecensioni + SezioneContatti |
| `/prenota` | Form prenotazione tavolo con slot disponibilità |
| `/menu/[categoria]` | specialita, pizza, vini, birre, cocktails — dati da Airtable Menu |
| `/eventi-speciali` | Lista eventi da Airtable Agenda |
| `/eventi-speciali/[slug]` | Pagina evento: BlocchiRenderer + form iscrizione + JSON-LD Event |
| `/blog` | Lista articoli blog da Airtable |
| `/blog/[slug]` | Articolo con rich text HTML + JSON-LD BlogPosting |
| `/faq` | FAQ accordion da Airtable |
| `/galleria` | Mosaico foto da Airtable Media (TODO: filtri tag) |
| `/fidelity` | Programma fidelity + form iscrizione |
| `/contattaci` | Form contatti + mappa |
| `/links` | Pagina link social (Spotify, YouTube, IG…) — proprio layout |
| `/privacy` | Privacy policy |
| `/cookie-policy` | Cookie policy |
| `/design` | Design system showcase (DEV only) |
| `/vicino-a/[city]` | Local SEO: intro città, foto location, menu, appuntamenti, mappa embed |
| `/vicino-a/[city]/[service]` | Local SEO: servizio per città — BlocchiRenderer evento madre; JSON-LD Event; canonical self-referencing |
| `/eventi-aziendali` | Landing eventi aziendali: punti di forza, gastronomia, griglia foto, FormEventoAziendale |
| `/eventi-aziendali/[city]` | Variante localizzata per 10 città; `generateStaticParams` da Airtable Localita |
| `/sitemap.ts` | Sitemap dinamica (events, blog, vicino-a, eventi-aziendali) |
| `/robots.ts` | Robots.txt dinamico |

### API Routes (`website/app/api/`)
`/prenota`, `/disponibilita`, `/agenda`, `/fidelity`, `/iscriviti-aggiornamenti`, `/get-popup`, `/contatta`, `/debug-media`

---

## Componenti website (`website/components/`)

### Layout & Navigation
- **Navbar.tsx** — Fixed, trasparente → `bg-black/55 backdrop-blur` allo scroll. Homepage non scrollata: no logo, voci left-aligned. Dropdown eventi con preview prossimi appuntamenti da Airtable. Mobile: hamburger + bottom bar fissa (Contattaci/Maps/Prenota).
- **Footer.tsx** — 4 colonne: Logo+social | Esplora | Vieni da noi | Contatti. Sfondo `#1a1a1a`.
- **PaginaHero.tsx** — Hero pagine interne: 50vh, parallax Framer Motion, slide dall'alto al mount.

### Hero
- **Hero.tsx** — Carosello principale (80%) + pannello news brand (20%). Cross dissolve, Ken Burns, auto-avanza 5s. Pannello news: slide orizzontali. Animazioni entrance: logo+h1+buttons da sinistra (delay 0s), info dal basso (delay 0.6s).

### Form (6)
`FormPrenotazione.tsx`, `FormPrenotazioneEvento.tsx`, `FormIscrizioneEvento.tsx`, `FormFidelity.tsx`, `FormContatti.tsx`, `FormEventoAziendale.tsx`

### Menu
- **SezioneMenu.tsx** — Server component asincrono. Nav tabs: Specialità, Pizza, Vini, Birre, Cocktail. Foto dinamiche da `fetchMedia(tag)`.
- **SezioneMenuCards.tsx** — Carousel card menu per homepage.
- **MenuLista.tsx** / **MenuCarta.tsx** — Visualizzazioni lista ed elenco con descrizione, prezzo, badge intolleranze.

### Sezioni homepage
- **SezioneBlog.tsx** — Priorità: articoli Airtable → eventi con foto → placeholder. Link → `/blog` o `/eventi-speciali`.
- **SezioneFAQ.tsx** + **SezioneFAQAccordion.tsx** — Server + client accordion. Risposte HTML con `dangerouslySetInnerHTML`.
- **SezioneRecensioni.tsx** + **SezioneRecensioniCarousel.tsx** — Google Reviews.
- **SezioneContatti.tsx** + **SezioneContattiClient.tsx** — Mappa embed + form.
- **SezioneIntro.tsx** — Testo + immagine per pagine evento/local SEO.

### Media & Rich Content
- **MosaicoFoto.tsx** — Grid masonry con fade-in, hover zoom.
- **GrigliaFotoLocation.tsx** — Grid foto per pagine local SEO.
- **BlocchiRenderer.tsx** — Renderizza `Blocco[]` (Testo, Immagine, Menu, Prenotazione, Artista, CardOfferte, Prezzo).

### Interactive
- **PopupManager.tsx** — Client, in `layout.tsx`. Fetch da `get-popup` dopo 3s. localStorage key `bb-popup-{slug}` con TTL 24h. Card fixed bottom-right, animazione cubic-bezier 0.6s.
- **EventoPopup.tsx** — Card popup modale evento.
- **CookieBanner.tsx** + **GestisciCookieButton.tsx** — Cookie consent con localStorage.
- **Calendario.tsx** — Mini calendario giorni aperti/chiusi evento.

### Utility
`FadeIn.tsx`, `SmartImage.tsx`, `AltreSpecialita.tsx`, `AltriAppuntamenti.tsx`, `SetEventoTitolo.tsx`, `ArrowRightIcon.tsx`, `LinksPrenotaSticky.tsx`

---

## Lib website (`website/lib/`)

| File | Contenuto |
|------|-----------|
| `agenda.ts` | `fetchEventi()`, `fetchEventoBySlug()`, tipo `EventoAgenda` + tipi `Blocco*`, `formatBadgeRicorrente()` |
| `blog.ts` | `fetchArticoli()`, `fetchArticoloBySlug()`, tipo `ArticoloBlog` |
| `menu.ts` | `fetchPizza/Birre/Vini/Cocktails/Specialita()`, tipo `SezioneMenu`, parsing badge intolleranze |
| `faq.ts` | `fetchFaq()`, tipo `FaqItem` |
| `orari.ts` | `fetchOrari()`, `fetchChiusure()`, `fetchGiorniAperti()`, `buildOrariLines()` |
| `media.ts` | `fetchMedia(tag?)`, `fetchMediaByTag()` da Airtable Media |
| `localita.ts` | `fetchLocalita()`, `fetchLocalitaBySlug()`, tipo `LocalitaItem`. 10 città: Lecco, Merate, Oggiono, Calolziocorte, Casatenovo, Missaglia, Olgiate Molgora, Cernusco Lombardone, Lomagna, Airuno |
| `recensioni.ts` | Fetch recensioni Google/TripAdvisor |
| `form-classes.ts` | Classi Tailwind centralizzate per form (inputClass, labelClass…) |
| `page-context.tsx` | React Context client per titolo evento corrente |

Tutte usano `next: { revalidate: 30 }` (test) — portare a **300 in produzione**.

---

## Netlify Functions (`netlify/functions/`)

42 funzioni serverless Node.js. Tutte protette da `verifyToken` (JWT) salvo eccezioni pubbliche. CORS su tutte.

### Prenotazioni
| Funzione | Auth | Scopo |
|----------|------|-------|
| `prenota.js` | no | POST → Airtable + email Brevo + notifica Telegram |
| `conferma.js` | no | GET conferma da link email → flag "Confermata" + tag Brevo |
| `disponibilita.js` | no | GET slot liberi per data/persone |
| `gestisci-prenotazione.js` | sì | PATCH da dashboard |
| `get-prenotazioni.js` | sì | GET lista prenotazioni |
| `prenotazioni-attesa.js` | sì | GET lista d'attesa |
| `prenotazioni-giornaliere.js` | sì | GET per analytics |
| `cancella-prenotazione.js` | sì | DELETE + notifica email |

### Agenda / Contenuti
| Funzione | Auth | Scopo |
|----------|------|-------|
| `gestisci-appuntamenti.js` | sì | GET/POST/PATCH/DELETE Agenda Airtable |
| `suggerisci-agenda.js` | sì | Gemini API suggerisce tipo evento |
| `gestisci-blog.js` | sì | CRUD Blog Airtable |
| `gestisci-faq.js` | sì | CRUD FAQ Airtable |
| `gestisci-menu.js` | sì | CRUD Menu Airtable |
| `get-menu.js` | no | GET pubblico menu |
| `get-popup.js` | no | GET evento `InPrimoPiano=true` per popup |
| `gestisci-orari.js` | sì | PATCH orari apertura |
| `get-orari.js` | no | GET orari formattati |
| `gestisci-chiusure.js` | sì | CRUD chiusure straordinarie |
| `get-chiusure.js` | no | GET chiusure |
| `pulizia-chiusure.js` | — | **CRON** lunedì 3:00 — rimuove chiusure scadute |

### Local SEO
| Funzione | Auth | Scopo |
|----------|------|-------|
| `gestisci-localita.js` | sì | CRUD città (Localita Airtable) |
| `gestisci-localita-servizi.js` | sì | Sync LocalitaServizi (combo città × servizio) |

### Analytics & AI
| Funzione | Auth | Scopo |
|----------|------|-------|
| `statistiche-settimanali.js` | — | **CRON** domenica 23:00 — KPI settimana → Airtable Statistiche |
| `get-statistiche.js` | sì | GET statistiche con trend |
| `genera-analisi.js` | sì | Gemini API → report (PRO, CRITICITÀ, OPPORTUNITÀ) → AnalisiIA |
| `genera-analisi-background.js` | — | Background function (15min), rigenera analisi storiche |

### Contatti & Email
| Funzione | Auth | Scopo |
|----------|------|-------|
| `contatta.js` | no | Form contatti → RichiesteContatti + email Brevo |
| `contatta-evento-aziendale.js` | no | Form eventi aziendali → RichiesteEventi + email Brevo |

### Fidelity
`fidelity-iscrizione.js`, `fidelity-ricarica.js`, `fidelity-clienti.js`, `get-clienti.js`, `get-tag.js`

### Social & Recensioni
| Funzione | Auth | Scopo |
|----------|------|-------|
| `pubblica-social.js` | sì | Genera caption Gemini + pubblica su Meta (FB+IG) e Google Business Profile. Actions: `genera-caption`, `pubblica` (singola immagine), `pubblica-carosello` (carosello o storie IG). Per le storie usa `mediaType: 'STORIES'` e chiama `media_type: 'STORIES'` sull'API Meta |
| `pubblica-social-schedulato.mjs` | — | **CRON** ogni 30 min — legge `SocialPosts` con `Stato='Programmato'` e `DataProgrammata` passata (filtro robusto in JS, non solo `IS_BEFORE`). Lock anti-concorrenza via `RisultatiPubblicazione.lockRunId` per evitare doppie pubblicazioni su run simultanee. Distingue storie da post con `TipoContenuto` **o** template slide (incluso `foto_916`) |
| `gestisci-social-posts.js` | sì | CRUD tabella `SocialPosts` Airtable |
| `scraping-recensioni.js` | sì | Scraping Google Reviews |
| `scraping-tripadvisor.js` | sì | Scraping TripAdvisor |

### Misc
`auth.js`, `verifyToken.js`, `note.js`, `dati-dashboard.js`, `feedback.js`, `salva-feedback.js`, `get-umami-stats.js`

---

## Airtable — Tabelle principali

| Tabella | Campi rilevanti |
|---------|----------------|
| `SocialPosts` | Titolo, Stato (Single select: Bozza/Programmato/Pubblicato/Errore), DataProgrammata, Caption, Slides (JSON array), Piattaforme (CSV: "instagram,facebook"), Sorgente, **TipoContenuto** (Single select: post/storia), RisultatiPubblicazione, ErroreMsg, DataCreazione, DataPubblicata |
| `Agenda` | Titolo, Slug, Data, Ora, OraFine, Ricorrenza, GiorniSettimana, DescrizioneBreve, FotoHero, TitoloIntro, TestoIntro, TagFotoIntro, Blocchi (JSON), Stato, MetaTitle, MetaDescription, InPrimoPiano (checkbox) |
| `Blog` | Titolo, Slug, Autore, DataPubblicazione, Categoria, DescrizioneBreve, FotoHero, Contenuto (HTML), MetaTitle, MetaDescription, Pubblicato, Ordine |
| `FAQ` | Domanda, Risposta (HTML), Ordine, Attivo |
| `Localita` | Citta, Slug, ServiziAttivi (comma-separated), IntroText (HTML), MetaTitle, MetaDescription, Attiva, Ordine |
| `Menu` | Nome, Categoria, Descrizione, Prezzo, Formato, BadgeIntolleranze, Ordine, Attivo |
| `Media` | Url, Alt, Tag (multi), Ordine, SoloMobile |
| `Orari` | Giorno, AperturaPranzo, ChiusuraPranzo, AperturaCena, ChiusuraCena, Chiuso |
| `Prenotazioni` | Nome, Email, Telefono, Data, Ora, Persone, Fascia, Note, Stato, ConsensoMarketing |
| `ClientiFidelity` | Nome, Cognome, Email, Telefono, Crediti, DataIscrizione, Tag |
| `Statistiche` | Settimana, Prenotazioni, Coperti, Cancellazioni, ClientiUnici, LeadTime, AnalisiIA |
| `RichiesteEventi` | Nome, Cognome, Email, Telefono, TipoEvento, NumOspiti, DataEvento, Note, ConsensoMarketing |
| `RichiesteContatti` | Nome, Cognome, Email, Telefono, Messaggio, ConsensoMarketing |
| `Popup` | Config popup modali |

---

## Dashboard (`dashboard/src/`)

### Pannelli attivi
| Panel | Funzionalità |
|-------|-------------|
| **Home** | Widget: prenotazioni in attesa, meteo (Open-Meteo), recensioni, note |
| **CalendarioPanel** | FullCalendar (4 view). Editor evento inline. Chiusure + festività 2024-2028. AI "Suggerisci agenda" via Gemini |
| **AgendaPanel** | Lista/edit eventi completa, BlocchiEditor, RichTextEditor, sezione SEO |
| **MenuPanel** | CRUD menu con DnD per riordino |
| **MediaPanel** | Upload/gestione foto Cloudinary con tag e ordine |
| **FaqPanel** | FAQ con DnD e RichTextEditor (Tiptap) |
| **BlogPanel** | CRUD articoli, DnD, toggle pubblicato, modal editor + SEO |
| **LocalSeoPanel** | Lista città, toggle attiva, RichTextEditor intro, servizi dinamici da Agenda, SEO, preview URL |
| **OrariPanel / GestisciOrariPanel** | Orari apertura per fascia/giorno + chiusure straordinarie |
| **FidelityPanel** | 3 tab: Iscrivi, Ricarica, GestisciTag |
| **ClientiPanel** | Database clienti fidelity con crediti e storico |
| **AnalyticsPanel** | KPI settimanali (prenotazioni, coperti, cancellazioni, clienti unici, LTV). Grafici: bar giorni, pie fasce. Report AI Gemini |
| **RecensioniSitoPanel** | Scraping + visualizzazione Google Reviews e TripAdvisor |
| **SocialPanel** | Vecchio pannello: genera caption Gemini + pubblica post singoli su Meta (FB+IG+Google). Per storie/caroselli programmati usare SocialStudioPanel |
| **SocialStudioPanel** | Editor post social con slide template, cattura PNG, upload Cloudinary, programmazione. Tipi: `post` e `storia` (9:16). Per eventi ricorrenti, quando fai "Recupera dati da evento" compila `dataTesto` con etichette tipo `Da Mar a Dom (Escluso Sabato)` calcolate da `GiorniEsclusione` + `Orari` attivi, evitando date singole errate |
| **PostBuilderPanel** | Editor post con cattura slide e upload Cloudinary |

### Hooks (`dashboard/src/hooks/`) — 20 hook
`useAppuntamenti`, `useBlog`, `useCalendario`, `useChiusure`, `useFaq`, `useFidelity`, `useLocalita`, `useMedia`, `useMenu`, `useMeteo`, `useNote`, `useOrari`, `usePrenotazioni`, `usePrenotazioniGiornaliere`, `useRecensioni`, `useRecensioniSito`, `useTag`, `useAnalytics`, `useUmamiStats`, `useTheme`

### Componenti utility dashboard
`Login.jsx`, `Sidebar.jsx`, `ModalPrenotazione.jsx`, `FloatingButton.jsx`, `BlocchiEditor.jsx`, `RichTextEditor.jsx`
Widget home: `AttesaWidget`, `MeteoWidget`, `RecensioniWidget`, `PrenotazioniWidget`

---

## Integrazioni esterne

| Servizio | Uso |
|----------|-----|
| **Airtable** | Database centrale (CMS) per tutti i contenuti |
| **Brevo** | Email transazionali + newsletter + tag clienti |
| **Gemini API** | Genera caption social, analisi KPI, suggerisce agenda (modelli: `gemini-2.5-flash` → fallback `gemini-2.0-flash`) |
| **Meta Graph API** | Pubblica post su Facebook Page + Instagram Business |
| **Google Business Profile** | Pubblica Local Post (OAuth2 refresh token) |
| **Telegram** | Notifiche nuove prenotazioni al ristorante |
| **Umami** | Analytics pageview (tracking + API stats) |
| **Cloudinary** | Libreria media (upload + CDN) |
| **Open-Meteo** | Meteo widget dashboard (no API key) |

---

## SEO

- Meta tag statici su tutte le pagine statiche
- `generateMetadata` dinamico su `/eventi-speciali/[slug]` e `/blog/[slug]`
- JSON-LD `Event` su pagine evento, `BlogPosting` su articoli blog, `Restaurant` in `layout.tsx`
- `og:image` dinamica da `fotoHero` (Cloudinary) per eventi e blog
- Local SEO: `/vicino-a/[city]` + `/vicino-a/[city]/[service]` con canonical; sitemap include tutte le varianti
- **Caratteristiche Boogie nei testi:** cucina del territorio rivisitata, pizza tradizionale forno a legna, birre locali, eventi tutto l'anno, giardino nella bella stagione
- **NON citare:** pizza napoletana, hamburger (rimossi), menu fisso pranzo (non attivo)

---

## TODO produzione (`TODO-PRODUZIONE.md`)

- [ ] Gallery: filtri tag (Cucina, Pizza, Giardino, Locale, Serate)
- [ ] Progress bar navigazione (NProgress-style con `usePathname`)
- [ ] `revalidate = 300` su tutte le pagine (ora 30s per test)
- [ ] `og:image` statica in `public/og-image.jpg` → aggiungere in `layout.tsx`
- [ ] Creare lista Brevo "Aggiornamenti eventi" + env var
- [ ] Rimuovere fascia "Aperitivo" da Airtable Orari
- [ ] `/eventi-aziendali/[city]`: filtrare `generateStaticParams` per `ServiziAttivi`
- [ ] Analisi Gemini in `AnalyticsPanel` su `RichiesteEventi` e `RichiesteContatti`
- [ ] Aggiornare Privacy Policy (raccolta dati personali Airtable)
- [x] **Risolto (2026-05-05)** — Storie programmate ora riconosciute correttamente anche con template verticali (`foto_916`, `*_storia`, `*_story`) e pubblicate come `STORIES`
- [x] **Risolto (2026-05-05)** — Doppia pubblicazione da cron concorrenti: introdotto lock per-record su `RisultatiPubblicazione.lockRunId` senza usare `Stato='In pubblicazione'` (evita errore Airtable `INVALID_MULTIPLE_CHOICE_OPTIONS`)
- [x] **Risolto (2026-05-05)** — Social Studio su eventi ricorrenti: popolamento testo periodo (es. `Da Mar a Dom (Escluso Sabato)`) usando `giorniEsclusione` + giorni di apertura da `Orari`
- [ ] Testare flow Social Automation end-to-end
- [ ] Configurare dominio custom su Netlify
- [ ] **Multilingua (futuro):** `next-intl`, prefisso `/en /fr /de /es`, campi Airtable `_EN/_FR/_DE/_ES`

---

---

## Note tecniche importanti

### Social Automation — storie IG via API
- `pubblica ora` funziona: il frontend passa `mediaType: 'STORIES'` esplicitamente a `pubblica-social.js`
- `programmato (cron)`: lo schedulatore legge `f['TipoContenuto']` da Airtable — se vale `'storia'` chiama `pubblicaIgStorie()` con `media_type: 'STORIES'`
- fallback template scheduler: se `TipoContenuto` manca/è incoerente, il cron riconosce storie dai template (`foto_916`, nomi contenenti `storia`, suffisso `_story`)
- Meta Graph API: le storie usano `/{IG_USER_ID}/media` con `media_type: 'STORIES'` + polling `status_code=FINISHED` + `media_publish`
- **Differenza chiave rispetto ai post**: le storie non hanno `caption`, il container va creato con `media_type: 'STORIES'` — se questo campo manca, Meta pubblica come post normale senza errore
- Il cron non gestisce Facebook Stories (escluso con `filter(p => !(p === 'facebook' && isStoria))`)
- anti-duplicato cron: lock ottimistico per record via `RisultatiPubblicazione` + verifica ownership lock prima della pubblicazione effettiva

### Cloudinary
- Cloud: `boogie-bistrot`, preset upload: `boogie-upload` (Unsigned)
- Usato SOLO nel dashboard per upload slide social — NON nel website
- Il website usa Next.js `<Image>` con `remotePatterns` per ottimizzare immagini Airtable nativamente
- `website/lib/cloudinary.ts` restituisce l'URL originale senza proxy (fix 2026-05-04 — piano era al 653%)

### Meta / Social
- `META_ACCESS_TOKEN` deve essere **Page Access Token** (NON User Token)
- System User "Boogie Bot" in Meta Business Manager con token non-scadente
- Per ottenere Page Token: `curl "https://graph.facebook.com/v19.0/{PAGE_ID}?fields=access_token&access_token={SYSTEM_USER_TOKEN}"`

---

*Aggiornato: 5 Maggio 2026*
