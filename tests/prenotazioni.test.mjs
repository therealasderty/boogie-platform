import assert from 'node:assert/strict'
import test from 'node:test'
import { salvaPrenotazione } from '../website/lib/salva-prenotazione.ts'

function storeSimulato() {
  const entries = new Map()
  let version = 0
  return {
    async getWithMetadata(key) { return entries.get(key) ?? null },
    async setJSON(key, data, options) {
      const current = entries.get(key)
      if (options.onlyIfNew ? current : current?.etag !== options.onlyIfMatch) return { modified: false }
      const etag = String(++version)
      entries.set(key, { data, etag })
      return { modified: true, etag }
    },
  }
}

const campi = { Data: '2026-12-31', Ora: '20:00', Persone: 2 }
const url = 'https://example.invalid/Prenotazioni'

test('due richieste simultanee per gli ultimi due coperti salvano un solo record', async t => {
  const store = storeSimulato()
  const records = [{ fields: { Persone: 8 } }]
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    if (options.method === 'POST') {
      records.push({ fields: campi })
      return Response.json({ id: 'rec-test' })
    }
    return Response.json({ records })
  })
  const prenota = () => salvaPrenotazione(campi, url, 'test', store)
  const esiti = await Promise.all([prenota(), prenota()])
  assert.equal(esiti.filter(x => x.id).length, 1)
  assert.equal(records.length, 2)
  assert.deepEqual(await prenota(), { errore: 'slot_pieno' })
})

test('se manca una pagina del conteggio nessuna prenotazione viene scritta', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    assert.notEqual(options.method, 'POST')
    return ++calls === 1 ? Response.json({ records: [], offset: 'next' }) : new Response(null, { status: 503 })
  })
  await assert.rejects(salvaPrenotazione(campi, url, 'test', storeSimulato()), /HTTP 503/)
  assert.equal(calls, 2)
})
