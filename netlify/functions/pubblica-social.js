// netlify/functions/pubblica-social.js
// Automazione social: genera caption con Gemini, pubblica su Meta (Instagram/Facebook) e Google Business Profile
//
// Env vars richieste:
//   GEMINI_API_KEY          — Google AI Studio (piano gratuito)
//   META_PAGE_ID            — ID della Facebook Page
//   META_ACCESS_TOKEN       — Page Access Token (long-lived)
//   META_IG_USER_ID         — ID dell'account Instagram Business collegato alla Page
//   GOOGLE_CLIENT_ID        — OAuth2 client ID (Google Cloud Console)
//   GOOGLE_CLIENT_SECRET    — OAuth2 client secret
//   GOOGLE_REFRESH_TOKEN    — Refresh token con scope mybusiness
//   GOOGLE_LOCATION_NAME    — es. "accounts/123456789/locations/987654321"
//
// Endpoint: POST /.netlify/functions/pubblica-social?action=genera-caption
//           POST /.netlify/functions/pubblica-social?action=pubblica

const GEMINI_API_KEY       = process.env.GEMINI_API_KEY
const META_PAGE_ID         = process.env.META_PAGE_ID
const META_ACCESS_TOKEN    = process.env.META_ACCESS_TOKEN
const META_IG_USER_ID      = process.env.META_IG_USER_ID
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN
const GOOGLE_LOCATION_NAME = process.env.GOOGLE_LOCATION_NAME
const AIRTABLE_TOKEN       = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID     = process.env.AIRTABLE_BASE_ID

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Gemini: genera caption ────────────────────────────────────────────────────

