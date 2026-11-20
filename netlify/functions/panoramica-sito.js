// netlify/functions/panoramica-sito.js
// Aggregazione dati per la pagina "Panoramica Sito" della dashboard.
// GET → restituisce conteggi e liste sintetiche di: appuntamenti, menu, blog, FAQ,
//        campagne email, social post programmati.

const AT_TOKEN = process.env.AIRTABLE_TOKEN
const AT_BASE  = process.env.AIRTABLE_BASE_ID

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function atUrl(table, params = '') {
  return `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}${params ? '?' + params : ''}`
}

const AT_HEADERS = { Authorization: `Bearer ${AT_TOKEN}` }

async function atFetch(table, params = '') {
  const res = await fetch(atUrl(table, params), { headers: AT_HEADERS })
  if (!res.ok) return []
  const json = await res.json()
  return json.records || []
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) }
  }

  try {
    const oggi = new Date().toISOString().slice(0, 10)

    // Fetch in parallelo da tutte le tabelle necessarie
    const [appuntamenti, menu, blog, faq, campagne, socialPosts] = await Promise.all([
      // Appuntamenti futuri o senza data, attivi
      atFetch('Agenda', `filterByFormula=AND(OR({Data}>='${oggi}',{Data}=''),{Stato}='Pubblicato')&sort[0][field]=Data&sort[0][direction]=asc&fields[]=Titolo&fields[]=Data&fields[]=Ora&fields[]=Stato&fields[]=Ricorrenza&fields[]=InPrimoPiano&maxRecords=50`),
      // Menu attivi — conteggio per categoria
      atFetch('Menu', `filterByFormula={Attivo}=TRUE()&fields[]=Categoria&fields[]=Sottocategoria&fields[]=Nome`),
      // Blog — tutti (per contare pubblicati e bozze)
      atFetch('Blog', `fields[]=Titolo&fields[]=Pubblicato&fields[]=DataPubblicazione&sort[0][field]=DataPubblicazione&sort[0][direction]=desc&maxRecords=50`),
      // FAQ attive
      atFetch('FAQ', `filterByFormula={Attivo}=TRUE()&fields[]=Domanda`),
      // Campagne email
      atFetch('CampagneMail', `fields[]=Titolo&fields[]=Stato&fields[]=DataCreazione&fields[]=TotaleInviati&sort[0][field]=DataCreazione&sort[0][direction]=desc&maxRecords=20`),
      // Social post programmati o recenti
      atFetch('SocialPosts', `filterByFormula=OR({Stato}='Programmato',{Stato}='Pubblicato')&fields[]=Titolo&fields[]=Stato&fields[]=DataProgrammata&fields[]=Piattaforme&sort[0][field]=DataProgrammata&sort[0][direction]=desc&maxRecords=20`),
    ])

    // ── Appuntamenti ──
    const listaAppuntamenti = appuntamenti.map(r => ({
      id: r.id,
      titolo: r.fields.Titolo || '',
      data: r.fields.Data || null,
      ora: r.fields.Ora || null,
      ricorrenza: r.fields.Ricorrenza || null,
      inPrimoPiano: !!r.fields.InPrimoPiano,
    }))

    // ── Menu — conteggio per categoria ──
    const menuPerCategoria = {}
    for (const r of menu) {
      const cat = r.fields.Categoria || 'Altro'
      menuPerCategoria[cat] = (menuPerCategoria[cat] || 0) + 1
    }

    // ── Blog ──
    const blogPubblicati = blog.filter(r => r.fields.Pubblicato)
    const blogBozze = blog.filter(r => !r.fields.Pubblicato)
    const listaBlog = blog.slice(0, 10).map(r => ({
      id: r.id,
      titolo: r.fields.Titolo || '',
      pubblicato: !!r.fields.Pubblicato,
      data: r.fields.DataPubblicazione || null,
    }))

    // ── Campagne ──
    const listaCampagne = campagne.map(r => ({
      id: r.id,
      titolo: r.fields.Titolo || '',
      stato: r.fields.Stato || 'Bozza',
      dataCreazione: r.fields.DataCreazione || null,
      totaleInviati: r.fields.TotaleInviati || 0,
    }))

    // ── Social ──
    const socialProgrammati = socialPosts.filter(r => r.fields.Stato === 'Programmato')
    const listaSocial = socialPosts.slice(0, 10).map(r => ({
      id: r.id,
      titolo: r.fields.Titolo || '',
      stato: r.fields.Stato || '',
      dataProgrammata: r.fields.DataProgrammata || null,
      piattaforme: r.fields.Piattaforme || '',
    }))

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        appuntamenti: { totale: listaAppuntamenti.length, lista: listaAppuntamenti },
        menu: { totale: menu.length, perCategoria: menuPerCategoria },
        blog: { pubblicati: blogPubblicati.length, bozze: blogBozze.length, lista: listaBlog },
        faq: { totale: faq.length },
        campagne: { totale: campagne.length, lista: listaCampagne },
        social: { programmati: socialProgrammati.length, lista: listaSocial },
      }),
    }
  } catch (err) {
    console.error('panoramica-sito error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: err.message }) }
  }
}
