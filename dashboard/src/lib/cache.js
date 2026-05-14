/**
 * Cache in-memoria con TTL per ridurre le chiamate ridondanti ad Airtable.
 * I dati vengono mantenuti per TTL_MS dopo l'ultimo fetch riuscito.
 * Le operazioni di scrittura (aggiungi/aggiorna/elimina) invalidano la cache.
 */

const TTL_MS = 5 * 60 * 1000 // 5 minuti

const store = {}

export function cacheGet(key) {
  const entry = store[key]
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) {
    delete store[key]
    return null
  }
  return entry.data
}

export function cacheSet(key, data) {
  store[key] = { data, ts: Date.now() }
}

export function cacheInvalidate(key) {
  delete store[key]
}

export function cacheInvalidatePrefix(prefix) {
  for (const k of Object.keys(store)) {
    if (k.startsWith(prefix)) delete store[k]
  }
}
