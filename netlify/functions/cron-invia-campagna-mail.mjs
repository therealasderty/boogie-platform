// netlify/functions/cron-invia-campagna-mail.mjs
// Solo cron giornaliero — NON chiamare via HTTP dal dashboard.
// L’invio manuale / all’avvio usa `invia-campagna-mail` (funzione HTTP normale).

import { runInvioCampagna } from './invia-campagna-mail.mjs'

export const handler = async () => {
  console.log('[cron-invia-campagna-mail] tick')
  try {
    const result = await runInvioCampagna({ limit: 250 })
    console.log('[cron-invia-campagna-mail] done', result)
    return { statusCode: 200, body: JSON.stringify({ success: true, ...result }) }
  } catch (e) {
    console.error('[cron-invia-campagna-mail] errore:', e)
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e.message }) }
  }
}
