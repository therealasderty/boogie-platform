import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const BASE = API_BASE

export function useBloccoPrenotazioni() {
  const [blocchi, setBlocchi] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(() => {
    setLoading(true)
    authFetch(BASE + '/gestisci-blocco-prenotazioni')
      .then(r => r.json())
      .then(json => { if (json.success) setBlocchi(json.blocchi || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (payload, id = null) => {
    const res = await authFetch(BASE + '/gestisci-blocco-prenotazioni', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    const res = await authFetch(`${BASE}/gestisci-blocco-prenotazioni?id=${id}`, { method: 'DELETE' })
    return res.json()
  }, [])

  return { blocchi, loading, ricarica: carica, salva, elimina }
}
