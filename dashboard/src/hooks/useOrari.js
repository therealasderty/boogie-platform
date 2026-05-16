import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'
const BASE = API_BASE
const CACHE_KEY = 'orari'

export function useOrari() {
  const [orari, setOrari] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setOrari(cached); setLoading(false); return }
    setLoading(true)
    try {
      const res = await authFetch(BASE + '/gestisci-orari')
      const json = await res.json()
      if (json.success) {
        setOrari(json.orari || [])
        cacheSet(CACHE_KEY, json.orari || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (payload, id = null) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(BASE + '/gestisci-orari', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(`${BASE}/gestisci-orari?id=${id}`, { method: 'DELETE' })
    return res.json()
  }, [])

  return { orari, loading, ricarica: carica, salva, elimina }
}
