# Boogie Platform — CLAUDE.md

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
- **Transizioni di pagina** — doppio layer:
  1. `@view-transition { navigation: auto }` in `globals.css` — View Transitions API nativa (Chrome/Edge/Safari moderni). Cross-fade automatico dell'intera viewport durante la navigazione. Fallback silenzioso su browser non supportati.
  2. `PageTransition.tsx` wrappa `{children}` in `layout.tsx`. Usa `motion.div` con `key={pathname}` (Framer Motion): fade-in + slide-up 10px, 0.45s, curva `[0.16, 1, 0.3, 1]`. La Navbar è fuori dal wrapper e rimane stabile. Nessuna exit animation lato React (App Router non smonta la vecchia pagina prima di montare la nuova — ci pensa la View Transitions API).
- **AnimatePresence sui componenti UI**:
  - `CookieBanner.tsx` — slide-up in entrata, slide-down in uscita (`y: '100%'`), curva `[0.16, 1, 0.3, 1]`, 0.4s
  - `Navbar.tsx` dropdown ("I nostri menù", "Appuntamenti") — fade + slide-down 8px in entrata, reverse in uscita, 0.18s. Usa `AnimatePresence` per la exit animation al mouse leave
  - `Navbar.tsx` FAB hamburger mobile (bollo bianco floating) — `motion.button` con `AnimatePresence`: entra da destra (`x: 80`), esce verso destra. Spring `stiffness: 320, damping: 24`

### CSS globale
- `.rich-text`, `.faq-risposta` — formattano HTML da Tiptap su sfondo dark

---

## Design System Dashboard (`dashboard/src/styles/global.css`)

Tema chiaro fisso (no dark mode). Tutte le variabili in `:root`. Mai colori hardcoded nei componenti — usare sempre le variabili CSS.

### Colori
| Token | Valore | Uso |
|-------|--------|-----|
| `--bg` | `#F7F3ED` | Sfondo pagina principale |
| `--bg2` | `#FFFFFF` | Sfondo card, modal, pannelli |
| `--bg3` | `#EDE8DC` | Sfondo hover, tag, chip, sezioni secondarie |
| `--bg-input` | `#fdfaf4` | Sfondo input, textarea, select |
| `--border` | `#C8B99A` | Bordo standard |
| `--border2` | `#D8CCBA` | Bordo secondario (più chiaro) |
| `--text` | `#1A1208` | Testo primario |
| `--text2` | `#3D2E18` | Testo secondario |
| `--text3` | `#7A6448` | Testo terziario, label, placeholder |
| `--accent` | `#B8820A` | Oro — CTA, hover border, stati attivi |
| `--accent2` | `#7A5F30` | Oro scuro — hover su `.btn-accent` |
| `--danger` | `#C0392B` | Rosso — azioni distruttive |
| `--success` | `#2E7D32` | Verde — stati positivi (attivo, pubblicato) |

### Tipografia
- `--font-body`: `'Geist', 'Inter', sans-serif` — testo UI, pulsanti, label
- `--font-display`: `'Instrument Sans', sans-serif` — h1, h2
- Font template social (non UI): `Alga` (headline), `SofiaPro` (corpo), `IvyMode` (sito prod), `BasisGrotesque`, `PhosphateSolid`
- Base: `font-size: 17px` su `html/body`

### Spacing & Radius
| Token | Valore | Uso |
|-------|--------|-----|
| `--radius` | `8px` | Modal, card, contenitori |
| `--radius-sm` | `6px` | Bottoni, input, tag |
| `--radius-lg` | `12px` | Card grandi |
| `--border-style` | `1px solid var(--border)` | Shorthand bordo standard |
| `--shadow` | `0 1px 4px rgba(0,0,0,0.06)` | Ombra leggera |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | Modal, dropdown |

### Button system (classi globali)
| Classe | Uso |
|--------|-----|
| `.btn-primary` | Azione principale — sfondo `--text`, hover `--accent` |
| `.btn-secondary` | Azione secondaria — bordo, sfondo trasparente |
| `.btn-accent` | CTA oro — sfondo `--accent`, hover `--accent2` |
| `.btn-outline-accent` | Contorno oro — "Nuovo post", "Crea" |
| `.btn-outline-success` | Bordo neutro, hover verde — "Segna come pubblicato" |
| `.btn-danger` | Azione distruttiva — sfondo `--danger` |
| `.btn-ghost` | Link-like senza bordo — logout, link secondari |
| `.btn-icon` | Solo icona quadrata — refresh, edit, close. `.danger` per hover rosso |
| `.btn-toggle` | Selezione tra opzioni. `.active` = oro, `.active-green` = verde, `.active-danger` = rosso |
| `.btn-sm` | Modificatore compatto — combinare con altre classi |

### Pattern modal
```css
background: var(--bg)
border-top: 3px solid var(--accent)
border: var(--border-style)
border-radius: var(--radius)
box-shadow: var(--shadow-md)
overlay: rgba(0,0,0,0.45)
```

