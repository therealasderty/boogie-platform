import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'

const API = API_BASE + '/gestisci-menu'
const GESTISCI = API_BASE + '/gestisci-menu'
const CACHE_KEY = 'menu'

export function useMenu() {
  const [piatti, setPiatti] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setPiatti(cached); setLoading(false); return }
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) {
        setPiatti(json.piatti || [])
        cacheSet(CACHE_KEY, json.piatti || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (dati) => {
    cacheInvalidate(CACHE_KEY)
    const method = dati.id ? 'PATCH' : 'POST'
    const res = await authFetch(GESTISCI, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(`${GESTISCI}?id=${id}`, { method: 'DELETE' })
    return res.json()
  }, [])

  const aggiornaOrdine = useCallback(async (piattiOrdinati) => {
    cacheInvalidate(CACHE_KEY)
    await Promise.all(
      piattiOrdinati.map((p, i) =>
        authFetch(GESTISCI, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, ordine: i + 1 }),
        })
      )
    )
  }, [])

  return { piatti, loading, carica, salva, elimina, aggiornaOrdine }
}
