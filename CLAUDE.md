# Boogie Platform — CLAUDE.md

Monorepo in `/boogie-platform` su GitHub: therealasderty.

**Boogie Bistrot** — ristorante a Colle Brianza (LC). Cucina del territorio rivisitata, pizza forno a legna, birre locali, eventi tutto l'anno, giardino in estate.

---

## Stack e struttura

- `website/` — Next.js 16.2.3, React 19, TypeScript, Tailwind CSS v4
- `dashboard/` — React 18 + Vite, JSX, FullCalendar, Phosphor Icons, @dnd-kit, Tiptap
- `netlify/functions/` — 44 funzioni serverless Node.js (backend + automazioni)

**Deploy:** Netlify. `netlify.toml` nella root: `base=website`, `publish=.next`, `functions=../netlify/functions`.

---

## Airtable — Tabelle principali

**Airtable Base ID corretto:** `appo1z9qJbcQm2PQx`

| Tabella | Campi rilevanti |
|---------|----------------|
| `SocialPosts` | Titolo, Stato (Bozza/Programmato/Pubblicato/Errore), DataProgrammata, Caption, Slides (JSON), Piattaforme (CSV), **TipoContenuto** (post/storia), RisultatiPubblicazione, ErroreMsg |
| `Agenda` | Titolo, Slug, Data, Ora, OraFine, Ricorrenza, GiorniSettimana, DescrizioneBreve, FotoHero, TitoloIntro, TestoIntro, TagFotoIntro, Blocchi (JSON), Stato, MetaTitle, MetaDescription, InPrimoPiano |
| `Blog` | Titolo, Slug, Autore, DataPubblicazione, Categoria, DescrizioneBreve, FotoHero, Contenuto (HTML), MetaTitle, MetaDescription, Pubblicato, Ordine |
| `FAQ` | Domanda, Risposta (HTML), Ordine, Attivo |
| `Localita` | Citta, Slug, ServiziAttivi (comma-separated), IntroText (HTML), MetaTitle, MetaDescription, Attiva, Ordine |
| `Menu` | Nome, Categoria, Descrizione, Prezzo, Formato, Sottocategoria, Ordine, Attivo, Etichetta, Note, Produttore, Regione, Prezzo2, Formato2, **Allergeni** (text, CSV "1,3,7") — allergeni EU 1–14 |
| `Media` | Url, Alt, Tag (multi), Ordine, SoloMobile |
| `Orari` | Giorno, AperturaPranzo, ChiusuraPranzo, AperturaCena, ChiusuraCena, Chiuso |
| `Chiusure` | campo `Fascia` è **Multi-select** con valori `Pranzo`/`Cena` — restituisce `fasce[]` (array) |
| `Prenotazioni` | Nome, Email, Telefono, Data, Ora, Persone, Fascia, Note, Stato, ConsensoMarketing |
| `ClientiFidelity` | Nome, Cognome, Email, Telefono, Crediti, DataIscrizione, Tag |
| `Statistiche` | Settimana, Prenotazioni, Coperti, Cancellazioni, ClientiUnici, LeadTime, AnalisiIA, Visite sito, Visitatori unici web, Pageviews, Bounce rate, Visite pagina prenota, Pagina più visitata |
| `RichiesteEventi` | Nome, Cognome, Email, Telefono, TipoEvento, NumOspiti, DataEvento, Note, ConsensoMarketing |
| `RichiesteContatti` | Nome, Cognome, Email, Telefono, Messaggio, ConsensoMarketing |
| `Configurazione` | `Chiave` (primary), `Valore` — impostazioni runtime. Record: `conferma_manuale_date` (JSON `[{id, descrizione, dataInizio, dataFine}]`) |
| `WiFi_Clienti` | Email, Nome, Prima visita, Ultima visita, Contatore visite, Consenso marketing, MAC addresses, Fonte |

**Env var:** `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` nelle Netlify Functions. `VITE_AIRTABLE_TOKEN` / `VITE_AIRTABLE_BASE_ID` nel dashboard Vite (separate).

---

## Integrazioni esterne

| Servizio | Uso |
|----------|-----|
| **Airtable** | Database centrale (CMS) per tutti i contenuti |
| **Brevo** | Email transazionali + newsletter + tag clienti |
| **Gemini API** | Caption social, analisi KPI, suggerisce agenda (`gemini-2.5-flash` → fallback `gemini-2.0-flash`) |
| **Meta Graph API** | Pubblica post su Facebook Page + Instagram Business. Token = **Page Access Token** (NON User Token) |
| **Google Business Profile** | Pubblica Local Post (OAuth2 refresh token) |
| **Telegram** | Notifiche nuove prenotazioni |
| **Umami** | Analytics pageview + API stats settimanali persistiti su Airtable |
| **Cloudflare R2** | Storage permanente immagini media + slide social. Zero egress |
| **ImageKit** | CDN per immagini vecchie (pre-migrazione). Bandwidth limit raggiunto — nessun nuovo upload |
| **Open-Meteo** | Meteo widget dashboard (no API key) |

---

## TODO produzione

- [ ] Gallery: filtri tag (Cucina, Pizza, Giardino, Locale, Serate)
- [ ] Progress bar navigazione (NProgress-style con `usePathname`)
- [ ] `og:image` statica in `public/og-image.jpg` → aggiungere in `layout.tsx`
- [ ] Creare lista Brevo "Aggiornamenti eventi" + env var
- [ ] Rimuovere fascia "Aperitivo" da Airtable Orari
- [ ] `/eventi-aziendali/[city]`: filtrare `generateStaticParams` per `ServiziAttivi`
- [ ] Analisi Gemini in `AnalyticsPanel` su `RichiesteEventi` e `RichiesteContatti`
- [ ] Aggiornare Privacy Policy (raccolta dati personali Airtable)
- [ ] Testare flow Social Automation end-to-end (cron ora ogni 4 ore)
- [ ] WiFi Portal: configurare lista Brevo + template Double Opt-In (`BREVO_WIFI_LIST_ID`, `BREVO_DOI_TEMPLATE_ID`)
- [ ] WiFi Portal: test end-to-end su smartphone (incluso flow "Sei già registrato?")
- [ ] WiFi Portal Omada: uploadare template custom (`/tmp/omada-portal-boogie.zip`) su OC200 → Hotspot Manager → Portal → Custom Portal
- [ ] Configurare dominio custom su Netlify
- [ ] Multilingua (futuro): `next-intl`, prefisso `/en /fr /de /es`, campi Airtable `_EN/_FR/_DE/_ES`

---

## ⚠️ Problemi di sicurezza pendenti

1. **`.env` nella root** contiene credenziali reali. È in `.gitignore` ma andrebbe eliminato — le Netlify Functions leggono le env vars dall'interfaccia Netlify.
2. **`upload-media.js` e `upload-slide.js`** non hanno autenticazione: accettano POST senza `verifyToken`. Chiunque conosca l'URL può caricare su R2.
3. **`VITE_IMAGEKIT_PRIVATE_KEY`** in `dashboard/.env.local` è esposta nel bundle Vite. Migrazione R2 completata — `dashboard/src/lib/imagekit.js` può essere eliminato.
4. **`og-image.jpg`** mancante in `website/public/` — fallback 404 se Airtable non risponde.

*Aggiornato: 13 Luglio 2026*
