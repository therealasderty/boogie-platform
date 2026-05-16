/**
 * Email Transazionali — showcase dev only.
 * Accessibile su /design/email
 *
 * Template con valori placeholder per revisione rapida.
 * Per modificare un template vai al file indicato nella label "Funzione".
 */

export const metadata = {
  title: 'Email Transazionali — Boogie Bistrot',
  robots: { index: false, follow: false },
}

/* ── Wrapper sezione ───────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="font-sans font-semibold text-neutral-800 mb-5 pb-2 border-b border-neutral-200"
        style={{ fontSize: '1.75rem' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Meta({
  oggetto,
  funzione,
  destinatario,
  note,
}: {
  oggetto: string
  funzione: string
  destinatario: 'cliente' | 'ristorante'
  note?: string
}) {
  return (
    <div className="bg-white rounded-card border border-neutral-200 p-5 mb-4 flex flex-col gap-2">
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className={`shrink-0 text-[0.6rem] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-pill ${
            destinatario === 'cliente'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {destinatario === 'cliente' ? 'A: cliente' : 'A: ristorante'}
        </span>
        <p className="font-sans font-medium text-neutral-800" style={{ fontSize: '0.875rem' }}>
          <span className="text-neutral-400 font-normal">Oggetto: </span>
          {oggetto}
        </p>
      </div>
      <p className="font-mono text-[0.7rem] text-neutral-400">
        <span className="text-neutral-500">Funzione: </span>
        {funzione}
      </p>
      {note && (
        <p className="font-sans font-light text-neutral-500 text-[0.8rem] italic">{note}</p>
      )}
    </div>
  )
}

function EmailPreview({ html }: { html: string }) {
  return (
    <div
      className="rounded-card border border-neutral-200 overflow-hidden mb-12"
      style={{ background: '#F5F0E8' }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

/* ── HTML Templates ──────────────────────────────────────────────────────── */

const CARD_WRAP_START = `
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
  <tr><td align="center">
`
const CARD_WRAP_END = `
  </td></tr>
</table>`

function card(inner: string) {
  return `${CARD_WRAP_START}
    <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid #C4913A;">
      ${inner}
    </table>
  ${CARD_WRAP_END}`
}

function cardBody(content: string) {
  return `<tr><td style="padding:40px 40px 20px;font-family:'Raleway',Arial,sans-serif;">${content}</td></tr>`
}

function cardFooter(text: string) {
  return `<tr><td style="padding:20px 40px 30px;border-top:1px solid #D4C9B0;font-family:'Raleway',Arial,sans-serif;">
    <p style="font-size:11px;color:#B0A898;margin:0;line-height:1.7;">${text}</p>
  </td></tr>`
}

const LOGO_IMG = `<img src="/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 20px;border:0;">`
const LOGO_IMG_SM = `<img src="/logo-email.png" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 8px;border:0;">`

function label(text: string) {
  return `<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">${text}</p>`
}

function logoOnly() {
  return LOGO_IMG
}

function logoWithLabel(text: string) {
  return `${LOGO_IMG_SM}${label(text)}`
}

function h1(text: string) {
  return `<h1 style="font-size:26px;color:#1A1610;margin:0 0 8px;font-weight:400;">${text}</h1>`
}

function h1lg(text: string) {
  return `<h1 style="font-size:22px;color:#1A1610;margin:0 0 6px;font-weight:400;">${text}</h1>`
}

function sub(text: string) {
  return `<p style="font-size:13px;color:#8B6F47;margin:0 0 24px;">${text}</p>`
}

function body(text: string) {
  return `<p style="font-size:15px;color:#4A4030;line-height:1.7;margin:0 0 24px;">${text}</p>`
}

function riquadro(rows: string) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background:#F5F0E8;border-left:3px solid #C4913A;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">${rows}</td></tr>
  </table>`
}

function row(lbl: string, val: string) {
  return `<p style="margin:0 0 10px;font-size:13px;">
    <span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">${lbl}</span>
    <strong>${val}</strong>
  </p>`
}

function firma() {
  return `<p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>`
}

function btnDark(href: string, text: string) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">${text}</a>
    </td></tr>
  </table>`
}