async function generaCaption({ titolo, descrizione, data, ora, tipo }) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY non configurata nelle env vars di Netlify')

  const isArticolo   = tipo === 'articolo' || tipo === 'blog'
  const isPostLibero = tipo === 'post_libero'

  const prompt = isPostLibero
    ? `Sei il social media manager di Boogie Bistrot, un ristorante-bistrot in provincia di Lecco (Italia) che propone cucina del territorio rivisitata, pizza tradizionale cotta nel forno a legna, birre locali e serate di musica dal vivo. Il tono è caldo, autentico, coinvolgente, mai commerciale.

Scrivi una caption completa per Instagram e Facebook ispirata a questo spunto: "${titolo}".

La caption deve essere un testo nuovo e originale (non ricopiare lo spunto), e deve:
- Essere in italiano
- Avere 80-150 parole
- Aprirsi con una frase coinvolgente che cattura l'attenzione
- Essere autentica e calda, rispecchiare il carattere del locale
- Chiudersi con un invito all'azione (es. prenota, vieni a trovarci, ti aspettiamo)
- Includere 4-6 hashtag pertinenti su una riga separata in fondo (es. #BoogieBistrot #Lecco #Giardino #EstateInLombardia)
- Usare 2-3 emoji in modo naturale nel testo
- NON menzionare: pizza napoletana, hamburger, menu fisso pranzo

Scrivi SOLO la caption completa con hashtag, senza intro o spiegazioni.`
    : isArticolo
    ? `Sei il social media manager di Boogie Bistrot, un ristorante-bistrot in provincia di Lecco (Italia) che propone cucina del territorio rivisitata, pizza tradizionale cotta nel forno a legna, birre locali e serate di musica dal vivo. Il tono è caldo, autentico, coinvolgente, mai commerciale.

Scrivi una caption per Instagram e Facebook per questo articolo del blog:
Titolo: ${titolo}
Descrizione: ${descrizione || '(non disponibile)'}

La caption deve:
- Essere in italiano
- Avere massimo 150 parole
- Iniziare con una frase d'impatto o una domanda che cattura l'attenzione
- Includere 3-5 hashtag pertinenti in fondo (es. #BoogieBistrot #Lecco #CucinaDelTerritorio #PizzaFornoALegna)
- Usare al massimo 2-3 emoji, in modo naturale
- NON menzionare: pizza napoletana, hamburger, menu fisso pranzo

Scrivi SOLO la caption, senza intro o spiegazioni.`
    : `Sei il social media manager di Boogie Bistrot, un ristorante-bistrot in provincia di Lecco (Italia) che propone cucina del territorio rivisitata, pizza tradizionale cotta nel forno a legna, birre locali e serate di musica dal vivo. Il tono è caldo, autentico, coinvolgente, mai commerciale.

Scrivi una caption per Instagram e Facebook per questo evento:
Titolo: ${titolo}
${data ? `Data: ${new Date(data + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
${ora ? `Ora: ${ora}` : ''}
Descrizione: ${descrizione || '(non disponibile)'}

La caption deve:
- Essere in italiano
- Avere massimo 150 parole
- Creare curiosità e invogliare a partecipare
- Includere data e ora se disponibili
- Includere 3-5 hashtag pertinenti in fondo (es. #BoogieBistrot #Lecco #EventiLecco #SerataDaRicordare)
- Usare al massimo 2-3 emoji, in modo naturale
- NON menzionare: pizza napoletana, hamburger, menu fisso pranzo

Scrivi SOLO la caption, senza intro o spiegazioni.`

  const modelli = ['gemini-2.5-flash', 'gemini-2.0-flash']
  for (const modello of modelli) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 1024 },
        }),
      }
    )
    if (!res.ok) continue
    const geminiData = await res.json()
    const caption = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (caption) return caption
  }
  throw new Error('Gemini non disponibile — nessun modello ha risposto correttamente')
}

// ── Google OAuth2: scambia refresh_token per access_token ────────────────────

async function getGoogleAccessToken() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Variabili Google OAuth non configurate (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)')
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }).toString(),
  })
  if (!res.ok) throw new Error('Google token refresh fallito: ' + await res.text())
  const data = await res.json()
  if (!data.access_token) throw new Error('Google: access_token non ricevuto')
  return data.access_token
}

// ── Meta: Instagram Stories (una per immagine) ────────────────────────────────

async function pubblicaStorieInstagram(imageUrls, caption, linkUrls = []) {
  if (!META_IG_USER_ID || !META_ACCESS_TOKEN) {
    throw new Error('META_IG_USER_ID o META_ACCESS_TOKEN non configurati')
  }

  const ids = []
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i]
    const linkUrl  = linkUrls[i] || ''

    // Step 1: container story (con link_url se disponibile, fallback senza)
    const storyPayload = { image_url: imageUrl, media_type: 'STORIES', access_token: META_ACCESS_TOKEN }
    if (linkUrl) storyPayload.link_url = linkUrl

    let createRes = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(storyPayload) }
    )
    let createData = await createRes.json()

    // Fallback: se link_url è stato rifiutato, riprova senza
    if ((!createRes.ok || createData.error) && linkUrl) {
      console.warn(`IG story: link_url rifiutato (${createData.error?.message}), riprovo senza link`)
      const payloadSenzaLink = { image_url: imageUrl, media_type: 'STORIES', access_token: META_ACCESS_TOKEN }
      createRes  = await fetch(
        `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadSenzaLink) }
      )
      createData = await createRes.json()
    }

    if (!createRes.ok || createData.error) {
      throw new Error(createData.error?.message || `IG story container failed per: ${imageUrl}`)
    }

    // Step 2: attendi che il container sia pronto (polling status)
    const containerId = createData.id
    let statusOk = false
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes  = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${META_ACCESS_TOKEN}`
      )
      const statusData = await statusRes.json()
      if (statusData.status_code === 'FINISHED') { statusOk = true; break }
      if (statusData.status_code === 'ERROR') throw new Error(`IG story container in errore per: ${imageUrl}`)
    }
    if (!statusOk) throw new Error(`IG story container non pronto dopo 16s per: ${imageUrl}`)

    // Step 3: pubblica ogni story
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ creation_id: createData.id, access_token: META_ACCESS_TOKEN }),
      }
    )
    const publishData = await publishRes.json()
    if (!publishRes.ok || publishData.error) {
      throw new Error(publishData.error?.message || `IG story publish failed (${publishRes.status})`)
    }
    ids.push(publishData.id)
  }
  return { stories: ids.length, ids }
}

// ── Meta: Instagram Carosello ────────────────────────────────────────────────

async function pubblicaCaroselloInstagram(imageUrls, caption) {
  if (!META_IG_USER_ID || !META_ACCESS_TOKEN) {
    throw new Error('META_IG_USER_ID o META_ACCESS_TOKEN non configurati')
  }
  if (!imageUrls || imageUrls.length < 2) {
    throw new Error('Il carosello richiede almeno 2 immagini')
  }

  // Step 1: container per ogni immagine child
  const childIds = []
  for (const imageUrl of imageUrls) {
    const res  = await fetch(
      `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          image_url:        imageUrl,
          is_carousel_item: true,
          access_token:     META_ACCESS_TOKEN,
        }),
      }
    )
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `IG child container fallito per: ${imageUrl}`)
    }
    childIds.push(data.id)
  }

  // Step 2: container carosello
  const carouselRes  = await fetch(
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
  const carouselData = await carouselRes.json()
  if (!carouselRes.ok || carouselData.error) {
    throw new Error(carouselData.error?.message || `IG carousel container failed (${carouselRes.status})`)
  }

  // Step 3: pubblica
  const publishRes  = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ creation_id: carouselData.id, access_token: META_ACCESS_TOKEN }),
    }
  )
  const publishData = await publishRes.json()
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || `IG carousel publish failed (${publishRes.status})`)
  }
  return { id: publishData.id, slides: childIds.length }
}

