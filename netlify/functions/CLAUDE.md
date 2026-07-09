# Netlify Functions — CLAUDE.md

44 funzioni serverless Node.js. Tutte protette da `verifyToken` (JWT) salvo eccezioni pubbliche. CORS su tutte.

---

## Prenotazioni

| Funzione | Auth | Scopo |
|----------|------|-------|
| `prenota.js` | no | POST → Airtable `Stato='Confermata'` (o `In attesa`) + email + notifica Telegram |
| `conferma.js` | no | GET da link email → flag "Confermata" + tag Brevo + email definitiva cliente |
| `disponibilita.js` | no | GET slot liberi per data/persone |
| `gestisci-prenotazione.js` | sì | PATCH da dashboard |
| `get-prenotazioni.js` | sì | GET lista prenotazioni |
| `prenotazioni-attesa.js` | sì | GET lista d'attesa |
| `prenotazioni-giornaliere.js` | sì | GET per analytics |
| `cancella-prenotazione.js` | sì | DELETE + notifica email |

### Conferma manuale prenotazioni
`prenota.js` legge `get-configurazione` a ogni prenotazione e controlla:
- `conferma_manuale_date` — JSON `[{id, descrizione, dataInizio, dataFine}]`

Se la data ricade in un range → `Stato: In attesa`, email "Richiesta ricevuta" + email ristorante con bottone "Conferma" → `{SITO_URL}/conferma-prenotazione?id=...`. Altrimenti → flusso normale `Stato: Confermata`.

---

## Agenda / Contenuti

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
| `gestisci-chiusure.js` | sì | CRUD chiusure. GET → `fasce[]` (array). POST/PATCH → `fasce[]`. PATCH aggiunge/aggiorna record esistenti |
| `pulizia-chiusure.js` | — | **CRON** lunedì 3:00 — rimuove chiusure scadute |

---

## Local SEO

| Funzione | Auth | Scopo |
|----------|------|-------|
| `gestisci-localita.js` | sì | CRUD città (Localita Airtable) |
| `gestisci-localita-servizi.js` | sì | Sync LocalitaServizi (combo città × servizio) |

---

## Analytics & AI

| Funzione | Auth | Scopo |
|----------|------|-------|
| `statistiche-settimanali.mjs` | — | **CRON** domenica 23:00 — KPI settimana → Airtable Statistiche. Fetcha in parallelo: prenotazioni, meteo, eventi, Umami web stats |
| `get-statistiche.js` | sì | GET statistiche con trend |
| `genera-analisi.js` | sì | Gemini API → report (PRO, CRITICITÀ, OPPORTUNITÀ) → AnalisiIA |
| `genera-analisi-background.js` | — | Background function (15min), rigenera analisi storiche |

---

## Contatti & Email

| Funzione | Auth | Scopo |
|----------|------|-------|
| `contatta.js` | no | Form contatti → RichiesteContatti + email Brevo |
| `contatta-evento-aziendale.js` | no | Form eventi aziendali → RichiesteEventi + email Brevo |
| `feedback.js` | no | Invia email feedback post-cena a prenotazioni confermate + WiFi_Clienti di ieri (deduplicati per email). Bottone positivo: giorno pari → Google, dispari → TripAdvisor |
| `salva-feedback.js` | no | Salva risposta negativa da `/feedback` |

---

## Configurazione runtime

| Funzione | Auth | Scopo |
|----------|------|-------|
| `get-configurazione.js` | no | GET impostazioni come `{ chiave: valore }` — letto da `prenota.js` a ogni prenotazione |
| `gestisci-configurazione.js` | sì | GET/PATCH tabella `Configurazione` Airtable |

---

## Fidelity

`fidelity-iscrizione.js`, `fidelity-ricarica.js`, `fidelity-clienti.js`, `get-clienti.js`, `get-tag.js`

---

## Social & Recensioni

