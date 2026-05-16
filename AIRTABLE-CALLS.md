# Airtable Calls — Boogie Platform

Mappa completa di tutte le letture/scritture Airtable nel progetto, utile per individuare dove ridurre le chiamate.

---

## 1. Funzioni fetch in `website/lib/`

| Funzione | Tabella | `revalidate` | Note |
|----------|---------|-------------|------|
| `fetchEventi()` | Agenda | **86400** (1 giorno) | Filter: escludi bozze. Sort: Data ASC. Max 200 |
| `fetchEventoBySlug(slug)` | — | — | Chiama `fetchEventi()`, filtra in memoria |
| `fetchArticoli()` | Blog | **259200** (3 giorni) | Filter: Pubblicato=true, slug non vuoto. Sort: Ordine ASC. Max 200 |
| `fetchArticoloBySlug(slug)` | — | — | Chiama `fetchArticoli()`, filtra in memoria |
| `fetchFaq()` | FAQ | **259200** (3 giorni) | Filter: Attivo≠false. Sort: Ordine ASC |
| `fetchMedia(tag?)` | Media | **259200** (3 giorni) | Filter: opzionale per tag. Sort: Ordine ASC |
| `fetchMediaById(id)` | Media | **259200** (3 giorni) | Singolo record per ID |
| `fetchOrari()` | Orari | **86400** (1 giorno) | — |
| `fetchChiusure()` | Chiusure | **86400** (1 giorno) | — |
| `fetchGiorniAperti()` | Orari | **86400** (1 giorno) | Campi selettivi: Giorni, Attivo |
| `fetchMenuSpecialita/Pizza/Birre/Vini/Cocktails()` | Menu | **86400** (1 giorno) | 5 chiamate separate, una per categoria. Filter: Categoria + Attivo=TRUE. Sort: Sottocategoria+Ordine ASC |
| `fetchLocalita()` | Localita | **259200** (3 giorni) | Filter: Attiva=true, slug/citta non vuoti. Sort: Ordine ASC. Max 200 |
| `fetchLocalitaBySlug(slug)` | — | — | Chiama `fetchLocalita()`, filtra in memoria |
| `fetchIntroServizio(cittaSlug, eventoSlug)` | LocalitaServizi | **259200** (3 giorni) | Filter: AND(CittaSlug, EventoSlug, Attiva=1). Campo: IntroText |
| `fetchRecensioni()` | RecensioniSito | **259200** (3 giorni) | Filter: Attivo=TRUE. Sort: Ordine ASC |

---

## 2. Pagine `page.tsx` — revalidate e fetch usate

| Pagina | `revalidate` locale | Fetch chiamate |
|--------|---------------------|----------------|
| `/` (homepage) | **nessuno** | fetchOrari, fetchChiusure, fetchMedia, fetchEventi |
| `/blog` | 259200 (3gg) | fetchArticoli, fetchMedia |
| `/blog/[slug]` | 259200 (3gg) | fetchArticoli, fetchArticoloBySlug |
| `/faq` | 259200 (3gg) | fetchFaq, fetchMedia |
| `/galleria` | **nessuno** | fetchMedia |
| `/menu/pizza` | **nessuno** | fetchMenuPizza, fetchMedia |
| `/menu/specialita` | **nessuno** | fetchMenuSpecialita, fetchMedia |
| `/menu/birre` | **nessuno** | fetchMenuBirre, fetchMedia |
| `/menu/vini` | **nessuno** | fetchMenuVini, fetchMedia |
| `/menu/cocktails` | **nessuno** | fetchMenuCocktails, fetchMedia |
| `/eventi-speciali` | 86400 (1gg) | fetchEventi, fetchGiorniAperti |
| `/eventi-speciali/[slug]` | 86400 (1gg) | fetchEventi, fetchEventoBySlug, fetchOrari, fetchChiusure, fetchMedia |
| `/prenota` | 86400 (1gg) | fetchMedia |
| `/contattaci` | 300 (5min) | fetchOrari, fetchChiusure, fetchMedia |
| `/vicino-a/[city]` | 300 (5min) | fetchLocalita, fetchLocalitaBySlug, fetchMedia, fetchEventi |
| `/vicino-a/[city]/[service]` | 300 (5min) | fetchLocalita, fetchLocalitaBySlug, fetchIntroServizio, fetchEventoBySlug, fetchOrari, fetchChiusure, fetchMedia |
| `/eventi-aziendali` | 300 (5min) | fetchMedia |
| `/eventi-aziendali/[city]` | 300 (5min) | fetchLocalita, fetchLocalitaBySlug, fetchMedia |
| `sitemap.ts` | 259200 (3gg) | fetchEventi, fetchLocalita, fetchArticoli |