// ── Meta: Facebook multi-immagine ────────────────────────────────────────────

async function pubblicaFacebookMultiImmagine(imageUrls, caption) {
  if (!META_PAGE_ID || !META_ACCESS_TOKEN) {
    throw new Error('META_PAGE_ID o META_ACCESS_TOKEN non configurati')
  }

  // Carica ogni foto non pubblicata
  const photoIds = []
  for (const imageUrl of imageUrls) {
    const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/photos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: imageUrl, published: false, access_token: META_ACCESS_TOKEN }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || `FB photo upload failed: ${imageUrl}`)
    photoIds.push(data.id)
  }

  // Crea feed con foto allegate
  const res  = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message:        caption,
      attached_media: photoIds.map(id => ({ media_fbid: id })),
      access_token:   META_ACCESS_TOKEN,
    }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.message || `FB multi-photo feed failed (${res.status})`)
  return { id: data.id, foto: photoIds.length }
}

// ── Meta: Instagram ───────────────────────────────────────────────────────────

async function pubblicaSuInstagram(imageUrl, caption) {
  if (!META_IG_USER_ID || !META_ACCESS_TOKEN) {
    throw new Error('META_IG_USER_ID o META_ACCESS_TOKEN non configurati')
  }

  // Step 1: crea container media
  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: META_ACCESS_TOKEN }),
    }
  )
  const createData = await createRes.json()
  if (!createRes.ok || createData.error) {
    throw new Error(createData.error?.message || `Instagram media creation failed (${createRes.status})`)
  }

  // Step 2: pubblica il container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${META_IG_USER_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: META_ACCESS_TOKEN }),
    }
  )
  const publishData = await publishRes.json()
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || `Instagram publish failed (${publishRes.status})`)
  }
  return { id: publishData.id }
}

// ── Meta: Facebook Page ───────────────────────────────────────────────────────

async function pubblicaSuFacebook(imageUrl, caption, link) {
  if (!META_PAGE_ID || !META_ACCESS_TOKEN) {
    throw new Error('META_PAGE_ID o META_ACCESS_TOKEN non configurati')
  }

  if (imageUrl) {
    // Post con immagine
    const res = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, message: caption, access_token: META_ACCESS_TOKEN }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || `Facebook photos failed (${res.status})`)
    return { id: data.id }
  } else {
    // Post testo + link opzionale
    const res = await fetch(`https://graph.facebook.com/v19.0/${META_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: caption,
        ...(link ? { link } : {}),
        access_token: META_ACCESS_TOKEN,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error?.message || `Facebook feed failed (${res.status})`)
    return { id: data.id }
  }
}

// ── Google Business Profile ───────────────────────────────────────────────────

async function pubblicaSuGoogle(caption, link) {
  if (!GOOGLE_LOCATION_NAME) {
    throw new Error('GOOGLE_LOCATION_NAME non configurato')
  }
  const accessToken = await getGoogleAccessToken()

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${GOOGLE_LOCATION_NAME}/localPosts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        languageCode: 'it',
        summary: caption,
        topicType: 'STANDARD',
        ...(link ? { callToAction: { actionType: 'LEARN_MORE', url: link } } : {}),
      }),
    }
  )
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Google Business failed (${res.status})`)
  }
  return { name: data.name }
}

