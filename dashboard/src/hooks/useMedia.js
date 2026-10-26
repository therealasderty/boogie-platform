import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'

const CACHE_KEY = 'media'
const API = `${API_BASE}/gestisci-media`

async function readJson(res) {
  const json = await res.json().catch(() => ({ success: false }))
  if (!res.ok || json.success === false) {
    throw new Error(json.error || 'Errore durante l\'operazione')
  }
  return json
}

export function useMedia() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchAll = useCallback(async (opts = {}) => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setItems(cached); setLoading(false); return }
    if (!opts.silent) setLoading(true)
    setError(null)
    try {
      const res = await authFetch(API)
      const json = await readJson(res)
      const mapped = json.items || []
      setItems(mapped)
      cacheSet(CACHE_KEY, mapped)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const salva = useCallback(async (payload, id = null) => {
    const res = await authFetch(API, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    })
    const json = await readJson(res)
    cacheInvalidate(CACHE_KEY)
    return json
  }, [])

  const elimina = useCallback(async (id) => {
    const res = await authFetch(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const json = await readJson(res)
    cacheInvalidate(CACHE_KEY)
    return json
  }, [])

  const aggiornaRecords = useCallback(async (records) => {
    const res = await authFetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    })
    const json = await readJson(res)
    cacheInvalidate(CACHE_KEY)
    return json
  }, [])

  return { items, loading, error, refetch: fetchAll, salva, elimina, aggiornaRecords }
}
