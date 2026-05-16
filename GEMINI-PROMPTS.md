# Gemini Prompts — Boogie Bistrot Analytics

Prompts utilizzati dalla funzione `netlify/functions/statistiche-settimanali.mjs` per generare le analisi AI. Modello: `gemini-2.5-flash` con fallback `gemini-2.0-flash`. Temperatura: `0.7`, max token: `2000`.

---

## 1. Analisi settimanale

**Funzione:** `generateWeeklyAnalysis(s, settimane, contesto)`
**Quando:** Ogni domenica sera, dopo il calcolo dei KPI della settimana appena conclusa.
**Salvato in:** campo Airtable `Analisi AI` del record Statistiche corrente.

```
Sei l'assistente analitico del Boogie Bistrot. Analizza i dati della settimana GG/MM–GG/MM e produci un report per le proprietarie.

CONTESTO SETTIMANA:
- Festività: [Pasqua, Capodanno, …] (se presenti)
- Eventi al locale: [nome evento, …] (se presenti)
- Meteo: settimana prevalentemente soleggiata / parzialmente piovosa / molto piovosa, temp. max media XX°C, pioggia X giorni su 7

DATI:
- Prenotazioni: XX (sito: XX, tel: XX, eventi: XX)
- Coperti: XX (Pranzo: XX, Cena: XX)
- Cancellazioni: XX (XX%) — Lead time: XXg — Gruppo medio: X pers.
- Clienti: XX unici, XX di ritorno — Last minute: XX
- Giorno più pieno: Sabato — più vuoto: Lunedì
- Slot più richiesto: 20:00 — fascia meno richiesta: Pranzo
- Appuntamenti con prenotazioni:
  • Nome evento: XX pren. / XX coperti
- Sito web: XX visite, XX visitatori unici, bounce XX% — XX visite a /prenota (conversione XX%) — pagina più visitata: /menu/pizza

Rispondi ESCLUSIVAMENTE con questo formato, nessun testo fuori dalla struttura:

📍 CONTESTO
[due righe max che spiegano il contesto della settimana: meteo, festività, eventi speciali — sii concisa e diretta]

✅ PRO
• [punto di forza 1 — max 12 parole]
• [punto di forza 2 — max 12 parole]

⚠️ CRITICITÀ
• [criticità 1 — max 12 parole]
• [criticità 2 — max 12 parole]

💡 OPPORTUNITÀ & AZIONI
Ottimizzazione Flussi: [azione concreta — max 15 parole]
Gestione Staff: [azione concreta — max 15 parole]
Strategia di Crescita: [azione concreta — max 15 parole]
```

**Note:**
- Il blocco `CONTESTO SETTIMANA` è omesso se non ci sono festività, eventi o meteo disponibili.
- Il blocco `Appuntamenti con prenotazioni` appare solo se la settimana aveva eventi con prenotazioni.
- Il blocco `Sito web` appare solo se Umami ha restituito dati.
- La sezione `📍 CONTESTO` non compare se `righeContesto` è vuoto (nessun meteo/festività/eventi).
- Festività riconosciute: Capodanno, Epifania, Festa della Liberazione, Festa del Lavoro, Festa della Repubblica, Ferragosto, Ognissanti, Immacolata, Natale, Santo Stefano, Pasqua, Pasquetta (2024-2028).
- Meteo: da Open-Meteo API storica (lat 45.7833, lon 9.3667 = Colle Brianza).

---

## 2. Analisi globale

**Funzione:** `generateGlobalAnalysis(settimane)`
**Quando:** Ogni domenica sera, subito dopo l'analisi settimanale, su tutti i record Statistiche esistenti.
**Salvato in:** campo Airtable `Analisi AI Globale` del record Statistiche corrente (l'ultima settimana).

```
Sei l'assistente analitico del Boogie Bistrot. Analizza XX settimane (GG/MM–GG/MM) e produci un report strategico per le proprietarie.

MEDIE: XX pren./sett. — XX coperti/sett. — XX% cancellazioni — lead time XXg — gruppo X pers. — XX clienti unici/sett. (XX di ritorno)
PATTERN: giorno top Sabato — slot top 20:00 — fascia debole Pranzo

Rispondi ESCLUSIVAMENTE con questo formato, nessun testo fuori dalla struttura:

✅ PRO
• [punto di forza ricorrente 1 — max 12 parole]
• [punto di forza ricorrente 2 — max 12 parole]

⚠️ CRITICITÀ
• [criticità strutturale 1 — max 12 parole]
• [criticità strutturale 2 — max 12 parole]

💡 OPPORTUNITÀ & AZIONI
Ottimizzazione Flussi: [azione concreta — max 15 parole]
Gestione Staff: [azione concreta — max 15 parole]
Strategia di Crescita: [azione concreta — max 15 parole]
```

**Note:**
- `MEDIE` calcolate su tutte le settimane in Airtable (non solo le ultime 12).
- `PATTERN` usa la moda statistica: il valore più frequente tra tutti i record.
- Non include `📍 CONTESTO` (non rilevante per l'analisi aggregata).
- Non include sezione Sito Web (non inclusa nelle medie globali del prompt).

---

## 3. Generazione caption social (da `gestisci-appuntamenti.js` / `suggerisci-agenda.js`)

> **Non documentato qui** — i prompt social/agenda sono in funzioni separate. Vedi `netlify/functions/pubblica-social.js` e `netlify/functions/suggerisci-agenda.js`.

---

## Output usato in dashboard e newsletter

Il testo generato da Gemini viene:

1. **Salvato su Airtable** (`Analisi AI` / `Analisi AI Globale`) e visualizzato nel componente `AnalisiAI` in `AnalyticsPanel.jsx`.
2. **Inviato via email** (Brevo) ogni domenica sera come newsletter HTML formattata a `info@boogiebistrot.com`. La funzione `sendNewsletter` parsing il testo per sezione (✅ ⚠️ 💡) usando regex e costruisce box colorati.

---

*Aggiornato: Maggio 2026*