function btnBrand(href: string, text: string) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:36px;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background:#eece9d;color:#1A1610;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">${text}</a>
    </td></tr>
  </table>`
}

/* ── 1. Notifica nuova prenotazione (ristorante) ─────────────────────────── */
const emailPrenotaRistorante = card(
  cardBody(`
    ${logoWithLabel('Gestionale')}
    ${h1lg('✅ Nuova prenotazione confermata')}
    ${sub('Ricevuta il 17/05/2026, 14:32:10')}
    ${riquadro(`
      ${row('Nome', 'Mario Rossi')}
      ${row('Data', 'sabato 17 maggio 2026')}
      ${row('Ora', '20:00')}
      ${row('Persone', '2')}
      ${row('Email', 'mario.rossi@email.it')}
      ${row('Telefono', '333 1234567')}
      ${row('Preferenza', 'Giardino')}
      ${row('Note', 'Tavolo in giardino se possibile')}
    `)}
  `) +
  cardFooter('Boogie Bistrot — Sistema prenotazioni automatico')
)

/* ── 2. Prenotazione confermata (cliente) ────────────────────────────────── */
const emailConfermaCliente = card(
  cardBody(`
    ${logoOnly()}
    ${h1('Prenotazione confermata! 🎉')}
    ${sub('Il tuo tavolo è riservato.')}
    ${body('Ciao <strong>Mario</strong>,<br>siamo lieti di confermarti la prenotazione. Non vediamo l\'ora di accoglierti!')}
    ${riquadro(`
      ${row('Data', 'sabato 17 maggio 2026')}
      ${row('Ora', '20:00')}
      ${row('Ospiti', '2 persone')}
      ${row('Preferenza', 'Interno')}
    `)}
    <p style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B6F47;margin:0 0 12px;">Aggiungi al calendario</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding-right:10px;">
          <a href="#" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">📅 Google Calendar</a>
        </td>
        <td>
          <a href="#" style="display:inline-block;background:#F5F0E8;color:#1A1610;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;border:1px solid #D4C9B0;">🍎 Apple Calendar</a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#8B6F47;line-height:1.6;margin:0 0 8px;">Per modifiche o disdette scrivici a <a href="mailto:info@boogiebistrot.com" style="color:#C4913A;">info@boogiebistrot.com</a>.</p>
    ${firma()}
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)')
)

