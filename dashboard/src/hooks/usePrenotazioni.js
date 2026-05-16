import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
export function usePrenotazioni() {
  const [attesa, setAttesa] = useState([])
  const [loading, setLoading] = useState(true)
  const carica = useCallback(() => {
    setLoading(true)
    authFetch(API_BASE + '/get-prenotazioni?tipo=attesa')
      .then(r => r.json())
      .then(json => { if (json.success) setAttesa(json.prenotazioni || []); setLoading(false); })
      .catch(() => setLoading(false))
  }, [])
  useEffect(() => { carica() }, [carica])
  return { attesa, loading, ricarica: carica }
}
