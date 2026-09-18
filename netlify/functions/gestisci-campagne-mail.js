// netlify/functions/gestisci-campagne-mail.js
// CRUD campagne email marketing + import contatti con scheduling automatico.
//
// ── Airtable: tabella "CampagneMail" ───────────────────────────────────────────
//   Titolo          (Single line text)
//   Stato           (Single select): Bozza | Programmata | InCorso | Completata | Pausa
//   OggettoMail     (Single line text)
//   Template        (Long text — JSON array di blocchi)
//   DataCreazione   (Single line text — ISO)
//   TotaleInviati   (Number)
//
// ── Airtable: tabella "CampagneMailContatti" ──────────────────────────────────
//   CampagnaId      (Single line text — record ID campagna)
//   Email           (Email)
//   Nome            (Single line text)
//   Stato           (Single select): DaInviare | Inviato | Errore
//   DataProgrammata (Date — YYYY-MM-DD, no time)
//   DataInvio       (Single line text — ISO)
//   ErroreMsg       (Long text)
//
// ── Endpoint ──────────────────────────────────────────────────────────────────
// GET  ?tipo=campagne
// GET  ?tipo=contatti&campagnaId=recXXX[&cursor=xxx]
// GET  ?tipo=statistiche&campagnaId=recXXX
// POST {tipo:'campagna', titolo, oggettoMail, template}
// PATCH{tipo:'campagna', id, titolo?, oggettoMail?, template?, stato?}
// POST {tipo:'importa-contatti', campagnaId, contatti:[{email,nome}], maxPerGiorno:200}
// DELETE ?tipo=campagna&id=recXXX
// DELETE ?tipo=contatto&id=recXXX

