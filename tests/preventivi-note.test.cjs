const test = require('node:test')
const assert = require('node:assert/strict')
const quote = require('../netlify/functions/contatta-evento-aziendale').handler
const notes = require('../netlify/functions/note').handler
const rate = require('../netlify/functions/rate-limit')
const auth = require('../netlify/functions/verifyToken')
const event = { httpMethod: 'POST', headers: {}, body: JSON.stringify({
  nome: 'Test', email: 'test@example.invalid', num_ospiti: 12, consenso_privacy: true,
}) }

test('preventivo rifiutato da Airtable: nessuna conferma né email', async t => {
  t.mock.method(rate, 'isRateLimited', async () => false)
  const calls = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }))
  assert.equal((await quote(event)).statusCode, 503)
  assert.equal(calls.mock.callCount(), 1)
})

test('preventivo salvato: riprova solo la notifica fallita', async t => {
  t.mock.method(rate, 'isRateLimited', async () => false)
  let saves = 0
  const emails = new Map()
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('airtable.com')) {
      saves++
      return Response.json({ records: [{ id: 'rec-test' }] })
    }
    if (url.endsWith('/email')) {
      const key = JSON.parse(options.body).headers.idempotencyKey
      const count = (emails.get(key) ?? 0) + 1
      emails.set(key, count)
      if (emails.size === 1 && count === 1) return new Response(null, { status: 503 })
    }
    return Response.json({})
  })
  assert.equal((await quote(event)).statusCode, 200)
  assert.equal(saves, 1)
  assert.deepEqual([...emails.values()].sort(), [1, 2])
})

test('note: lettura, creazione, completamento, eliminazione e rifiuto di Airtable', async t => {
  t.mock.method(auth, 'verifyToken', () => true)
  const methods = []
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    assert.ok(options.headers.Authorization)
    methods.push(options.method || 'GET')
    return methods.length === 5 ? new Response(null, { status: 503 }) : Response.json({ records: [], id: 'test' })
  })
  for (const [httpMethod, body] of [['GET', {}], ['POST', { testo: 'Nota' }], ['POST', { id: 'test', action: 'toggle' }], ['POST', { id: 'test', action: 'delete' }]]) {
    assert.equal((await notes({ httpMethod, body: JSON.stringify(body) })).statusCode, 200)
  }
  assert.equal((await notes({ httpMethod: 'GET' })).statusCode, 500)
  assert.deepEqual(methods, ['GET', 'POST', 'PATCH', 'DELETE', 'GET'])
})
