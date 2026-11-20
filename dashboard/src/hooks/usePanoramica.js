import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'

const API = API_BASE + '/panoramica-sito'
const CACHE_KEY = 'panoramica-sito'

export function usePanoramica() {
  const [dati, setDati] = useState(null)
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setDati(cached); setLoading(false); return }

    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) {
        setDati(json)
        cacheSet(CACHE_KEY, json)
      }
    } catch (e) {
      console.error('usePanoramica:', e)
    }
    setLoading(false)
  }, [])

  const ricarica = useCallback(() => {
    cacheInvalidate(CACHE_KEY)
    return carica()
  }, [carica])

  useEffect(() => { carica() }, [carica])

  return { dati, loading, ricarica }
}