/* ── 3. Reminder del giorno (cliente) ───────────────────────────────────── */
const emailReminder = card(
  cardBody(`
    ${logoOnly()}
    <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;line-height:1.3;">Ti aspettiamo oggi alle 20:00 🍷</h1>
    ${body('Ciao <strong>Mario</strong>,<br>ti scriviamo per il tuo tavolo di oggi alle <strong>20:00</strong>.')}
    ${body('Se hai avuto un imprevisto e non riesci più a passare, nessun problema, ma per favore faccelo sapere cliccando qui sotto: ci aiuti a liberare il posto per chi è in lista d\'attesa.')}
    ${btnBrand('#', 'Non riesco a venire')}
    <p style="font-size:16px;color:#4A4030;line-height:1.7;margin:0 0 4px;font-weight:500;">A stasera!</p>
    <p style="font-size:15px;color:#8B6F47;line-height:1.6;margin:0;">Alessandra &amp; Chiara</p>
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>Hai ricevuto questa email perché hai una prenotazione confermata per oggi.')
)

/* ── 4. Prenotazione annullata (cliente) ─────────────────────────────────── */
const emailAnnullata = card(
  cardBody(`
    ${logoOnly()}
    ${h1('Prenotazione annullata.')}
    ${body('Ciao <strong>Mario</strong>,<br>grazie per averci avvisato, abbiamo annullato il tuo tavolo per oggi.')}
    ${body('Ci spiace non averti qui, ma speriamo di recuperare presto.')}
    <p style="font-size:15px;color:#8B6F47;line-height:1.6;margin:0;">Buona giornata,<br><span style="color:#4A4030;font-weight:500;">Alessandra &amp; Chiara</span></p>
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>Puoi prenotare di nuovo su <a href="https://boogiebistrot.com/prenota" style="color:#C4913A;">boogiebistrot.com/prenota</a>')
)

/* ── 6. Messaggio ricevuto — Contatti (cliente) ──────────────────────────── */
const emailContattiCliente = card(
  cardBody(`
    ${logoOnly()}
    ${h1('Messaggio ricevuto ✓')}
    ${body('Ciao <strong>Mario</strong>,<br>abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto.')}
    ${riquadro(row('Il tuo messaggio', 'Vorrei sapere se organizzate serate private per compleanni.'))}
    <p style="font-size:13px;color:#8B6F47;line-height:1.6;">Per urgenze chiamaci al <a href="tel:3465813309" style="color:#C4913A;">346 5813309</a>.</p>
    ${firma()}
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)')
)

/* ── 7. Nuovo messaggio — Contatti (ristorante) ──────────────────────────── */
const emailContattiRistorante = card(
  cardBody(`
    ${logoWithLabel('Gestionale')}
    ${h1lg('📬 Nuovo messaggio dal sito')}
    ${sub('Ricevuto il 17/05/2026, 14:32:10')}
    ${riquadro(`
      ${row('Nome', 'Mario Rossi')}
      ${row('Email', 'mario.rossi@email.it')}
      ${row('Telefono', '333 1234567')}
      <p style="margin:0 0 12px;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Consenso Marketing</span><strong style="color:#2E7D32;">✓ Sì</strong></p>
      <p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:6px;">Messaggio</span><span style="color:#1A1610;line-height:1.7;">Vorrei sapere se organizzate serate private per compleanni.</span></p>
    `)}
    <a href="mailto:mario.rossi@email.it" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;border-radius:4px;letter-spacing:0.05em;">✉ Rispondi a Mario</a>
  `) +
  cardFooter('Boogie Bistrot — Sistema messaggi automatico')
)

/* ── 8. Evento aziendale ricevuto (cliente) ──────────────────────────────── */
const emailEventoAziendaleCliente = card(
  cardBody(`
    ${logoOnly()}
    ${h1('Richiesta ricevuta ✓')}
    ${body('Ciao <strong>Laura</strong>,<br>abbiamo ricevuto la tua richiesta per un evento aziendale e ti risponderemo al più presto per definire insieme tutti i dettagli.')}
    ${riquadro(`
      ${row('Tipo evento', 'Cena di lavoro')}
      ${row('Numero ospiti', '20')}
      ${row('Data / periodo', 'Venerdì 6 giugno 2026')}
      ${row('Note', 'Preferiamo la sala riservata, menù degustazione.')}
    `)}
    <p style="font-size:13px;color:#8B6F47;line-height:1.6;">Per urgenze chiamaci al <a href="tel:3465813309" style="color:#C4913A;">346 5813309</a>.</p>
    ${firma()}
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)')
)

/* ── 9. Evento aziendale — notifica (ristorante) ─────────────────────────── */
const emailEventoAziendaleRistorante = card(
  cardBody(`
    ${logoWithLabel('Gestionale')}
    ${h1lg('🏢 Nuova richiesta evento aziendale')}
    ${sub('Ricevuta il 17/05/2026, 14:32:10')}
    ${riquadro(`
      ${row('Nome', 'Laura Bianchi')}
      ${row('Email', 'laura.bianchi@azienda.it')}
      ${row('Telefono', '02 1234567')}
      ${row('Numero ospiti', '20')}
      ${row('Tipo evento', 'Cena di lavoro')}
      ${row('Data / periodo', 'Venerdì 6 giugno 2026')}
      ${row('Note / richieste', 'Preferiamo la sala riservata, menù degustazione.')}
      <p style="margin:0;font-size:13px;"><span style="color:#8B6F47;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">Consenso marketing</span><strong style="color:#2E7D32;">✓ Sì</strong></p>
    `)}
    <a href="mailto:laura.bianchi@azienda.it" style="display:inline-block;background:#1A1610;color:white;text-decoration:none;padding:12px 24px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;border-radius:4px;letter-spacing:0.05em;">✉ Rispondi a Laura</a>
  `) +
  cardFooter('Boogie Bistrot — Sistema messaggi automatico')
)

/* ── 10. Benvenuto Fidelity (cliente) ───────────────────────────────────── */
const emailFidelity = card(
  cardBody(`
    ${logoWithLabel('Fidelity')}
    ${h1('Benvenuto nel programma Fidelity! 🎉')}
    ${body('Ciao <strong>Mario</strong>,<br>sei ufficialmente iscritto al programma Fidelity di Boogie Bistrot.')}
    ${riquadro(`
      <p style="margin:0 0 8px;font-size:11px;color:#8B6F47;text-transform:uppercase;letter-spacing:0.08em;">Come funziona</p>
      <p style="margin:0;font-size:14px;color:#1A1610;line-height:1.7;"><strong>Ogni euro speso vale 5 punti.</strong><br>I punti si accumulano ad ogni visita e potrai usarli per ottenere premi esclusivi.</p>
    `)}
    <p style="font-size:13px;color:#8B6F47;">Il tuo saldo punti attuale: <strong style="color:#C4913A;">0 punti</strong></p>
    ${firma()}
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)')
)

/* ── 11. Richiesta recensione post-visita (cliente) ─────────────────────── */
const emailFeedback = card(
  cardBody(`
    ${logoOnly()}
    <h1 style="font-size:26px;color:#1A1610;margin:0 0 4px;font-weight:400;line-height:1.3;">Ciao Mario,</h1>
    <h1 style="font-size:26px;color:#1A1610;margin:0 0 24px;font-weight:400;line-height:1.3;">grazie per aver scelto il Boogie Bistrot sabato 17 maggio!</h1>
    ${body('Come è andata l\'esperienza? Ci farebbe molto piacere sapere la tua opinione.')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="#"
             style="display:block;background:#1A1610;color:white;text-decoration:none;padding:14px 16px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border-radius:4px;line-height:1.4;">
            😊 È stata una bella serata<br>
            <span style="font-size:11px;font-weight:400;opacity:0.7;letter-spacing:0;">Lascia una recensione</span>
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="#"
             style="display:block;background:#F5F0E8;color:#1A1610;text-decoration:none;padding:14px 16px;font-family:'Raleway',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-align:center;border:1px solid #D4C9B0;border-radius:4px;line-height:1.4;">
            😐 C'è qualcosa da migliorare<br>
            <span style="font-size:11px;font-weight:400;opacity:0.6;letter-spacing:0;">Lascia un feedback</span>
          </a>
        </td>
      </tr>
    </table>
    <p style="font-size:15px;color:#4A4030;line-height:1.6;margin:24px 0 0;">Grazie di cuore,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>Hai ricevuto questa email perché hai cenato da noi. Non vuoi ricevere questi messaggi? Scrivici a <a href="mailto:info@boogiebistrot.com" style="color:#C4913A;">info@boogiebistrot.com</a>.')
)

/* ── 12. Regalo compleanno (cliente) ─────────────────────────────────────── */
const emailCompleanno = card(
  cardBody(`
    ${logoWithLabel('Un regalo per te')}
    ${h1('Il tuo compleanno sta arrivando, Mario! 🎂')}
${body('In occasione del tuo compleanno vogliamo offrirti un piccolo omaggio.')}
    ${riquadro(`
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8B6F47;">Il tuo regalo</p>
      <p style="margin:0;font-size:16px;color:#1A1610;font-weight:bold;">🥂 Un drink a scelta dalla nostra lista</p>
      <p style="margin:8px 0 0;font-size:12px;color:#8B6F47;line-height:1.6;">Valido nella settimana del tuo compleanno, da <strong>lunedì 18 maggio</strong> a <strong>domenica 24 maggio</strong>. Mostra questa email al nostro staff al momento dell'arrivo.</p>
    `)}
    ${body('Prenota il tuo tavolo su <a href="https://boogiebistrot.com/prenota" style="color:#C4913A;">boogiebistrot.com</a> e vieni a festeggiare con noi.<br>Non vediamo l\'ora di brindare insieme!')}
    <p style="font-size:13px;color:#8B6F47;line-height:1.6;">Per info: <a href="mailto:info@boogiebistrot.com" style="color:#C4913A;">info@boogiebistrot.com</a> oppure chiamaci al <a href="tel:3465813309" style="color:#C4913A;">346 5813309</a></p>
    ${firma()}
  `) +
  cardFooter('Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br>Hai ricevuto questa email perché sei iscritto al programma Fidelity o hai prenotato presso di noi.')
)

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function EmailPage() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-24">

      {/* Header */}
      <div style={{ background: '#1a1a1a' }} className="px-8 py-12">
        <p className="font-sans font-medium uppercase text-white/35 mb-1"
           style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}>
          Design System
        </p>
        <nav className="flex items-center gap-2 mb-4" style={{ fontSize: '0.75rem' }}>
          <a href="/design" className="text-white/40 hover:text-white/70 transition-colors">Design</a>
          <span className="text-white/20">/</span>
          <span className="text-white/60">Email Transazionali</span>
        </nav>
        <h1 className="font-ivy font-light text-white leading-none mb-2" style={{ fontSize: '3.5rem' }}>
          Email Transazionali
        </h1>
        <p className="font-sans font-light text-white/50" style={{ fontSize: '0.875rem' }}>
          Tutti i template email inviati automaticamente dal sistema — per revisione e modifica rapida.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-12">

        {/* ── PRENOTAZIONI ─────────────────────────────────────────── */}
        <Section title="Prenotazioni">

          <Meta
            oggetto="Prenotazione confermata! — sabato 17 maggio ore 20:00"
            funzione="netlify/functions/prenota.js"
            destinatario="cliente"
            note="Inviata immediatamente al cliente. La prenotazione è già confermata al momento dell'invio."
          />
          <EmailPreview html={emailConfermaCliente} />

          <Meta
            oggetto="✅ Nuova prenotazione: Mario Rossi — sabato 17 maggio ore 20:00 (2 pers.)"
            funzione="netlify/functions/prenota.js"
            destinatario="ristorante"
            note="Notifica informativa. La prenotazione è già salvata come Confermata in Airtable."
          />
          <EmailPreview html={emailPrenotaRistorante} />

          <Meta
            oggetto="Ci vediamo dopo al Boogie? 🍷"
            funzione="netlify/functions/send-reminders.mjs"
            destinatario="cliente"
            note="Reminder inviato il giorno della prenotazione. Tono informale, solo primo nome."
          />
          <EmailPreview html={emailReminder} />

          <Meta
            oggetto="Prenotazione annullata — Boogie Bistrot"
            funzione="netlify/functions/cancella-prenotazione.js"
            destinatario="cliente"
            note="Inviata quando la prenotazione viene cancellata (dal ristorante o dal cliente via link)."
          />
          <EmailPreview html={emailAnnullata} />

        </Section>

        {/* ── CONTATTI ─────────────────────────────────────────────── */}
        <Section title="Contatti">

          <Meta
            oggetto="Abbiamo ricevuto il tuo messaggio — Boogie Bistrot"
            funzione="netlify/functions/contatta.js"
            destinatario="cliente"
          />
          <EmailPreview html={emailContattiCliente} />

          <Meta
            oggetto="📬 Nuovo messaggio da Mario"
            funzione="netlify/functions/contatta.js"
            destinatario="ristorante"
          />
          <EmailPreview html={emailContattiRistorante} />

        </Section>

        {/* ── EVENTI AZIENDALI ─────────────────────────────────────── */}
        <Section title="Eventi Aziendali">

          <Meta
            oggetto="Abbiamo ricevuto la tua richiesta — Boogie Bistrot"
            funzione="netlify/functions/contatta-evento-aziendale.js"
            destinatario="cliente"
          />
          <EmailPreview html={emailEventoAziendaleCliente} />

          <Meta
            oggetto="🏢 Evento aziendale — Laura Bianchi (20 ospiti)"
            funzione="netlify/functions/contatta-evento-aziendale.js"
            destinatario="ristorante"
          />
          <EmailPreview html={emailEventoAziendaleRistorante} />

        </Section>

        {/* ── FIDELITY ─────────────────────────────────────────────── */}
        <Section title="Fidelity">

          <Meta
            oggetto="🎉 Benvenuto nel programma Fidelity — Boogie Bistrot"
            funzione="netlify/functions/fidelity-iscrizione.js"
            destinatario="cliente"
            note="Inviata all'iscrizione al programma fidelity (form in /fidelity o dalla dashboard)."
          />
          <EmailPreview html={emailFidelity} />

          <Meta
            oggetto="🎂 Il tuo compleanno sta arrivando, Mario: c'è un drink per te"
            funzione="netlify/functions/compleanno-premio.js"
            destinatario="cliente"
            note="Inviata via cron giornaliero 08:00 a chi compie gli anni nei prossimi 7 giorni. Validità: lunedì–domenica della settimana del compleanno."
          />
          <EmailPreview html={emailCompleanno} />

        </Section>

        {/* ── FEEDBACK & RECENSIONI ─────────────────────────────────── */}
        <Section title="Feedback & Recensioni">

          <Meta
            oggetto="Come è andata sabato 17 maggio? 😊"
            funzione="netlify/functions/feedback.js"
            destinatario="cliente"
            note="Inviata via cron ogni giorno alle 11:00 ai clienti con prenotazione confermata del giorno precedente. Un'email per cliente (dedup per email). Il pulsante positivo porta a Google Reviews, quello negativo a /feedback per raccogliere il feedback internamente."
          />
          <EmailPreview html={emailFeedback} />

        </Section>

      </div>
    </main>
  )
}
