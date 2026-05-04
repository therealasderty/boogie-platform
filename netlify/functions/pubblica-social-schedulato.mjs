// netlify/functions/pubblica-social-schedulato.js
// Scheduled function — si esegue ogni ora
// Controlla i SocialPosts con Stato=Programmato e DataProgrammata <= ora attuale,
// li pubblica e aggiorna il record su Airtable.
//
// Schedulazione: vedi netlify.toml (es. ogni 30 minuti `*/30 * * * *`).
//
// Env vars richieste (stesse di pubblica-social.js):
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_SOCIAL_POSTS
//   META_PAGE_ID, META_ACCESS_TOKEN, META_IG_USER_ID

const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE            = process.env.AIRTABLE_SOCIAL_POSTS || 'SocialPosts'
const BASE_URL         = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`
const AT_HEADERS       = {
  'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
  'Content-Type':  'application/json',
}

const META_PAGE_ID      = process.env.META_PAGE_ID
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_IG_USER_ID   = process.env.META_IG_USER_ID

// ── Helper: attendi che un container IG sia FINISHED ─────────────────────────

async function aspettaContainerIg(containerId, { tentativi = 10, intervallo = 2000 } = {}) {
  for (let i = 0; i < tentativi; i++) {
    await new Promise(r => setTimeout(r, intervallo))
    const res  = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${META_ACCESS_TOKEN}`
    )
    const data = await res.json()
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') throw new Error(`IG container in errore (id: ${containerId})`)
  }
  throw new Error(`IG container non pronto dopo ${tentativi} tentativi (id: ${containerId})`)
}

// ── Pubblicazione Instagram Stories ─────────────────────────────────────────

async function pubblicaIgStorie(imageUrls, caption) {
  const ids = []
  for (const imageUrl of imageUrls) {
    const createRes  = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: META_ACCESS_TOKEN }),
      }
    )
    const createData = await createRes.json()
    if (!createRes.ok || createData.error) throw new Error(createData.error?.message || `IG story container failed per: ${imageUrl}`)

    await aspettaContainerIg(createData.id)

    const publishRes  = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ creation_id: createData.id, access_token: META_ACCESS_TOKEN }),
      }
    )
    const publishData = await publishRes.json()
    if (!publishRes.ok || publishData.error) throw new Error(publishData.error?.message || 'IG story publish failed')
    ids.push(publishData.id)
  }
  return { ids }
}

// ── Pubblicazione Instagram (singola immagine) ───────────────────────────────

async function pubblicaIgSingola(imageUrl, caption) {
  const create = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ image_url: imageUrl, caption, access_token: META_ACCESS_TOKEN }),
    }
  )
  const createData = await create.json()
  if (!create.ok || createData.error) throw new Error(createData.error?.message || 'IG media creation failed')

  await aspettaContainerIg(createData.id)

  const publish = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ creation_id: createData.id, access_token: META_ACCESS_TOKEN }),
    }
  )
  const publishData = await publish.json()
  if (!publish.ok || publishData.error) throw new Error(publishData.error?.message || 'IG publish failed')
  return { id: publishData.id }
}

// ── Pubblicazione Instagram Carousel ────────────────────────────────────────

async function pubblicaIgCarosello(imageUrls, caption) {
  // Step 1: crea container per ogni immagine child
  const childIds = []
  for (const imageUrl of imageUrls) {
    const res  = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          image_url:          imageUrl,
          is_carousel_item:   true,
          access_token:       META_ACCESS_TOKEN,
        }),
      }
    )
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || `IG child container failed per ${imageUrl}`)
    await aspettaContainerIg(data.id)
    childIds.push(data.id)
  }

  // Step 2: crea container carosello
  const carousel = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        media_type:   'CAROUSEL',
        children:     childIds.join(','),
        caption,
        access_token: META_ACCESS_TOKEN,
      }),
    }
  )
  const carouselData = await carousel.json()
  if (!carousel.ok || carouselData.error) throw new Error(carouselData.error?.message || 'IG carousel container failed')
  await aspettaContainerIg(carouselData.id)

  // Step 3: pubblica
  const publish = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ creation_id: carouselData.id, access_token: META_ACCESS_TOKEN }),
    }
  )
  const publishData = await publish.json()
  if (!publish.ok || publishData.error) throw new Error(publishData.error?.message || 'IG carousel publish failed')
  return { id: publishData.id, figli: childIds.length }
}

// ── Pubblicazione Facebook ───────────────────────────────────────────────────

