import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const API = `${API_BASE}/gestisci-recensioni-sito`

async function readJson(res) {
  const json = await res.json().catch(() => ({ success: false }))
  if (!res.ok || json.success === false) {
    throw new Error(json.error || 'Errore durante l\'operazione')
  }
  return json
}

export function useRecensioniSito() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(API)
      const json = await readJson(res)
      setItems(json.items || [])
    } catch (e) {
      console.error(e)
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
    return readJson(res)
  }, [])

  const elimina = useCallback(async (id) => {
    const res = await authFetch(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    return readJson(res)
  }, [])

  const toggleAttivo = useCallback(async (item) => {
    const res = await authFetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, attivo: !item.attivo }),
    })
    return readJson(res)
  }, [])

  return { items, loading, error, refetch: fetchAll, salva, elimina, toggleAttivo }
}
