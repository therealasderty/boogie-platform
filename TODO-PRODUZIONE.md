# TODO prima di andare in produzione

## Checklist lancio

- [ ] Testare favicon su Chrome, Safari e mobile
- [ ] Verificare che tutte le pagine `/vicino-a/[slug]` siano indicizzate (attiva=true in Airtable)
- [ ] Fare "↻ Sincronizza servizi" dal pannello Local SEO della dashboard per creare i record LocalitaServizi mancanti
- [ ] Controllare sitemap (`/sitemap.xml`) — includere le rotte `/vicino-a/` e `/blog/`
- [ ] Testare il form di prenotazione, il form contatti e il form eventi aziendali su mobile
- [ ] Controllare OG image su [opengraph.xyz](https://www.opengraph.xyz) per la home e le pagine evento principali
- [ ] Verificare che cookie banner non blocchi il rendering su Safari/iOS
- [ ] Testare le frecce del carousel su touch (swipe non implementato — ok per ora?)
- [ ] Impostare dominio custom su Netlify e aggiornare i redirect
- [ ] Aggiungere variabili d'ambiente su Netlify (produzione): `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `JWT_SECRET`, eventuali altri

---

## Website (Next.js)

- [ ] **Filtri per tag nella galleria** — bottoni filtro per categoria (Cucina, Pizza, Giardino, Locale, Serate…) che mostrano solo le foto del tag selezionato. Usa `fetchMedia(tag)` già esistente.
- [ ] **Progress bar di navigazione** — barra sottile in cima alla pagina che appare durante la navigazione client-side tra pagine (pattern GitHub/YouTube). Implementare con `usePathname` per rilevare il cambio di route.


- [ ] Rimettere `revalidate = 300` in:
  - `website/app/eventi-speciali/[slug]/page.tsx`
  - `website/app/eventi-speciali/page.tsx`
  - `website/app/api/agenda/route.ts`
  - `website/lib/agenda.ts` (fetch `next: { revalidate: 300 }`)
  (ora tutti a 30s per test)

## Multilingua (futuro)

- [ ] **Lingue da supportare**: inglese, francese, tedesco, spagnolo
- [ ] **Approccio**: `next-intl` con routing per prefisso (`/en`, `/fr`, `/de`, `/es`)
- [ ] **Cosa tradurre**: UI + FAQ + descrizioni brevi menu — contenuto Airtable resta in italiano con fallback
- [ ] **Airtable**: aggiungere campi `_EN`/`_FR`/`_DE`/`_ES` solo su FAQ e descrizioni menu
- [ ] **Impatto**: wrap `app/` in `app/[locale]/`, middleware lingua browser, ~20 file, sitemap con varianti hreflang

## Brevo

- [ ] Creare lista "Aggiornamenti eventi" su Brevo e prendere l'ID
- [ ] Aggiungere su Netlify: `BREVO_LIST_ID_EVENTI`
- [x] `BREVO_API_KEY`, `EMAIL_RISTORANTE`, `EMAIL_FROM`, `BREVO_LIST_ID` — già configurate

## Airtable / Dati

- [ ] Rimuovere la fascia "Aperitivo" dalla tabella **Orari** in Airtable.
  Attualmente è presente come legacy del vecchio sistema di prenotazione online.
  Una volta online, l'Aperitivo è gestito dall'appuntamento in Agenda
  (con il suo form di prenotazione dedicato sulla pagina evento).
  Tenerla attiva causa slot duplicati nella pagina /prenota.
- [x] Tabelle `RichiesteEventi` e `RichiesteContatti` create — populate automaticamente dai form

## Eventi Aziendali

- [ ] Aggiungere `eventi-aziendali` nei `ServiziAttivi` delle città in Airtable dove vuoi la pagina localizzata, e filtrare `generateStaticParams` di `[city]/page.tsx` di conseguenza
- [ ] Aggiornare Privacy Policy — ora i dati dei form vengono salvati in Airtable
- [ ] Analisi Gemini in `AnalyticsPanel` sui dati di `RichiesteEventi` (pattern nelle note, tipo evento più richiesto, stagionalità)
