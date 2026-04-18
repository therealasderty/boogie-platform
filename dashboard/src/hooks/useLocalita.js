import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const API = API_BASE + '/gestisci-localita'

export function useLocalita() {
  const [localita, setLocalita] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) setLocalita(json.localita || [])
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

  const toggleAttiva = useCallback(async (id, attiva) => {
    const res = await authFetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, attiva }),
    })
    return res.json()
  }, [])

  return { localita, loading, carica, salva, elimina, toggleAttiva }
}