### Animazione globale
```css
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
```

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
| `/galleria` | Mosaico foto da Airtable Media — fetcha tag `location`, `carta`, `galleria` (TODO: filtri tag UI) |
| `/fidelity` | Programma fidelity + form iscrizione |
| `/contattaci` | Form contatti + mappa |
| `/links` | Pagina link social (Spotify, YouTube, IG…) — proprio layout |
| `/privacy` | Privacy policy |
| `/cookie-policy` | Cookie policy |
| `/design` | Design system showcase (DEV only) |
| `/vicino-a/[city]` | Local SEO: intro città, foto location, menu, appuntamenti, mappa embed |
| `/vicino-a/[city]/[service]` | Local SEO: servizio per città — BlocchiRenderer evento madre; JSON-LD Event; canonical self-referencing |
| `/eventi-aziendali` | Landing eventi aziendali: punti di forza, gastronomia, griglia foto, FormEventoAziendale, SezioneVieni. Hero: foto R2 fissa |
| `/eventi-aziendali/[city]` | Variante localizzata per 10 città; `generateStaticParams` da Airtable Localita. Hero: foto R2 fissa. SezioneVieni in fondo |
| `/conferma-prenotazione` | Pagina interna (no navbar) per confermare manualmente una prenotazione. Legge `?id=`, mostra i dati, permette di aggiungere un messaggio e invia la conferma via `conferma.js` |
| `/feedback` | Pagina standalone (route group `(standalone)/`, senza navbar/popup) — form feedback negativo post-cena. Legge `?nome=&data=` (passati dall'email `feedback.js`). Stelle opzionali + textarea commento obbligatorio → `salva-feedback.js` |
| `/sitemap.ts` | Sitemap dinamica (events, blog, vicino-a, eventi-aziendali) |
| `/robots.ts` | Robots.txt dinamico |

### API Routes (`website/app/api/`)
`/prenota`, `/disponibilita`, `/agenda`, `/fidelity`, `/iscriviti-aggiornamenti`, `/get-popup`, `/contatta`

---

## Componenti website (`website/components/`)

### Layout & Navigation
- **Navbar.tsx** — Fixed, trasparente → `bg-black/55 backdrop-blur` allo scroll. Homepage non scrollata: no logo, voci left-aligned. Dropdown eventi con preview prossimi appuntamenti da Airtable. Mobile: hamburger + bottom bar fissa. Bottom bar: Contattaci (tel) / Come raggiungerci (Maps) / **Menù** (→ `/menu/specialita`, solo homepage) / Prenota (brand gold).
- **Footer.tsx** — 4 colonne: Logo+social | Esplora | Vieni da noi | Contatti. Sfondo `#1a1a1a`.
- **PaginaHero.tsx** — Hero pagine interne: 50vh, parallax Framer Motion, slide dall'alto al mount.

### Hero
- **Hero.tsx** — Carosello principale (80%) + pannello news brand (20%). Cross dissolve, Ken Burns, auto-avanza 5s. Pannello news: slide orizzontali. Animazioni entrance: logo+h1+buttons da sinistra (delay 0s), info dal basso (delay 0.6s).

### Form (4)
`FormPrenotazioneMultiStep.tsx`, `FormIscrizioneEvento.tsx`, `FormFidelity.tsx`, `FormContatti.tsx`, `FormEventoAziendale.tsx`

Tutti i form con dati cliente raccolgono `data_nascita` → inviata a Brevo come campo `BIRTHDAY` (Unix timestamp). Abilita l'automazione `compleanno-premio.js`.

### Menu
- **SezioneMenu.tsx** — Server component asincrono. Nav tabs: Specialità, Pizza, Vini, Birre, Cocktail. Foto dinamiche da `fetchMedia(tag)`.
- **SezioneMenuCards.tsx** — Carousel card menu per homepage.
- **MenuLista.tsx** / **MenuCarta.tsx** — Visualizzazioni lista ed elenco con descrizione, prezzo, badge intolleranze.

### Sezioni homepage
- **SezioneBlog.tsx** — Priorità: articoli Airtable → eventi con foto → placeholder. Link → `/blog` o `/eventi-speciali`.
- **SezioneFAQ.tsx** + **SezioneFAQAccordion.tsx** — Server + client accordion. Risposte HTML con `dangerouslySetInnerHTML`.
- **SezioneRecensioni.tsx** + **SezioneRecensioniCarousel.tsx** — Google Reviews.
- **SezioneContatti.tsx** + **SezioneContattiClient.tsx** — Form contatto generico + foto (NON mappa). Per la sezione con mappa usa `SezioneVieni.tsx`.
- **SezioneIntro.tsx** — Testo + immagine per pagine evento/local SEO.

### Media & Rich Content
- **MosaicoFoto.tsx** — Grid masonry con fade-in, hover zoom.
- **GrigliaFotoLocation.tsx** — Grid foto per pagine local SEO.
- **BlocchiRenderer.tsx** — Renderizza `Blocco[]` (Testo, Immagine, Menu, Prenotazione, Artista, CardOfferte, Prezzo).

### Interactive
- **PopupManager.tsx** — Client, in `layout.tsx`. Riceve `chiusure` prop dal layout. Fetcha chiusure e evento in parallelo, poi decide il mode: **`chiusura`** (solo chiusura/apertura), **`evento`** (solo evento), **`entrambi`** (layout split). In mode `entrambi`: card unica `max-w-2xl`, due tile affiancate su desktop (`sm:flex-row`) / stacked su mobile — sinistra/top tile chiusura (sfondo verde/rosso, testo bianco, CTA "Prenota ora"), destra/bottom tile evento (foto + titolo + CTA "Scopri di più"). Un solo X chiude tutto e segna entrambi come visti. Delay 2s se c'è chiusura, altrimenti delay per urgency evento (2-10s). z-index 100.
- **EventoPopup.tsx** — Card popup modale evento.
- **CookieBanner.tsx** + **GestisciCookieButton.tsx** — Cookie consent con localStorage.
- **Calendario.tsx** — Mini calendario giorni aperti/chiusi evento.

### Utility
`FadeIn.tsx`, `AltreSpecialita.tsx`, `AltriAppuntamenti.tsx`, `SetEventoTitolo.tsx`, `ArrowRightIcon.tsx`, `LinksPrenotaSticky.tsx`, `PageTransition.tsx`

### Sezioni riutilizzabili
- **SezioneContatti.tsx** + **SezioneContattiClient.tsx** — form contatto generico + foto. Usata in homepage e pagine evento.
- **SezioneVieni.tsx** — async server component. Indirizzo, telefoni, orari da Airtable, mappa Google Maps embed. Usata in `/eventi-aziendali` e `/eventi-aziendali/[city]`.

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

Tempi di revalidate centralizzati in `website/lib/revalidate.ts`:
- Blog, media, recensioni, FAQ, località → **3 giorni** (259 200s)
- Agenda, orari, popup → **1 giorno** (86 400s)

---

## Netlify Functions (`netlify/functions/`)

42 funzioni serverless Node.js. Tutte protette da `verifyToken` (JWT) salvo eccezioni pubbliche. CORS su tutte.

### Prenotazioni
| Funzione | Auth | Scopo |
|----------|------|-------|
| `prenota.js` | no | POST → Airtable con `Stato='Confermata'` direttamente + email conferma con link Calendar + notifica Telegram |
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
| `gestisci-chiusure.js` | sì | CRUD chiusure straordinarie. GET restituisce `fasce[]` (array). POST/PATCH leggono `fasce[]`. PATCH aggiunge/aggiorna record esistenti |
| `get-chiusure.js` | — | Non esiste — il sito legge Airtable direttamente tramite `fetchChiusure()` in `website/lib/orari.ts` |
| `pulizia-chiusure.js` | — | **CRON** lunedì 3:00 — rimuove chiusure scadute |

### Local SEO
| Funzione | Auth | Scopo |
|----------|------|-------|
| `gestisci-localita.js` | sì | CRUD città (Localita Airtable) |
| `gestisci-localita-servizi.js` | sì | Sync LocalitaServizi (combo città × servizio) |

### Analytics & AI
| Funzione | Auth | Scopo |
|----------|------|-------|
| `statistiche-settimanali.mjs` | — | **CRON** domenica 23:00 — KPI settimana → Airtable Statistiche. Fetcha in parallelo: prenotazioni, meteo, eventi, **Umami web stats** (visite, visitatori unici, pageviews, bounce rate, visite /prenota, pagina più visitata). Dati Umami salvati su Airtable, inclusi nel prompt Gemini e nella newsletter |
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
| `pubblica-social-schedulato.mjs` | — | **CRON** ogni 4 ore — legge `SocialPosts` con `Stato='Programmato'` e `DataProgrammata` passata (filtro robusto in JS, non solo `IS_BEFORE`). Lock anti-concorrenza via `RisultatiPubblicazione.lockRunId` per evitare doppie pubblicazioni su run simultanee. Distingue storie da post con `TipoContenuto` **o** template slide (incluso `foto_916`) |
| `upload-slide.js` | sì | POST multipart PNG → Cloudflare R2 (AWS SigV4 nativo, zero dipendenze) |
| `compleanno-premio.js` | — | **CRON** domenica — invia email regalo ai clienti fidelity con `DATE_OF_BIRTH` nella settimana successiva. Protetta da `CRON_SECRET` |
| `gestisci-social-posts.js` | sì | CRUD tabella `SocialPosts` Airtable |
| `scraping-recensioni.js` | sì | Scraping Google Reviews via Google Places API — chiamata manualmente o via cron-job.org esterno |
| `scraping-tripadvisor.js` | sì | Scraping TripAdvisor via ScraperAPI — **CRON** lunedì 4:00, timeout 26s. Salva `TripAdvisor Recensioni` e `TripAdvisor Rating` in Airtable `Recensioni` |

### Contatti & Email
| Funzione | Auth | Scopo |
|----------|------|-------|
| `get-configurazione.js` | no | GET impostazioni runtime come `{ chiave: valore }` — usato da `prenota.js` a ogni prenotazione |
| `gestisci-configurazione.js` | sì | GET/PATCH tabella `Configurazione` Airtable — usato dal dashboard |

### Misc
`auth.js`, `verifyToken.js`, `note.js`, `dati-dashboard.js`, `feedback.js`, `salva-feedback.js`, `get-umami-stats.js`

> **`send-reminders.mjs`** — esiste nel codice ma lo schedule è stato **rimosso dal netlify.toml (2026-06-01)**. Non viene più eseguito automaticamente. Per riabilitarlo aggiungere `[functions.send-reminders] schedule = "30 9 * * *"` in `netlify.toml`.

---

## Airtable — Tabelle principali

| Tabella | Campi rilevanti |
|---------|----------------|
| `SocialPosts` | Titolo, Stato (Single select: Bozza/Programmato/Pubblicato/Errore), DataProgrammata, Caption, Slides (JSON array), Piattaforme (CSV: "instagram,facebook"), Sorgente, **TipoContenuto** (Single select: post/storia), RisultatiPubblicazione, ErroreMsg, DataCreazione, DataPubblicata |
| `Agenda` | Titolo, Slug, Data, Ora, OraFine, Ricorrenza, GiorniSettimana, DescrizioneBreve, FotoHero, TitoloIntro, TestoIntro, TagFotoIntro, Blocchi (JSON), Stato, MetaTitle, MetaDescription, InPrimoPiano (checkbox) |
| `Blog` | Titolo, Slug, Autore, DataPubblicazione, Categoria, DescrizioneBreve, FotoHero, Contenuto (HTML), MetaTitle, MetaDescription, Pubblicato, Ordine |
| `FAQ` | Domanda, Risposta (HTML), Ordine, Attivo |
| `Localita` | Citta, Slug, ServiziAttivi (comma-separated), IntroText (HTML), MetaTitle, MetaDescription, Attiva, Ordine |
| `Menu` | Nome, Categoria, Descrizione, Prezzo, Formato, Sottocategoria, Ordine, Attivo, Etichetta, Note, Produttore, Regione, Prezzo2, Formato2, Senza Glutine (bool, legacy), Senza Lattosio (bool, legacy), **Allergeni** (text, CSV "1,3,7") — allergeni EU 1–14. `senzaGlutine`/`senzaLattosio` sul sito derivati da Allergeni (#1 assente = senza glutine, #7 assente = senza lattosio); fallback ai bool legacy se Allergeni vuoto |
| `Media` | Url, Alt, Tag (multi), Ordine, SoloMobile |
| `Orari` | Giorno, AperturaPranzo, ChiusuraPranzo, AperturaCena, ChiusuraCena, Chiuso |
| `Prenotazioni` | Nome, Email, Telefono, Data, Ora, Persone, Fascia, Note, Stato, ConsensoMarketing |
| `ClientiFidelity` | Nome, Cognome, Email, Telefono, Crediti, DataIscrizione, Tag |
| `Statistiche` | Settimana, Prenotazioni, Coperti, Cancellazioni, ClientiUnici, LeadTime, AnalisiIA, **Visite sito**, **Visitatori unici web**, **Pageviews**, **Bounce rate**, **Visite pagina prenota**, **Pagina più visitata** |
| `RichiesteEventi` | Nome, Cognome, Email, Telefono, TipoEvento, NumOspiti, DataEvento, Note, ConsensoMarketing |
| `RichiesteContatti` | Nome, Cognome, Email, Telefono, Messaggio, ConsensoMarketing |
| `Popup` | Config popup modali |
| `Configurazione` | `Chiave` (primary, text), `Valore` (text) — impostazioni runtime. Record rilevanti: `conferma_manuale_giorni` (CSV giorni 0=dom…6=sab, retrocompat.), `conferma_manuale_date` (JSON array `[{id, descrizione, dataInizio, dataFine}]`) — le prenotazioni in queste date vanno in `Stato: In attesa` |

---

## Dashboard (`dashboard/src/`)

### Pannelli attivi
| Panel | Funzionalità |
|-------|-------------|
| **Home** | Widget: prenotazioni in attesa, meteo (Open-Meteo), recensioni, note |
| **CalendarioPanel** | FullCalendar (4 view). Editor evento inline. Chiusure + festività 2024-2028. AI "Suggerisci agenda" via Gemini |
| **AgendaPanel** | Lista/edit eventi completa, BlocchiEditor, RichTextEditor, sezione SEO |
| **MenuPanel** | CRUD menu con DnD per riordino |
| **MediaPanel** | Upload/gestione foto con tag e ordine |
| **FaqPanel** | FAQ con DnD e RichTextEditor (Tiptap) |
| **BlogPanel** | CRUD articoli, DnD, toggle pubblicato, modal editor + SEO |
| **LocalSeoPanel** | Lista città, toggle attiva, RichTextEditor intro, servizi dinamici da Agenda, SEO, preview URL |
| **OrariPanel / GestisciOrariPanel** | 3 tab: "Orari Ordinari" (OrariPanel), "Chiusure & Aperture" (ChiusurePanel), "Conferma Prenotazioni" (ConfermaPrenotazioniPanel) |
| **FidelityPanel** | 3 tab: Iscrivi, Ricarica, GestisciTag |
| **ClientiPanel** | Database clienti fidelity con crediti e storico |
| **AnalyticsPanel** | KPI settimanali (prenotazioni, coperti, cancellazioni, clienti unici, LTV). Grafici: bar giorni, pie fasce. Report AI Gemini |
| **RecensioniSitoPanel** | Scraping + visualizzazione Google Reviews e TripAdvisor |
| **RecensioniWidget** (home) | Widget con card Google + TripAdvisor (voto, conteggio, diff settimana/mese) + due grafici SVG separati (linea blu Google, linea verde TripAdvisor) con storico settimanale da Airtable `Recensioni` |
| **SocialStudioPanel** | Editor post social con slide template, cattura PNG, upload **R2**, programmazione. Tipi: `post` e `storia` (9:16). Template: `TemplateOffertaSerata` (4:5) e `TemplateOffertaSerataStoria` (9:16) aggiunti 2026-05-11. Per eventi ricorrenti, "Recupera dati da evento" compila `dataTesto` con etichette tipo `Da Mar a Dom (Escluso Sabato)` calcolate da `GiorniEsclusione` + `Orari` attivi |

### Hooks (`dashboard/src/hooks/`) — 20 hook
`useAppuntamenti`, `useBlog`, `useCalendario`, `useChiusure`, `useConfigurazione`, `useFaq`, `useFidelity`, `useLocalita`, `useMedia`, `useMenu`, `useMeteo`, `useNote`, `useOrari`, `usePrenotazioni`, `usePrenotazioniGiornaliere`, `useRecensioni`, `useRecensioniSito`, `useTag`, `useAnalytics`, `useUmamiStats`

**Cache in-memory (TTL 5 min):** `dashboard/src/lib/cache.js` — `cacheGet`, `cacheSet`, `cacheInvalidate`, `cacheInvalidatePrefix`. Applicata a: `useAppuntamenti`, `useOrari`, `useMedia`, `useFaq`, `useMenu`. Riduce chiamate Netlify Functions/Airtable per sessioni attive; invalidata automaticamente su ogni operazione di scrittura.

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
| **Umami** | Analytics pageview (tracking + API stats). Dati settimanali (visite, visitatori, pageviews, bounce rate, conversioni /prenota, top page) ora persistiti su Airtable via cron |
| **ImageKit** | CDN per immagini vecchie (pre-migrazione). Bandwidth limit raggiunto — nessun nuovo upload |
| **Cloudflare R2** | Storage permanente immagini media + slide social. `upload-media.js` (media), `upload-slide.js` (social). Zero egress |
| **Open-Meteo** | Meteo widget dashboard (no API key) |

---

## SEO

- Meta tag statici su tutte le pagine statiche
- `generateMetadata` dinamico su `/eventi-speciali/[slug]` e `/blog/[slug]`
- JSON-LD `Event` su pagine evento, `BlogPosting` su articoli blog, `Restaurant` in `layout.tsx`
- `og:image` dinamica da `fotoHero` per eventi e blog; `openGraphImageUrl()` su tutte le pagine menu
- Local SEO: `/vicino-a/[city]` + `/vicino-a/[city]/[service]` con canonical; sitemap include tutte le varianti
- **Caratteristiche Boogie nei testi:** cucina del territorio rivisitata, pizza tradizionale forno a legna, birre locali, eventi tutto l'anno, giardino nella bella stagione
- **NON citare:** pizza napoletana, hamburger (rimossi), menu fisso pranzo (non attivo)

---

## TODO produzione (`TODO-PRODUZIONE.md`)

- [x] **Risolto (2026-05-13)** — Compleanno-premio: cron giornaliero `0 8 * * *`, finestra rolling +7 giorni, dedup via `ANNO_ULTIMO_COMPLEANNO` Brevo (stringa anno). ⚠️ Creare attributo `ANNO_ULTIMO_COMPLEANNO` (tipo Text) in Brevo → Contacts → Settings → Contact attributes
- [ ] Gallery: filtri tag (Cucina, Pizza, Giardino, Locale, Serate)
- [ ] Progress bar navigazione (NProgress-style con `usePathname`)
- [x] **Risolto (2026-05-11)** — `revalidate` centralizzato in `revalidate.ts` (3gg blog/media/faq, 1gg agenda/orari)
- [ ] `og:image` statica in `public/og-image.jpg` → aggiungere in `layout.tsx`
- [ ] Creare lista Brevo "Aggiornamenti eventi" + env var
- [ ] Rimuovere fascia "Aperitivo" da Airtable Orari
- [ ] `/eventi-aziendali/[city]`: filtrare `generateStaticParams` per `ServiziAttivi`
- [ ] Analisi Gemini in `AnalyticsPanel` su `RichiesteEventi` e `RichiesteContatti`
- [ ] Aggiornare Privacy Policy (raccolta dati personali Airtable)
- [x] **Risolto (2026-05-05)** — Storie programmate ora riconosciute correttamente anche con template verticali (`foto_916`, `*_storia`, `*_story`) e pubblicate come `STORIES`
- [x] **Risolto (2026-05-05)** — Doppia pubblicazione da cron concorrenti: introdotto lock per-record su `RisultatiPubblicazione.lockRunId` senza usare `Stato='In pubblicazione'`
- [x] **Risolto (2026-05-05)** — Social Studio su eventi ricorrenti: popolamento testo periodo (es. `Da Mar a Dom (Escluso Sabato)`) usando `giorniEsclusione` + giorni di apertura da `Orari`
- [ ] Testare flow Social Automation end-to-end (cron ora ogni 4 ore)
- [ ] Configurare dominio custom su Netlify
- [ ] **Multilingua (futuro):** `next-intl`, prefisso `/en /fr /de /es`, campi Airtable `_EN/_FR/_DE/_ES`
- [x] **Risolto (2026-06-03)** — Migrazione image hosting ImageKit → Cloudflare R2. Upload media dashboard ora su R2 (`upload-media.js`). Netlify Image CDN per ottimizzazione. 6 foto 404 da sostituire manualmente.
- [x] **Risolto (2026-06-03)** — Banner chiusure/aperture straordinarie: fix desktop (fixed + segue scroll), fix mobile (hamburger spostato a bottom-28), avviso orari modificati ora link a /eventi-speciali.

---

## Note tecniche importanti

### Social Automation — storie IG via API
- `pubblica ora` funziona: il frontend passa `mediaType: 'STORIES'` esplicitamente a `pubblica-social.js`
- `programmato (cron)`: lo schedulatore legge `f['TipoContenuto']` da Airtable — se vale `'storia'` chiama `pubblicaIgStorie()` con `media_type: 'STORIES'`
- fallback template scheduler: se `TipoContenuto` manca/è incoerente, il cron riconosce storie dai template (`foto_916`, nomi contenenti `storia`, suffisso `_story`)
- Meta Graph API: le storie usano `/{IG_USER_ID}/media` con `media_type: 'STORIES'` + polling `status_code=FINISHED` + `media_publish`
- **Differenza chiave rispetto ai post**: le storie non hanno `caption`, il container va creato con `media_type: 'STORIES'` — se questo campo manca, Meta pubblica come post normale senza errore
- Il cron non gestisce Facebook Stories (escluso con `filter(p => !(p === 'facebook' && isStoria))`)
- Anti-duplicato cron: lock ottimistico per record via `RisultatiPubblicazione` + verifica ownership lock prima della pubblicazione effettiva

### Conferma manuale prenotazioni (2026-05-22)
- `prenota.js` legge `get-configurazione` a ogni prenotazione e controlla due config:
  - `conferma_manuale_giorni` — CSV giorni settimana (retrocompatibilità, non più gestito da UI)
  - `conferma_manuale_date` — JSON array `[{id, descrizione, dataInizio, dataFine}]` di date/range specifici
- Se la data prenotazione ricade in uno dei range → `Stato: In attesa`, email cliente "Richiesta ricevuta" (senza link calendario), email ristorante con bottone "Conferma prenotazione" → `{SITO_URL}/conferma-prenotazione?id=...`
- Se non ricade → flusso normale `Stato: Confermata`
- `conferma.js` — gestisce la conferma: cambia stato, manda email definitiva al cliente + notifica Telegram
- La config si modifica dal dashboard: **GestisciOrariPanel → tab "Conferma Prenotazioni"** (`ConfermaPrenotazioniPanel.jsx`) — form data inizio/fine + nota, lista date attive con rimozione
- `AttesaWidget` (Home dashboard) mostra le prenotazioni in attesa con bottone "Conferma" che apre la stessa pagina

### ImageKit & Cloudflare R2
- **Upload media (dashboard)** — migrato da ImageKit a **Cloudflare R2** (2026-06-02). `netlify/functions/upload-media.js` carica immagini sotto il prefisso `media/`. Helper client: `dashboard/src/lib/r2-media.js` → `uploadMediaToR2(file)`.
- **Upload slide social (dashboard)** — migrato da ImageKit a **Cloudflare R2** (2026-05-07). `netlify/functions/upload-slide.js` carica PNG sotto `social_posts/`. Helper client: `dashboard/src/lib/r2.js`.
- **Image loader website** (`website/image-loader.ts`) — gestisce tre casi:
  1. URL `ik.imagekit.io` (foto vecchie non migrate) → trasformazione via ImageKit CDN
  2. URL R2 e altri esterni in produzione → Netlify Image CDN (`/.netlify/images?url=...&w=...&q=...&fm=auto`) per ottimizzazione WebP/AVIF zero egress
  3. Dev → URL originale
- **Migrazione ImageKit → R2** (2026-06-03) — script `migrate-media-to-r2.mjs` alla root. Migrati ~77/83 record. 6 foto 404 (cancellate da ImageKit) da sostituire manualmente in Airtable: record Media `recP3zsnvll4IL2eo`, `recVmIA3KPVS56znf`, `recksHLl7fkaAsXck`, `recu8SCvC4Vdes8j4`; Agenda `recVmdWNfQIglh8vD`; Blog `recmPswNGVpBsIbik`.
- **Airtable Base ID corretto**: `appo1z9qJbcQm2PQx` (non `appE7FPb3LSVHBQP5`).
- **Env var dashboard** (Vite): `VITE_AIRTABLE_TOKEN`, `VITE_AIRTABLE_BASE_ID` — separate da `AIRTABLE_TOKEN`/`AIRTABLE_BASE_ID` usate dalle Netlify Functions.
- Cloudinary non più usato nel progetto.

### Meta / Social
- `META_ACCESS_TOKEN` deve essere **Page Access Token** (NON User Token)
- System User "Boogie Bot" in Meta Business Manager con token non-scadente
- Per ottenere Page Token: `curl "https://graph.facebook.com/v19.0/{PAGE_ID}?fields=access_token&access_token={SYSTEM_USER_TOKEN}"`

### CSS Audit Dashboard (2026-05-11)
Revisione capillare di tutti i pannelli. Fix principali:
- **Hover invisible text**: pulsanti attivi con `background: var(--accent)` (gold) e `color` non dichiarato → il `:hover` generico impostava `color: var(--accent)` = testo gold su sfondo gold. Fix: `color: #fff` sull'stato attivo + regola `*Active:hover` con `background: var(--accent2)`.
- **Border variables**: standardizzato `border: 1px solid var(--border)` → `var(--border-style)` e `var(--border2)` → `var(--border-style)` in tutti i pannelli.
- **Modal overlay opacity**: uniformata a `rgba(0,0,0,0.45)` su tutti i pannelli (FaqPanel, ChiusurePanel, OrariPanel, CalendarioPanel).

### Hydration mismatch `<html>` (2026-05-12)
`suppressHydrationWarning` aggiunto su `<html>` in `layout.tsx`. Necessario perché alcune estensioni browser (gestori password, Avast, ecc.) iniettano `data-arp=""` sul tag `<html>` prima che React idrati, causando mismatch. Approccio ufficiale Next.js per `<html>` e `<body>`.

### Dev refresh loop (fix 2026-05-24)
In Next.js 16.2.3 con Turbopack, avere `turbopack: {}` esplicito in `next.config.ts` causava un loop di reload ogni ~1s in dev mode (Turbopack terminava la compilazione di tutte le route e inviava HMR update continui). **Fix**: rimosso `turbopack: {}` da `next.config.ts` (ridondante — Next.js 16 usa Turbopack di default per `next dev`) + svuotato la cartella `.next` che aveva artefatti misti Webpack/Turbopack. Se il problema ricompare: `rm -rf website/.next` e riavviare.

### GestisciOrariPanel — layout desktop
`.wrapper` in `GestisciOrariPanel.module.css` ha `max-width: 900px` per evitare che i tab (Orari, Chiusure, Conferma) si allarghino eccessivamente su desktop wide. Si applica a tutti e tre i tab.

### ChiusurePanel — fasce orarie (fix 2026-06-01)
Il campo `Fascia` in Airtable (tabella Chiusure) è **Multi-select** con valori `Pranzo` e `Cena`.
- `gestisci-chiusure.js` GET restituisce `fasce[]` (array, non stringa)
- POST/PATCH inviano `fasce[]` — il componente `ChiusurePanel.jsx` usa sempre `form.fasce` (array)
- Mancava l'handler PATCH: aggiunto — senza di esso la modifica non persisteva su Airtable
- `fetchChiusure()` in `website/lib/orari.ts` ora mappa `fasce[]` nel tipo `ChiusuraRecord`

### Banner chiusure/aperture straordinarie (2026-06-01, fix 2026-06-02)
`website/components/BannerChiusure.tsx` — striscia visibile quando ci sono chiusure o aperture straordinarie nei prossimi 7 giorni.
- **Verde scuro** → apertura straordinaria · **Rosso scuro** → chiusura straordinaria
- Badge "Apertura straordinaria" / "Chiusura straordinaria" + testo formato automatico (data singola o range, fasce se specificate)
- Link "Prenota →" solo per le aperture straordinarie
- Dismiss con localStorage TTL 24h (chiave `bb-banner-chiusure`)
- **Desktop** (`lg+`): `sticky top-20 z-[45]` — si posiziona esattamente sotto la navbar scrollata (h-20). Se più eventi: dots + rotazione 5s
- **Mobile**: `fixed bottom-16 z-[45]` — sopra la bottom bar (h-16). Testo marquee infinito (`@keyframes marquee` in globals.css, 18s) con testo duplicato per seamless loop. X fissa a destra
- Filtraggio date eseguito **lato client** con `Date.now()` reale (evita stale date da ISR cache) — eventi con `dataFine` passata non vengono mostrati
- Montato in `layout.tsx` tra `<Navbar>` e `<PageTransition>`, riceve `eventiBanner` dal server (revalidate 1 giorno)

### Route group `(standalone)` — pagine senza navbar (2026-06-16)
`website/app/(standalone)/` — route group per pagine standalone (senza Navbar, BannerChiusure, PopupManager). Layout: `(standalone)/layout.tsx` restituisce solo `{children}` senza html/body (sono nel root layout). La visibilità di Navbar/Banner/Popup è controllata da `NavbarShell.tsx` (client component con `usePathname`). Array `STANDALONE_PATHS` in `NavbarShell.tsx` — aggiungere qui i path da escludere. Attualmente: `/feedback`.

### Form prenotazione — link telefono gruppi >10 (2026-06-01)
In `FormPrenotazioneMultiStep.tsx` il testo "contattaci direttamente" per gruppi >10 persone è ora un link `tel:+393465813309`.

### Chiusure — revalidate 30 minuti (2026-06-02)
`fetchChiusure()` in `website/lib/orari.ts` usa `revalidate: 1800` (30 minuti). On-demand revalidation valutata e abbandonata per complessità/inaffidabilità. Il BannerChiusure filtra le date lato client per evitare stale data da cache ISR.

### Allergeni menu (2026-06-08)
Aggiunto campo `Allergeni` (Single line text, CSV "1,3,7") su Airtable tabella `Menu`. Contiene i numeri degli allergeni EU 1–14 presenti nel piatto.
- **Dashboard** (`MenuPanel.jsx`) — griglia 14 checkbox nel modal di modifica, per tutte le categorie. I vecchi checkbox "Senza glutine" / "Senza lattosio" sono stati rimossi (ridondanti).
- **Website** (`website/lib/menu.ts`) — `senzaGlutine` e `senzaLattosio` ora derivati da `Allergeni`: se la lista non è vuota, `senzaGlutine = #1 assente`, `senzaLattosio = #7 assente`. Se `Allergeni` è vuoto, fallback ai campi boolean legacy `Senza Glutine`/`Senza Lattosio` (retrocompatibilità per piatti non ancora aggiornati).
- I chip "Senza glutine" / "Senza lattosio" sul sito continuano a funzionare esattamente come prima.

### Hero images locali (2026-06-12)
Le due immagini hero statiche in `public/images/hero/` sono:
- `sala-boogie-bistrot-colle-brianza.webp`
- `giardino-boogie-bistrot-colle-brianza.avif` ← usata come fallback universale in tutto il sito

I vecchi path `1.webp` e `2.avif` (inesistenti) sono stati sostituiti globalmente con `giardino-*`.

### Email feedback — alternanza Google / TripAdvisor (2026-06-12)
`netlify/functions/feedback.js` — il bottone positivo alterna piattaforma in base al giorno del mese:
- **Giorno pari** → Google Reviews (`search.google.com/local/writereview?placeid=...`)
- **Giorno dispari** → TripAdvisor (`tripadvisor.it/UserReviewEdit-g2717697-d17786536-...`)
- Il bottone negativo punta sempre a `/feedback` (interno)
- Label del bottone aggiornata dinamicamente ("Lascia una recensione su Google" / "su TripAdvisor")
- URL TripAdvisor overridabile via env var `TRIPADVISOR_REVIEW_URL`

### Widget Recensioni dashboard — grafici storici (2026-06-12)
`dati-dashboard.js` ora include `storico[]` (ultimi 10 record Airtable `Recensioni`, ordine cronologico).
`RecensioniWidget.jsx` mostra due grafici SVG separati affiancati sotto le card:
- Blu → Google, Verde → TripAdvisor
- Asse Y indipendente per ogni piattaforma (scala propria)
- Si renderizza solo se ≥2 punti disponibili per quella piattaforma

### Audit codebase (2026-06-16) — fix applicati
- **netlify.toml**: rimosso redirect 301 `/feedback → /` che bloccava la nuova pagina feedback in produzione
- **privacy/page.tsx**: rimosso import `Navbar` inutilizzato (la navbar è nel root layout)
- **galleria/page.tsx** + **fidelity/page.tsx**: aggiunti `export const revalidate = 259200` (erano render dinamici ad ogni visita)
- **links/page.tsx**: corretto `GIORNI_ESTESI` da minuscolo a Title Case (coerente con Navbar e page.tsx)
- **eventi-aziendali/page.tsx** + **[city]/page.tsx**: rimossa funzione `shuffle()` non-operante (`return [...arr]`), chiamate sostituite con spread diretto
- **Navbar.tsx**: rimosso alias `prenotaBottomLabel` ridondante; semplificato `PHONES` in singola costante `PHONE`
- **Eliminati file orfani**: `SmartImage.tsx`, `lib/cloudinary.ts`, `EventoPopup.tsx`, `public/conferma-prenotazione.html`
- **lib/orari.ts**: rimossa `buildOrariDisplay()` (mai chiamata, sostituita da `buildOrariLines()`)
- **lib/media.ts**: rimossa `fetchMediaById()` (mai chiamata)

### ⚠️ Problemi di sicurezza pendenti — richiedono azione manuale
1. **`.env` nella root del monorepo** contiene credenziali reali (Airtable, Meta, Brevo). Il file è in `.gitignore` ma andrebbe eliminato — le Netlify Functions leggono le env vars dall'interfaccia Netlify in produzione.
2. **`upload-media.js` e `upload-slide.js`** non hanno autenticazione: accettano POST senza `verifyToken` né header segreto. Chiunque conosca l'URL può caricare file su R2.
3. **`VITE_IMAGEKIT_PRIVATE_KEY`** in `dashboard/.env.local` è esposta nel bundle Vite (prefisso `VITE_`). La migrazione a R2 è completata — il file `dashboard/src/lib/imagekit.js` può essere eliminato insieme alla env var.
4. **`og-image.jpg`** mancante in `website/public/` — fallback 404 se Airtable non risponde al fetch `og-image` tag.

*Aggiornato: 16 Giugno 2026*
