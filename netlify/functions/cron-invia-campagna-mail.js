// netlify/functions/cron-invia-campagna-mail.js
// Cron giornaliero 10:00 Europe/Rome (08:00 UTC estate).
// CJS puro: le scheduled Netlify con .mjs + import.meta crashavano in produzione.

exports.handler = async () => {
  console.log('[cron-invia-campagna-mail] tick')
  try {
    const { runInvioCampagna } = await import('./invia-campagna-mail.mjs')
    const result = await runInvioCampagna({ limit: 250 })
    console.log('[cron-invia-campagna-mail] done', result)
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result }),
    }
  } catch (e) {
    console.error('[cron-invia-campagna-mail] errore:', e)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message }),
    }
  }
}