> **Nota:** Le pagine senza `revalidate` locale ereditano quello delle singole funzioni fetch in `website/lib/`.
> Le pagine con `revalidate` locale **sovrascrivono** quello delle lib (il valore più basso vince).

---

## 3. API Routes `website/app/api/`

| Route | Metodo | Tabelle | `revalidate` / cache | Operazione |
|-------|--------|---------|----------------------|-----------|
| `/api/agenda` | GET | Agenda | **3600** (1h) | Read — lista ridotta, sort Data ASC, max 200 |
| `/api/get-popup` | GET | Agenda | **3600** inline | Read — eventi popup (Stato="attivo"), sort Data ASC, max 50 |
| `/api/disponibilita` | GET | Prenotazioni, Chiusure, Orari, Agenda | **force-dynamic** + cache in-memory 15s | Read — calcolo slot disponibili |
| `/api/prenota` | POST | Prenotazioni | — | Write — crea prenotazione + email + Telegram |
| `/api/iscriviti-aggiornamenti` | POST | ListaAttesa | — | Write — iscrizione lista attesa evento + Brevo |
| `/api/fidelity` | POST | ClientiFidelity | — | Proxy verso Netlify functions |

---

## 4. Netlify Functions — operazioni Airtable

### Letture (GET/READ)

| Function | Tabelle | Dettagli |
|----------|---------|---------|
| `gestisci-appuntamenti.js` | Agenda | Lista completa, sort Data ASC, max 200 |
| `gestisci-blog.js` | Blog | Lista, sort Ordine ASC, max 200 |
| `gestisci-localita.js` | Localita | Lista, sort Ordine ASC, max 200 |
| `gestisci-localita-servizi.js` | LocalitaServizi + Localita | Paginata (offset), max 200/pagina |
| `get-popup.js` | Agenda | Filter: OR(stati attivo/futuro/passato+InPrimoPiano), max 50 |
| `get-orari.js` | Orari | Lettura e formattazione |
| `get-chiusure.js` | Chiusure | Lettura e formattazione |
| `get-prenotazioni.js` | Prenotazioni | Lista con auth JWT |
| `get-menu.js` | Menu | Menu pubblico |
| `get-faq.js` | FAQ | FAQ pubblica |
| `disponibilita.js` | Prenotazioni, Chiusure, Orari, Agenda | Calcolo slot (stesse tabelle di `/api/disponibilita`) |
| `dati-dashboard.js` | Prenotazioni, Chiusure, Orari | Dati home dashboard |
| `get-statistiche.js` | Statistiche | Analytics settimanali |
| `prenotazioni-giornaliere.js` | Prenotazioni | Fetch giornaliere per analytics |

### Scritture (POST/PATCH/DELETE)

| Function | Tabella | Operazione |
|----------|---------|-----------|
| `prenota.js` | Prenotazioni | CREATE + email + Telegram |
| `conferma.js` | Prenotazioni | PATCH (flag Confermata) |
| `cancella-prenotazione.js` | Prenotazioni | DELETE + email |
| `gestisci-prenotazione.js` | Prenotazioni | PATCH / DELETE (auth) |
| `gestisci-appuntamenti.js` | Agenda | POST / PATCH / DELETE (auth) |
| `gestisci-blog.js` | Blog | POST / PATCH / DELETE (auth) |
| `gestisci-faq.js` | FAQ | POST / PATCH / DELETE (auth) |
| `gestisci-menu.js` | Menu | POST / PATCH / DELETE (auth) |
| `gestisci-chiusure.js` | Chiusure | POST / DELETE (auth) |
| `gestisci-orari.js` | Orari | POST / PATCH / DELETE (auth) |
| `gestisci-localita.js` | Localita | POST / PATCH / DELETE (auth) |
| `gestisci-localita-servizi.js` | LocalitaServizi | POST / PATCH / DELETE (auth) |
| `gestisci-social-posts.js` | SocialPosts | POST / PATCH / DELETE (auth) |
| `contatta.js` | RichiesteContatti | CREATE |
| `contatta-evento-aziendale.js` | RichiesteEventi | CREATE |
| `fidelity-iscrizione.js` | ClientiFidelity | CREATE |
| `fidelity-ricarica.js` | ClientiFidelity | PATCH |
| `pubblica-social.js` | SocialPosts | PATCH (stato post) |
| `salva-feedback.js` | Feedback | CREATE |
| `note.js` | Note | CREATE |

