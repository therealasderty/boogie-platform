// netlify/functions/cron-invia-campagna-mail.js
// Legacy entry (sync, timeout 26s). Lo schedule è stato spostato su
// `cron-invia-campagna-mail-background` (15 min). Questo handler resta
// chiamabile manualmente / per compat e delega allo stesso invio.

exports.handler = async () => {
  console.log('[cron-invia-campagna-mail] tick (legacy sync — preferire -background)')
  try {
    const { runInvioCampagna } = await import('./invia-campagna-mail.mjs')
    // Chunk ridotto: con 26s non si completano 250 invii
    const result = await runInvioCampagna({ limit: 40 })
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
