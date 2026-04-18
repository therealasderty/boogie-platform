import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const BASE_URL = API_BASE + '/get-statistiche'

export function useAnalytics() {
  const [settimane, setSettimane] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(() => {
    setLoading(true)
    authFetch(`${BASE_URL}?limit=12`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setSettimane(json.settimane || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { carica() }, [carica])

  return { settimane, loading, ricarica: carica }
}