### CRON automatici

| Function | Schedule | Tabelle | Operazione |
|----------|---------|---------|-----------|
| `pubblica-social-schedulato.mjs` | ogni 4h | SocialPosts | READ + PATCH (pubblica post programmati) |
| `statistiche-settimanali.mjs` | domenica 23:00 | Statistiche, Prenotazioni, Agenda | READ + WRITE KPI settimanali |
| `genera-analisi-background.js` | ogni 15min | Statistiche, AnalisiIA | READ + WRITE (Gemini) |
| `pulizia-social-posts.mjs` | 1° del mese 4:00 | SocialPosts | DELETE (post >90gg) |
| `pulizia-chiusure.mjs` | lunedì 3:00 | Chiusure | DELETE (chiusure scadute) |
| `send-reminders.mjs` | — | Prenotazioni | READ + email promemoria |
| `compleanno-premio.js` | domenica | ClientiFidelity | READ + email regalo |
| `scraping-recensioni.js` | — | RecensioniSito | READ + WRITE (Google Reviews) |
| `scraping-tripadvisor.js` | — | RecensioniSito | READ + WRITE (TripAdvisor) |

---

## 5. Dove ridurre le chiamate

### Problemi principali

#### Homepage senza revalidate
`/` chiama `fetchOrari`, `fetchChiusure`, `fetchMedia`, `fetchEventi` senza nessun `revalidate` locale.
Le singole lib hanno revalidate da 1 a 3 giorni — ma senza un revalidate esplicito sulla pagina Next.js potrebbe non raggrupparle correttamente.
**→ Aggiungere `export const revalidate = 86400` alla homepage.**

#### Pagine menu senza revalidate
`/menu/pizza`, `/menu/specialita`, `/menu/birre`, `/menu/vini`, `/menu/cocktails` — tutte senza revalidate locale.
**→ Aggiungere `export const revalidate = 86400`.**

#### 5 chiamate separate per il menu
`fetchMenuSpecialita/Pizza/Birre/Vini/Cocktails()` fanno 5 fetch distinte sulla tabella `Menu` con filtro per categoria.
**→ Creare un'unica `fetchMenu()` che scarica tutta la tabella (max 200 record) e raggruppa in memoria per categoria. Una sola chiamata invece di 5.**

#### fetchMedia duplicata su quasi ogni pagina
`fetchMedia()` viene chiamata praticamente su ogni pagina, a volte più volte (con e senza tag).
Con `revalidate = 259200` in lib, è già condivisa dalla cache Next.js se stessa URL — ma vale la pena verificare che le chiamate con tag diversi non generino cache key separate inutili.

#### `/contattaci` con revalidate = 300
Orari e chiusure cambiano raramente — 5 minuti è eccessivamente basso.
**→ Portare a `86400` (stesso delle lib).**

#### Pagine `/vicino-a/[city]` e `/vicino-a/[city]/[service]` con revalidate = 300
Queste pagine sono SEO-first, il contenuto è quasi statico.
**→ Portare a `259200` (3 giorni).**

#### `/api/disponibilita` con `force-dynamic`
È corretto perché calcola disponibilità in tempo reale, ma fa 4 letture Airtable per ogni richiesta.
La cache in-memory a 15s è già presente — assicurarsi che copra anche `Agenda` e `Prenotazioni`, non solo Orari e Chiusure.

#### Doppia implementazione disponibilità
`/api/disponibilita/route.ts` e `disponibilita.js` (Netlify) fanno la stessa cosa su tabelle identiche.
**→ Valutare se unificare su un unico endpoint.**

---

## Riepilogo revalidate attuali

| Secondi | Contesto |
|---------|---------|
| **force-dynamic** | `/api/disponibilita` |
| **300** (5 min) | `/contattaci`, `/vicino-a/*`, `/eventi-aziendali/*` |
| **3600** (1h) | `/api/agenda`, `/api/get-popup` |
| **86400** (1 giorno) | Agenda, Menu, Orari, Chiusure (lib) + `/eventi-speciali`, `/prenota` |
| **259200** (3 giorni) | Blog, Media, FAQ, Localita, Recensioni (lib) + `/blog`, `/faq` |
| **nessuno** | Homepage, `/galleria`, tutte le pagine `/menu/*` |
