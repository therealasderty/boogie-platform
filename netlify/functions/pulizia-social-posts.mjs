// netlify/functions/pulizia-social-posts.mjs
// Scheduled function — si esegue il 1° del mese alle 04:00
// Elimina i record SocialPosts con Stato='Pubblicato' o 'Errore' pubblicati da più di 90 giorni.
// Configura in netlify.toml:
//   [functions.pulizia-social-posts]
//   schedule = "0 4 1 * *"

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_SOCIAL_POSTS || 'SocialPosts'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }

const GIORNI_RETENTION = 90

export default async () => {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('AIRTABLE_TOKEN o AIRTABLE_BASE_ID non configurati')
    return
  }

  try {
    const sogliaMs = Date.now() - GIORNI_RETENTION * 24 * 60 * 60 * 1000
    const soglia   = new Date(sogliaMs).toISOString()

    // Recupera post Pubblicati o in Errore con DataPubblicata vecchia
    const formula = encodeURIComponent(
      `AND(OR({Stato}='Pubblicato',{Stato}='Errore'), IS_BEFORE({DataPubblicata}, '${soglia}'))`
    )
    const res = await fetch(
      `${BASE_URL}?filterByFormula=${formula}&fields[]=DataPubblicata&fields[]=Stato&maxRecords=100`,
      { headers: AT_HEADERS }
    )
    if (!res.ok) throw new Error(await res.text())

    const json    = await res.json()
    const records = json.records || []

    if (records.length === 0) {
      console.log('Nessun record SocialPosts da eliminare.')
      return
    }

    // Airtable supporta max 10 record per batch delete
    const chunks = []
    for (let i = 0; i < records.length; i += 10) {
      chunks.push(records.slice(i, i + 10))
    }

    let eliminati = 0
    for (const chunk of chunks) {
      const ids    = chunk.map(r => `records[]=${r.id}`).join('&')
      const delRes = await fetch(`${BASE_URL}?${ids}`, {
        method:  'DELETE',
        headers: AT_HEADERS,
      })
      if (!delRes.ok) {
        console.error('Delete error:', await delRes.text())
      } else {
        eliminati += chunk.length
      }
    }

    console.log(`Pulizia SocialPosts: eliminati ${eliminati} record (>${GIORNI_RETENTION}gg).`)
    return

  } catch (err) {
    console.error('Errore pulizia-social-posts:', err)
  }
}

export const config = { schedule: '0 4 1 * *' }