// ── Handler principale ────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method not allowed' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
  }

  const action = event.queryStringParameters?.action

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch { }

  // ── Genera caption con Gemini ─────────────────────────────────────────────
  if (action === 'genera-caption') {
    try {
      const caption = await generaCaption(body)
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, caption }) }
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: e.message }) }
    }
  }

  // ── Pubblica sui social ───────────────────────────────────────────────────
  if (action === 'pubblica') {
    const { caption, imageUrl, piattaforme = [], link } = body
    if (!caption?.trim()) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'caption obbligatoria' }) }
    }
    if (!Array.isArray(piattaforme) || piattaforme.length === 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'seleziona almeno una piattaforma' }) }
    }

    const risultati = {}
    const errori = {}

    if (piattaforme.includes('instagram')) {
      if (!imageUrl) {
        errori.instagram = 'Instagram richiede un URL immagine (FotoHero obbligatoria)'
      } else {
        try { risultati.instagram = await pubblicaSuInstagram(imageUrl, caption) }
        catch (e) { errori.instagram = e.message }
      }
    }

    if (piattaforme.includes('facebook')) {
      try { risultati.facebook = await pubblicaSuFacebook(imageUrl, caption, link) }
      catch (e) { errori.facebook = e.message }
    }

    if (piattaforme.includes('google')) {
      try { risultati.google = await pubblicaSuGoogle(caption, link) }
      catch (e) { errori.google = e.message }
    }

    const tuttoOk = Object.keys(errori).length === 0
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: tuttoOk, risultati, errori }),
    }
  }

  // ── Pubblica carosello ───────────────────────────────────────────────────
  if (action === 'pubblica-carosello') {
    const { caption, imageUrls, piattaforme = [], postId, mediaType, linkUrls = [] } = body
    const isStoria = mediaType === 'STORIES'
    if (!isStoria && !caption?.trim()) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'caption obbligatoria' }) }
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'imageUrls obbligatorio (array)' }) }
    }
    if (!Array.isArray(piattaforme) || piattaforme.length === 0) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'seleziona almeno una piattaforma' }) }
    }

    const risultati = {}
    const errori    = {}

    if (piattaforme.includes('instagram')) {
      try {
        if (isStoria) {
          risultati.instagram = await pubblicaStorieInstagram(imageUrls, caption, linkUrls)
        } else {
          risultati.instagram = imageUrls.length === 1
            ? await pubblicaSuInstagram(imageUrls[0], caption)
            : await pubblicaCaroselloInstagram(imageUrls, caption)
        }
      } catch (e) { errori.instagram = e.message }
    }

    if (piattaforme.includes('facebook')) {
      try {
        risultati.facebook = imageUrls.length === 1
          ? await pubblicaSuFacebook(imageUrls[0], caption)
          : await pubblicaFacebookMultiImmagine(imageUrls, caption)
      } catch (e) { errori.facebook = e.message }
    }

    if (piattaforme.includes('google')) {
      try { risultati.google = await pubblicaSuGoogle(caption) }
      catch (e) { errori.google = e.message }
    }

    // Aggiorna record SocialPosts se postId presente
    if (postId && AIRTABLE_TOKEN && AIRTABLE_BASE_ID) {
      const SOCIAL_TABLE = process.env.AIRTABLE_SOCIAL_POSTS || 'SocialPosts'
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(SOCIAL_TABLE)}/${postId}`
      const tuttoOk = Object.keys(errori).length === 0
      fetch(url, {
        method:  'PATCH',
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fields: {
            'Stato':                  tuttoOk ? 'Pubblicato' : 'Errore',
            'DataPubblicata':         new Date().toISOString(),
            'RisultatiPubblicazione': JSON.stringify({ risultati, errori }),
            'ErroreMsg':              Object.values(errori).join('; '),
          },
        }),
      }).catch(() => {})
    }

    const tuttoOk = Object.keys(errori).length === 0
    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ success: tuttoOk, risultati, errori }),
    }
  }

  return {
    statusCode: 400,
    headers: CORS,
    body: JSON.stringify({ success: false, error: 'action non valida. Usa ?action=genera-caption, ?action=pubblica o ?action=pubblica-carosello' }),
  }
}
