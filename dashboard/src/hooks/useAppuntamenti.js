import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'

const API = '/.netlify/functions/gestisci-appuntamenti'
const CACHE_KEY = 'appuntamenti'

export function useAppuntamenti() {
  const [appuntamenti, setAppuntamenti] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setAppuntamenti(cached); setLoading(false); return }
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) {
        setAppuntamenti(json.appuntamenti || [])
        cacheSet(CACHE_KEY, json.appuntamenti || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  async function aggiungi(dati) {
    const res = await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    })
    const json = await res.json()
    if (json.success) { cacheInvalidate(CACHE_KEY); await carica() }
    return json
  }

  async function aggiorna(dati) {
    const res = await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    })
    const json = await res.json()
    if (json.success) { cacheInvalidate(CACHE_KEY); await carica() }
    return json
  }

  async function elimina(id) {
    cacheInvalidate(CACHE_KEY)
    await authFetch(API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await carica()
  }

  return { appuntamenti, loading, carica, aggiungi, aggiorna, elimina }
}