| Funzione | Auth | Scopo |
|----------|------|-------|
| `pubblica-social.js` | sì | Genera caption Gemini + pubblica su Meta (FB+IG) e Google Business Profile. Actions: `genera-caption`, `pubblica`, `pubblica-carosello`. Storie: `mediaType: 'STORIES'` |
| `pubblica-social-schedulato.mjs` | — | **CRON** ogni 4 ore — legge `SocialPosts` con `Stato='Programmato'`. Lock anti-concorrenza via `RisultatiPubblicazione.lockRunId` |
| `upload-slide.js` | sì | POST multipart PNG → Cloudflare R2 (AWS SigV4 nativo) sotto `social_posts/` |
| `upload-media.js` | sì* | POST immagine → Cloudflare R2 sotto `media/`. *⚠️ Manca verifyToken — vedere sicurezza* |
| `compleanno-premio.js` | — | **CRON** domenica — email regalo clienti fidelity con `DATE_OF_BIRTH` nella settimana successiva. Protetta da `CRON_SECRET` |
| `gestisci-social-posts.js` | sì | CRUD tabella `SocialPosts` Airtable |
| `scraping-recensioni.js` | sì | Google Reviews via Places API |
| `scraping-tripadvisor.js` | sì | TripAdvisor via ScraperAPI — **CRON** lunedì 4:00, timeout 26s |

---

## WiFi Captive Portal

| Funzione | Auth | Scopo |
|----------|------|-------|
| `portal-check.js` | — | Verifica cookie `boogie_guest` (HMAC) |
| `portal-submit.js` | — | Salva Airtable `WiFi_Clienti`, Brevo DOI, autorizza Omada Cloud API, imposta cookie 90gg |

**Env vars:**
- `OMADA_CONTROLLER_URL` = `https://euw1-omada-cloud.tplinkcloud.com`
- `OMADA_CONTROLLER_ID` = `dc8234c2e5d318455bab0ba38e3cb374`
- `OMADA_OPERATOR_USERNAME` / `OMADA_OPERATOR_PASSWORD`
- `PORTAL_COOKIE_SECRET` = secret HMAC 64 char hex

Nota: `portal-submit.js` chiama Omada **Cloud** API (non IP locale — Netlify non raggiunge la LAN).

---

## Misc

`auth.js`, `verifyToken.js`, `note.js`, `dati-dashboard.js`, `get-umami-stats.js`

> **`send-reminders.mjs`** — schedule rimosso dal `netlify.toml` (2026-06-01). Per riabilitare: aggiungere `[functions.send-reminders] schedule = "30 9 * * *"` in `netlify.toml`.

---

## Note tecniche

### Social Automation — storie IG
- `pubblica ora`: frontend passa `mediaType: 'STORIES'` esplicitamente
- `programmato (cron)`: legge `TipoContenuto` da Airtable — se `'storia'` chiama `pubblicaIgStorie()` con `media_type: 'STORIES'`
- Fallback scheduler: riconosce storie dai template (`foto_916`, nomi con `storia`, suffisso `_story`)
- Meta Graph API: storie usano `/{IG_USER_ID}/media` con `media_type: 'STORIES'` + polling `status_code=FINISHED` + `media_publish`
- **Differenza chiave**: storie non hanno `caption`. Se `media_type` manca, Meta pubblica come post normale senza errore
- Cron non gestisce Facebook Stories (`filter(p => !(p === 'facebook' && isStoria))`)
- Anti-duplicato: lock ottimistico per record via `RisultatiPubblicazione` + verifica ownership prima della pubblicazione

### Meta / Social
- `META_ACCESS_TOKEN` deve essere **Page Access Token** (NON User Token)
- System User "Boogie Bot" in Meta Business Manager con token non-scadente
- Per ottenere Page Token: `curl "https://graph.facebook.com/v19.0/{PAGE_ID}?fields=access_token&access_token={SYSTEM_USER_TOKEN}"`

### ChiusurePanel — fasce orarie
Campo `Fascia` in Airtable (tabella Chiusure) è **Multi-select** (`Pranzo`/`Cena`). `gestisci-chiusure.js` GET restituisce `fasce[]`. POST/PATCH inviano `fasce[]`.
