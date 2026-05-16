# Netlify Functions — Boogie Platform

Mappa completa delle 49 functions: chi le chiama, quando e cosa fanno.

---

## Cron automatici

```
0 8 * * *                    → compleanno-premio.mjs         (ogni giorno 8:00)
30 9 * * *                   → send-reminders.mjs            (ogni giorno 9:30)
0 3 * * 1                    → pulizia-chiusure.mjs          (lunedì 3:00)
0 4 1 * *                    → pulizia-social-posts.mjs      (1° del mese 4:00)
0 23 * * 0                   → statistiche-settimanali.mjs   (domenica 23:00)
0 2,6,10,14,18,22 * * *      → pubblica-social-schedulato.mjs (ogni 4 ore)
```

---

## Prenotazioni

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `prenota.js` | HTTP | POST | no | `FormPrenotazioneMultiStep.tsx` → `/api/prenota` | Crea prenotazione su Airtable, email conferma con link Calendar + notifica Telegram |
| `disponibilita.js` | HTTP | GET | no | `FormPrenotazioneMultiStep.tsx` → `/api/disponibilita?data=` | Ritorna slot liberi per data/persone, considera chiusure e prenotazioni esistenti |
| `conferma.js` | HTTP | GET | no | Link nell'email di conferma inviata da `prenota.js` | Conferma prenotazione, aggiorna Airtable, applica tag Brevo |
| `gestisci-prenotazione.js` | HTTP | POST, PATCH | sì | Dashboard `usePrenotazioni` | Modifica stato prenotazione, gestisce lista d'attesa |
| `get-prenotazioni.js` | HTTP | GET | sì | Dashboard analytics | Lista prenotazioni per dashboard |
| `prenotazioni-attesa.js` | HTTP | GET | sì | Dashboard `usePrenotazioni` | Lista prenotazioni in attesa |
| `prenotazioni-giornaliere.js` | HTTP | GET | sì | Dashboard widget home | Prenotazioni di oggi/domani/dopodomani per widget |
| `cancella-prenotazione.js` | HTTP | GET, POST | sì | Dashboard oppure link email cancellazione | Cancella prenotazione, notifica email al cliente e al ristorante |

---

## Agenda e contenuti

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `gestisci-appuntamenti.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useAppuntamenti` | CRUD Agenda Airtable, gestisce notifiche lista d'attesa alla riapertura evento |
| `suggerisci-agenda.js` | HTTP | POST | sì | Dashboard CalendarioPanel (pulsante "AI Suggerisci") | Gemini API suggerisce tipo evento in base a festività |
| `gestisci-blog.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useBlog` | CRUD Blog Airtable, stato pubblicazione, metadata SEO |
| `gestisci-faq.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useFaq` | CRUD FAQ, HTML rich text, ordinamento |
| `gestisci-menu.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useMenu` | CRUD Menu Airtable con ordinamento DnD |
| `get-menu.js` | HTTP | GET | sì | Dashboard (verifiche interne) | Menu con filtri categoria/ordinamento |
| `get-popup.js` | HTTP | GET | no | `PopupManager.tsx` (3s dopo mount) | Ritorna evento `InPrimoPiano=true` più rilevante per popup modale |
| `gestisci-orari.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useOrari` | CRUD orari per giorno/fascia, aperture straordinarie |
| `get-orari.js` | HTTP | GET | no | Uso interno website | Orari formattati in testo per footer/contatti |
| `gestisci-chiusure.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard | CRUD chiusure straordinarie (data specifica o ricorrenti) |
| `get-chiusure.js` | HTTP | GET | no | Uso interno website | Chiusure pubblico |
| `get-faq.js` | HTTP | GET | no | Uso interno website (server component) | FAQ per accordion homepage |
| `pulizia-chiusure.mjs` | CRON | — | — | Netlify Scheduler (lunedì 3:00) | Elimina chiusure data-specifica scadute |

---

## Local SEO

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `gestisci-localita.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useLocalita` | CRUD città (Localita Airtable), intro HTML, SEO, toggle attiva |
| `gestisci-localita-servizi.js` | HTTP | GET, POST | sì | Dashboard LocalSeoPanel (auto-sync) | Sincronizza LocalitaServizi (combo città × servizio evento) |

---

## Social

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `pubblica-social.js` | HTTP | POST | sì | Dashboard SocialStudioPanel (azioni manuali) | Genera caption Gemini + pubblica su Meta (FB+IG) e Google Business Profile. Actions: `genera-caption`, `pubblica`, `pubblica-carosello` |
| `pubblica-social-schedulato.mjs` | CRON | — | — | Netlify Scheduler (ogni 4 ore) | Legge `SocialPosts` con `Stato='Programmato'` e `DataProgrammata` passata, pubblica con lock anti-concorrenza |
| `gestisci-social-posts.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useSocialPosts` | CRUD SocialPosts Airtable (bozze, programmati, pubblicati, errori) |
| `upload-slide.js` | HTTP | POST | sì | Dashboard SocialStudioPanel (upload PNG) | Upload slide su Cloudflare R2 via AWS SigV4 (zero dipendenze extra) |
| `gestisci-preset-social.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard SocialStudioPanel | CRUD template di slide social riutilizzabili |
| `scraping-recensioni.js` | HTTP | GET | API Key | cron-job.org esterno (webhook) | Scraping Google Places API, salva rating e conteggio su Airtable |
| `pulizia-social-posts.mjs` | CRON | — | — | Netlify Scheduler (1° del mese 4:00) | Elimina SocialPosts con Stato=Pubblicato/Errore più vecchi di 90 giorni |

