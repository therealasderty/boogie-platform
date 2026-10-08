// netlify/functions/cron-invia-campagna-mail-background.js
// Scheduled BACKGROUND function: 10:00 e 10:30 Europe/Rome (08:00/08:30 UTC estate).
// Suffix `-background` → timeout Netlify 15 min (il cron sync da 26s non basta per 250 email).
// CJS puro: evita crash import.meta delle scheduled .mjs.

exports.handler = async () => {
  console.log('[cron-invia-campagna-mail-background] tick')
  try {
    const { runInvioCampagna } = await import('./invia-campagna-mail.mjs')
    const result = await runInvioCampagna({ limit: 250 })
    console.log('[cron-invia-campagna-mail-background] done', result)
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result }),
    }
  } catch (e) {
    console.error('[cron-invia-campagna-mail-background] errore:', e)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message }),
    }
  }
}
