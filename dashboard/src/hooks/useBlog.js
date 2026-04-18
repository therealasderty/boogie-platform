import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const API = API_BASE + '/gestisci-blog'

export function useBlog() {
  const [articoli, setArticoli] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) setArticoli(json.articoli || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (dati, id = null) => {
    const method = id ? 'PATCH' : 'POST'
    const payload = id ? { ...dati, id } : dati
    const res = await authFetch(API, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    const res = await authFetch(API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return res.json()
  }, [])

  const togglePubblicato = useCallback(async (id, pubblicato) => {
    const res = await authFetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pubblicato }),
    })
    return res.json()
  }, [])

  const aggiornaOrdine = useCallback(async (articoliOrdinati) => {
    await Promise.all(
      articoliOrdinati.map((a, i) =>
        authFetch(API, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: a.id, ordine: i + 1 }),
        })
      )
    )
  }, [])

  return { articoli, loading, carica, salva, elimina, togglePubblicato, aggiornaOrdine }
}