const AT_TOKEN   = process.env.AIRTABLE_TOKEN
const AT_BASE    = process.env.AIRTABLE_BASE_ID
const T_CAMP     = 'CampagneMail'
const T_CONT     = 'CampagneMailContatti'
const AT_HEADERS = { Authorization: `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function atUrl(table) {
  return `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`
}

function ok(body)  { return { statusCode: 200, headers: CORS, body: JSON.stringify(body) } }
function err(msg, code = 500) { return { statusCode: code, headers: CORS, body: JSON.stringify({ success: false, error: msg }) } }

function mapCampagna(r) {
  return {
    id:            r.id,
    titolo:        r.fields['Titolo']        || '',
    stato:         r.fields['Stato']         || 'Bozza',
    oggettoMail:   r.fields['OggettoMail']   || '',
    template:      r.fields['Template']      || '[]',
    dataCreazione: r.fields['DataCreazione'] || '',
    totaleInviati: r.fields['TotaleInviati'] || 0,
  }
}

function mapContatto(r) {
  return {
    id:              r.id,
    campagnaId:      r.fields['CampagnaId']      || '',
    email:           r.fields['Email']            || '',
    nome:            r.fields['Nome']             || '',
    azienda:         r.fields['Azienda']          || '',
    stato:           r.fields['Stato']            || 'DaInviare',
    dataProgrammata: r.fields['DataProgrammata']  || '',
    dataInvio:       r.fields['DataInvio']        || '',
    erroreMsg:       r.fields['ErroreMsg']        || '',
  }
}

// Esegui N richieste Airtable in parallelo rispettando il rate limit (5 req/s)
async function batchParallel(items, chunkSize, fn) {
  const results = []
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const res = await Promise.all(chunk.map(fn))
    results.push(...res)
    if (i + chunkSize < items.length) {
      await new Promise(r => setTimeout(r, 250)) // 250ms pause between chunks
    }
  }
  return results
}

// Crea record Airtable in batch da 10 (limite API)
async function createBatch(table, records) {
  const batches = []
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10))
  }
  return batchParallel(batches, 5, async (batch) => {
    const res = await fetch(atUrl(table), {
      method:  'POST',
      headers: AT_HEADERS,
      body:    JSON.stringify({ records: batch }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  })
}

// Elimina record Airtable in batch da 10
async function deleteBatch(table, ids) {
  const batches = []
  for (let i = 0; i < ids.length; i += 10) {
    batches.push(ids.slice(i, i + 10))
  }
  return batchParallel(batches, 5, async (batch) => {
    const params = batch.map(id => `records[]=${id}`).join('&')
    const res = await fetch(`${atUrl(table)}?${params}`, {
      method: 'DELETE', headers: AT_HEADERS,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  })
}

// Carica tutti i record di una formula (paginazione automatica)
async function fetchAll(table, formula, fields = [], sort = []) {
  let records = []
  let offset  = null
  do {
    const params = new URLSearchParams({ maxRecords: '200' })
    if (formula) params.set('filterByFormula', formula)
    if (offset)  params.set('offset', offset)
    fields.forEach((f, i)  => params.set(`fields[${i}]`, f))
    sort.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field)
      params.set(`sort[${i}][direction]`, s.direction || 'asc')
    })
    const res  = await fetch(`${atUrl(table)}?${params}`, { headers: AT_HEADERS })
    if (!res.ok) throw new Error(await res.text())
    const json = await res.json()
    records = records.concat(json.records || [])
    offset  = json.offset || null
  } while (offset)
  return records
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  const { verifyToken } = require('./verifyToken')
  if (!verifyToken(event)) return err('Non autorizzato', 401)

  const method = event.httpMethod
  const qs     = event.queryStringParameters || {}

  // ── GET ───────────────────────────────────────────────────────────────────────
  if (method === 'GET') {
    try {
      const tipo = qs.tipo || 'campagne'

      if (tipo === 'campagne') {
        const records = await fetchAll(T_CAMP, '', [], [{ field: 'DataCreazione', direction: 'desc' }])
        return ok({ success: true, campagne: records.map(mapCampagna) })
      }

      if (tipo === 'contatti') {
        const { campagnaId, cursor } = qs
        if (!campagnaId) return err('campagnaId mancante', 400)

        const params = new URLSearchParams({
          filterByFormula: `{CampagnaId}='${campagnaId}'`,
          'sort[0][field]':     'DataProgrammata',
          'sort[0][direction]': 'asc',
          maxRecords: '100',
        })
        if (cursor) params.set('offset', cursor)

        const res  = await fetch(`${atUrl(T_CONT)}?${params}`, { headers: AT_HEADERS })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        return ok({
          success:   true,
          contatti:  (json.records || []).map(mapContatto),
          nextCursor: json.offset || null,
        })
      }

      if (tipo === 'statistiche') {
        const { campagnaId } = qs
        if (!campagnaId) return err('campagnaId mancante', 400)
        const records = await fetchAll(
          T_CONT,
          `{CampagnaId}='${campagnaId}'`,
          ['Stato', 'DataProgrammata'],
        )
        const stats = { totale: 0, DaInviare: 0, Inviato: 0, Errore: 0 }
        const oggi  = new Date().toISOString().split('T')[0]
        const tutteDate = []
        for (const r of records) {
          stats.totale++
          const s = r.fields['Stato'] || 'DaInviare'
          if (stats[s] !== undefined) stats[s]++
          const d = r.fields['DataProgrammata']
          if (d) tutteDate.push(d)
        }
        tutteDate.sort()
        stats.dataInizio = tutteDate[0] || null
        stats.dataFine   = tutteDate[tutteDate.length - 1] || null
        // Quanti sono in coda per oggi
        stats.oggiDaInviare = records.filter(r =>
          r.fields['Stato'] === 'DaInviare' &&
          (r.fields['DataProgrammata'] || '') <= oggi
        ).length
        // Giorni unici futuri ancora con DaInviare
        stats.giorniRimanenti = new Set(
          records
            .filter(r => r.fields['Stato'] === 'DaInviare' && (r.fields['DataProgrammata'] || '') > oggi)
            .map(r => r.fields['DataProgrammata'])
        ).size
        return ok({ success: true, stats })
      }

      return err('tipo non valido', 400)
    } catch (e) {
      return err(e.message)
    }
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (method === 'POST') {
    try {
      // Crea campagna
      if (body.tipo === 'campagna') {
        const fields = {
          'Titolo':        body.titolo        || 'Nuova campagna',
          'Stato':         'Bozza',
          'OggettoMail':   body.oggettoMail   || '',
          'Template':      JSON.stringify(body.template || []),
          'DataCreazione': new Date().toISOString(),
          'TotaleInviati': 0,
        }
        const res  = await fetch(atUrl(T_CAMP), {
          method: 'POST', headers: AT_HEADERS,
          body:   JSON.stringify({ fields }),
        })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        return ok({ success: true, campagna: mapCampagna(json) })
      }

      // Importa contatti con scheduling automatico
      if (body.tipo === 'importa-contatti') {
        const { campagnaId, contatti = [], maxPerGiorno = 200 } = body
        if (!campagnaId) return err('campagnaId mancante', 400)
        if (!contatti.length) return err('nessun contatto', 400)

        // Calcola DataProgrammata per ogni contatto (200 al giorno partendo da oggi)
        const oggi = new Date()
        const records = contatti.map(({ email, nome, azienda }, i) => {
          const giornoOffset = Math.floor(i / maxPerGiorno)
          const data = new Date(oggi)
          data.setDate(data.getDate() + giornoOffset)
          return {
            fields: {
              'CampagnaId':      campagnaId,
              'Email':           email.trim().toLowerCase(),
              'Nome':            (nome    || '').trim(),
              'Azienda':         (azienda || '').trim(),
              'Stato':           'DaInviare',
              'DataProgrammata': data.toISOString().split('T')[0],
            },
          }
        })

        await createBatch(T_CONT, records)
        return ok({ success: true, importati: records.length })
      }

      // Copia contatti globali in una campagna con scheduling
      if (body.tipo === 'copia-globali-in-campagna') {
        const { campagnaId, maxPerGiorno = 200 } = body
        if (!campagnaId) return err('campagnaId mancante', 400)
        const globali = await fetchAll(T_CONT, `{CampagnaId}='global'`, ['Email', 'Nome', 'Azienda'])
        if (!globali.length) return ok({ success: true, copiati: 0 })
        const oggi = new Date()
        const max  = Math.min(Math.max(1, maxPerGiorno), 200)
        const records = globali.map(({ fields }, i) => {
          const giornoOffset = Math.floor(i / max)
          const data = new Date(oggi)
          data.setDate(data.getDate() + giornoOffset)
          return {
            fields: {
              'CampagnaId':      campagnaId,
              'Email':           fields['Email']   || '',
              'Nome':            fields['Nome']    || '',
              'Azienda':         fields['Azienda'] || '',
              'Stato':           'DaInviare',
              'DataProgrammata': data.toISOString().split('T')[0],
            },
          }
        })
        await createBatch(T_CONT, records)
        return ok({ success: true, copiati: records.length })
      }

      return err('tipo non valido', 400)
    } catch (e) {
      return err(e.message)
    }
  }

  // ── PATCH ────────────────────────────────────────────────────────────────────
  if (method === 'PATCH') {
    try {
      if (body.tipo === 'campagna') {
        const { id } = body
        if (!id) return err('id mancante', 400)
        const fields = {}
        if (body.titolo      !== undefined) fields['Titolo']      = body.titolo
        if (body.stato       !== undefined) fields['Stato']       = body.stato
        if (body.oggettoMail !== undefined) fields['OggettoMail'] = body.oggettoMail
        if (body.template    !== undefined) fields['Template']    = typeof body.template === 'string' ? body.template : JSON.stringify(body.template)

        const res = await fetch(`${atUrl(T_CAMP)}/${id}`, {
          method: 'PATCH', headers: AT_HEADERS,
          body:   JSON.stringify({ fields }),
        })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        return ok({ success: true, campagna: mapCampagna(json) })
      }
      return err('tipo non valido', 400)
    } catch (e) {
      return err(e.message)
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  if (method === 'DELETE') {
    try {
      const { tipo, id } = qs

      if (tipo === 'campagna') {
        if (!id) return err('id mancante', 400)
        // Elimina prima tutti i contatti della campagna
        const contatti = await fetchAll(T_CONT, `{CampagnaId}='${id}'`, ['CampagnaId'])
        if (contatti.length) {
          await deleteBatch(T_CONT, contatti.map(r => r.id))
        }
        // Poi elimina la campagna
        const res = await fetch(`${atUrl(T_CAMP)}/${id}`, { method: 'DELETE', headers: AT_HEADERS })
        if (!res.ok) throw new Error(await res.text())
        return ok({ success: true })
      }

      if (tipo === 'contatto') {
        if (!id) return err('id mancante', 400)
        const res = await fetch(`${atUrl(T_CONT)}/${id}`, { method: 'DELETE', headers: AT_HEADERS })
        if (!res.ok) throw new Error(await res.text())
        return ok({ success: true })
      }

      return err('tipo non valido', 400)
    } catch (e) {
      return err(e.message)
    }
  }

  return err('Metodo non supportato', 405)
}