---

## Fidelity e clienti

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `fidelity-iscrizione.js` | HTTP | POST | no | `FormFidelity.tsx` → `/api/fidelity` | Iscrizione programma fidelity, aggiunge contatto a Brevo con lista e tag |
| `fidelity-ricarica.js` | HTTP | POST | sì | Dashboard `useFidelity` | Ricarica crediti cliente fidelity |
| `fidelity-clienti.js` | HTTP | GET | sì | Dashboard `useFidelity` | Lista clienti fidelity iscritti |
| `get-clienti.js` | HTTP | GET | sì | Dashboard analytics | Clienti fidelity con storico |
| `get-tag.js` | HTTP | GET | sì | Dashboard fidelity | Tag disponibili per clienti |
| `compleanno-premio.mjs` | CRON | — | CRON_SECRET | Netlify Scheduler (ogni giorno 8:00) | Invia email regalo ai clienti con compleanno nei prossimi 7 giorni, dedup via attributo Brevo `ANNO_ULTIMO_COMPLEANNO` |

---

## Analytics e AI

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `statistiche-settimanali.mjs` | CRON | — | STATS_SECRET | Netlify Scheduler (domenica 23:00) | Calcola KPI settimana (prenotazioni, coperti, cancellazioni, clienti unici), fetcha Umami web stats, salva su Airtable Statistiche |
| `genera-analisi.js` | HTTP | POST | sì | Dashboard AnalyticsPanel (su richiesta) | Gemini API genera report PRO/CRITICITÀ/OPPORTUNITÀ su KPI + dati Umami → salva AnalisiIA su Airtable |
| `genera-analisi-background.js` | HTTP | POST | sì | Dashboard (background, timeout 15min) | Rigenera tutte le analisi storiche su Airtable |
| `get-statistiche.js` | HTTP | GET | sì | Dashboard `useAnalytics` | KPI settimanali con trend % vs settimana precedente |
| `get-umami-stats.js` | HTTP | GET | sì | Chiamato da `statistiche-settimanali.mjs` | Proxy autenticato verso Umami Cloud API (visite, visitatori, bounce rate, top pages, conversioni /prenota) |

---

## Contatti e email

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `contatta.js` | HTTP | POST | no | `FormContatti.tsx` → `/.netlify/functions/contatta` | Form contatti → RichiesteContatti Airtable + email Brevo. Rate limit: 3 invii ogni 10min per IP |
| `contatta-evento-aziendale.js` | HTTP | POST | no | `FormEventoAziendale.tsx` | Form eventi aziendali → RichiesteEventi Airtable + email Brevo |
| `send-reminders.mjs` | CRON | — | — | Netlify Scheduler (ogni giorno 9:30) | Invia email reminder alle prenotazioni Confermate per oggi, con link di cancellazione |
| `scraping-tripadvisor.js` | HTTP | GET | sì | Dashboard RecensioniSitoPanel | Scraping TripAdvisor, salva recensioni su Airtable RecensioniSito |

---

## Auth e utility

| Function | Tipo | Metodi | Auth | Chi la chiama | Cosa fa |
|----------|------|--------|------|---------------|---------|
| `auth.js` | HTTP | POST | no | `dashboard/src/components/Login.jsx` | Login dashboard: password → genera token HMAC valido 24h |
| `verifyToken.js` | helper | — | — | `require()` interno nelle function protette | Verifica token su header `Authorization: Bearer` |
| `note.js` | HTTP | GET, POST, PATCH, DELETE | sì | Dashboard `useNote` | Note private dashboard (scratchpad) |
| `dati-dashboard.js` | HTTP | GET | sì | Dashboard widget home | Dati aggregati widget home (prenotazioni rapide, meteo Open-Meteo) |
| `_email.js` | helper | — | — | Interno (require da altre function) | Utilità invio email condivisa |
| `feedback.js` / `salva-feedback.js` | HTTP | POST | no | Form feedback | Salva feedback su Airtable |
