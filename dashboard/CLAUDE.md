# Dashboard — CLAUDE.md

React 18 + Vite, JSX, FullCalendar, Phosphor Icons, @dnd-kit, Tiptap.

**Env var Vite:** `VITE_AIRTABLE_TOKEN`, `VITE_AIRTABLE_BASE_ID` (separate da quelle Netlify Functions).

---

## Design System (`src/styles/global.css`)

Tema chiaro fisso (no dark mode). Variabili in `:root`. **Mai colori hardcoded nei componenti.**

### Colori
| Token | Valore | Uso |
|-------|--------|-----|
| `--bg` | `#F7F3ED` | Sfondo pagina principale |
| `--bg2` | `#FFFFFF` | Sfondo card, modal, pannelli |
| `--bg3` | `#EDE8DC` | Sfondo hover, tag, chip |
| `--bg-input` | `#fdfaf4` | Sfondo input, textarea, select |
| `--border` | `#C8B99A` | Bordo standard |
| `--border2` | `#D8CCBA` | Bordo secondario |
| `--text` | `#1A1208` | Testo primario |
| `--text2` | `#3D2E18` | Testo secondario |
| `--text3` | `#7A6448` | Testo terziario, label, placeholder |
| `--accent` | `#B8820A` | Oro — CTA, hover border, stati attivi |
| `--accent2` | `#7A5F30` | Oro scuro — hover su `.btn-accent` |
| `--danger` | `#C0392B` | Rosso — azioni distruttive |
| `--success` | `#2E7D32` | Verde — stati positivi |

### Tipografia
- `--font-body`: `'Geist', 'Inter', sans-serif` — testo UI
- `--font-display`: `'Instrument Sans', sans-serif` — h1, h2
- Base: `font-size: 17px`

### Spacing & Radius
| Token | Valore |
|-------|--------|
| `--radius` | `8px` — modal, card |
| `--radius-sm` | `6px` — bottoni, input, tag |
| `--radius-lg` | `12px` — card grandi |
| `--border-style` | `1px solid var(--border)` |
| `--shadow` | `0 1px 4px rgba(0,0,0,0.06)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` — modal, dropdown |

### Button system (classi globali)
| Classe | Uso |
|--------|-----|
| `.btn-primary` | Azione principale — sfondo `--text`, hover `--accent` |
| `.btn-secondary` | Azione secondaria — bordo, sfondo trasparente |
| `.btn-accent` | CTA oro — sfondo `--accent`, hover `--accent2` |
| `.btn-outline-accent` | Contorno oro — "Nuovo post", "Crea" |
| `.btn-outline-success` | Bordo neutro, hover verde |
| `.btn-danger` | Azione distruttiva |
| `.btn-ghost` | Link-like senza bordo — logout, link secondari |
| `.btn-icon` | Solo icona quadrata. `.danger` per hover rosso |
| `.btn-toggle` | Selezione tra opzioni. `.active` = oro, `.active-green` = verde, `.active-danger` = rosso |
| `.btn-sm` | Modificatore compatto |

**Pulsanti attivi:** `color: #fff` sull'stato attivo + `*Active:hover { background: var(--accent2) }` — evita testo gold su sfondo gold.

### Pattern modal
```
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

## Pannelli attivi

| Panel | Funzionalità |
|-------|-------------|
| **Home** | Widget: prenotazioni in attesa, meteo (Open-Meteo), recensioni, note |
| **CalendarioPanel** | FullCalendar (4 view). Editor evento inline. Chiusure + festività 2024-2028. AI "Suggerisci agenda" |
| **AgendaPanel** | Lista/edit eventi, BlocchiEditor, RichTextEditor, sezione SEO |
| **MenuPanel** | CRUD menu con DnD per riordino. Griglia 14 checkbox allergeni nel modal |
| **MediaPanel** | Upload/gestione foto con tag e ordine |
| **FaqPanel** | FAQ con DnD e RichTextEditor (Tiptap) |
| **BlogPanel** | CRUD articoli, DnD, toggle pubblicato, modal editor + SEO |
| **LocalSeoPanel** | Lista città, toggle attiva, RichTextEditor intro, servizi dinamici da Agenda, SEO, preview URL |
| **OrariPanel** | 3 tab: "Orari Ordinari", "Chiusure & Aperture" (ChiusurePanel), "Conferma Prenotazioni" (ConfermaPrenotazioniPanel) |
| **FidelityPanel** | 3 tab: Iscrivi, Ricarica, GestisciTag |
| **ClientiPanel** | Database clienti fidelity |
| **AnalyticsPanel** | KPI settimanali, grafici bar/pie, report AI Gemini |
| **RecensioniSitoPanel** | Scraping + visualizzazione Google + TripAdvisor |
| **RecensioniWidget** (home) | Card Google + TripAdvisor + due grafici SVG separati (blu Google, verde TripAdvisor), storico da Airtable `Recensioni` |
| **SocialStudioPanel** | Editor post social, slide template, cattura PNG, upload R2, programmazione. Tipi: `post` e `storia` (9:16). Template: `TemplateOffertaSerata` (4:5) e `TemplateOffertaSerataStoria` (9:16). Per eventi ricorrenti: "Recupera dati da evento" compila `dataTesto` con etichette tipo `Da Mar a Dom (Escluso Sabato)` |

---

## Hooks (`src/hooks/`)

`useAppuntamenti`, `useBlog`, `useCalendario`, `useChiusure`, `useConfigurazione`, `useFaq`, `useFidelity`, `useLocalita`, `useMedia`, `useMenu`, `useMeteo`, `useNote`, `useOrari`, `usePrenotazioni`, `usePrenotazioniGiornaliere`, `useRecensioni`, `useRecensioniSito`, `useTag`, `useAnalytics`, `useUmamiStats`

**Cache in-memory TTL 5 min** (`src/lib/cache.js` — `cacheGet`, `cacheSet`, `cacheInvalidate`, `cacheInvalidatePrefix`). Applicata a: `useAppuntamenti`, `useOrari`, `useMedia`, `useFaq`, `useMenu`. Invalidata automaticamente su ogni scrittura.

---

## Componenti utility

`Login.jsx`, `Sidebar.jsx`, `ModalPrenotazione.jsx`, `FloatingButton.jsx`, `BlocchiEditor.jsx`, `RichTextEditor.jsx`

Widget home: `AttesaWidget`, `MeteoWidget`, `RecensioniWidget`, `PrenotazioniWidget`

---

## Note tecniche

### GestisciOrariPanel — layout desktop
`.wrapper` in `GestisciOrariPanel.module.css` ha `max-width: 900px` — evita che i tab si allarghino eccessivamente su desktop wide.

### ConfermaPrenotazioniPanel
Modifica config `conferma_manuale_date` (JSON array `[{id, descrizione, dataInizio, dataFine}]`). Form data inizio/fine + nota, lista date attive con rimozione. `AttesaWidget` (Home) mostra le prenotazioni in attesa con bottone "Conferma".