async function pubblicaFacebook(imageUrls, caption) {
  if (!imageUrls || imageUrls.length === 0) {
    // Post solo testo
    const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/feed`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: caption, access_token: META_ACCESS_TOKEN }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || 'FB feed failed')
    return { id: data.id }
  }

  if (imageUrls.length === 1) {
    const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/photos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: imageUrls[0], message: caption, access_token: META_ACCESS_TOKEN }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || 'FB photo failed')
    return { id: data.id }
  }

  // Multi-immagine: carica ogni foto non pubblicata, poi crea feed con attached_media
  const photoIds = []
  for (const imageUrl of imageUrls) {
    const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/photos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: imageUrl, published: false, access_token: META_ACCESS_TOKEN }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || `FB photo upload failed per ${imageUrl}`)
    photoIds.push(data.id)
  }

  const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message:         caption,
      attached_media:  photoIds.map(id => ({ media_fbid: id })),
      access_token:    META_ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.message || 'FB multi-photo feed failed')
  return { id: data.id, foto: photoIds.length }
}

// ── Aggiorna record Airtable ─────────────────────────────────────────────────

async function aggiornaRecord(id, fields) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method:  'PATCH',
    headers: AT_HEADERS,
    body:    JSON.stringify({ fields }),
  })
  if (!res.ok) console.error('Airtable PATCH error:', await res.text())
}

// ── Handler principale (cron) ─────────────────────────────────────────────────

export default async () => {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error('AIRTABLE_TOKEN o AIRTABLE_BASE_ID non configurati')
    return { statusCode: 500, body: 'Config mancante' }
  }

  try {
    const ora = new Date().toISOString()

    // Cerca post programmati con data <= ora attuale
    // IS_BEFORE è necessario per confrontare campi Date in Airtable
    const formula = encodeURIComponent(
      `AND({Stato}='Programmato', NOT({DataProgrammata}=''), IS_BEFORE({DataProgrammata}, '${ora}'))`
    )
    const res  = await fetch(
      `${BASE_URL}?filterByFormula=${formula}&maxRecords=20`,
      { headers: AT_HEADERS }
    )
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()

    const records = json.records || []
    console.log(`Post da pubblicare: ${records.length}`)

    for (const record of records) {
      const f            = record.fields
      const caption        = f['Caption']       || ''
      const tipoContenuto  = f['TipoContenuto'] || 'post'
      const isStoria       = tipoContenuto === 'storia'
      const piattaforme    = (f['Piattaforme'] || '').split(',').map(p => p.trim()).filter(Boolean).filter(p => !(p === 'facebook' && isStoria))
      const slidesRaw      = f['Slides']       || '[]'

      let slides = []
      try { slides = JSON.parse(slidesRaw) } catch {}

      // Raccoglie URL delle slide: preferisce cloudinaryUrl (PNG renderizzata), fallback su data.imageUrl
      const imageUrls = slides
        .map(s => s.cloudinaryUrl || s.data?.imageUrl)
        .filter(Boolean)

      const risultati = {}
      const errori    = {}

      if (piattaforme.includes('instagram') && META_IG_USER_ID && META_ACCESS_TOKEN) {
        try {
          if (imageUrls.length === 0) {
            errori.instagram = 'Nessuna immagine disponibile per Instagram'
          } else if (isStoria) {
            risultati.instagram = await pubblicaIgStorie(imageUrls, caption)
          } else if (imageUrls.length > 1) {
            risultati.instagram = await pubblicaIgCarosello(imageUrls, caption)
          } else {
            risultati.instagram = await pubblicaIgSingola(imageUrls[0], caption)
          }
        } catch (e) {
          errori.instagram = e.message
        }
      }

      if (piattaforme.includes('facebook') && META_PAGE_ID && META_ACCESS_TOKEN) {
        try {
          risultati.facebook = await pubblicaFacebook(imageUrls, caption)
        } catch (e) {
          errori.facebook = e.message
        }
      }

      const tuttoOk    = Object.keys(errori).length === 0
      const nuovoStato = tuttoOk ? 'Pubblicato' : (Object.keys(risultati).length > 0 ? 'Pubblicato' : 'Errore')

      await aggiornaRecord(record.id, {
        'Stato':                   nuovoStato,
        'DataPubblicata':          new Date().toISOString(),
        'RisultatiPubblicazione':  JSON.stringify({ risultati, errori }),
        'ErroreMsg':               Object.values(errori).join('; '),
      })

      console.log(`Post ${record.id}: ${nuovoStato}`, { risultati, errori })
    }

    return
  } catch (err) {
    console.error('Errore cron social:', err)
  }
}

export const config = { schedule: '*/30 * * * *' }
