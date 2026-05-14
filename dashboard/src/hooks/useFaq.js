import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
import { cacheGet, cacheSet, cacheInvalidate } from '../lib/cache'
const BASE = API_BASE
const GESTISCI = BASE + '/gestisci-faq'
const CACHE_KEY = 'faq'

export function useFaq() {
  const [faq, setFaq] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setFaq(cached); setLoading(false); return }
    setLoading(true)
    try {
      const res = await authFetch(BASE + '/get-faq')
      const json = await res.json()
      if (json.success) {
        setFaq(json.faq || [])
        cacheSet(CACHE_KEY, json.faq || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (payload, id = null) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(GESTISCI, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(`${GESTISCI}?id=${id}`, { method: 'DELETE' })
    return res.json()
  }, [])

  const aggiornaOrdine = useCallback(async (faqOrdinati) => {
    cacheInvalidate(CACHE_KEY)
    await Promise.all(
      faqOrdinati.map((f, i) =>
        authFetch(GESTISCI, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: f.id, ordine: i + 1 }),
        })
      )
    )
  }, [])

  const toggleAttivo = useCallback(async (item) => {
    cacheInvalidate(CACHE_KEY)
    const res = await authFetch(GESTISCI, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, domanda: item.domanda, risposta: item.risposta, ordine: item.ordine, attivo: !item.attivo }),
    })
    return res.json()
  }, [])

  return { faq, loading, ricarica: carica, salva, elimina, aggiornaOrdine, toggleAttivo }
}
