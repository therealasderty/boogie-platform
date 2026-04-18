import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const API = API_BASE + '/prenotazioni-giornaliere'

export function usePrenotazioniGiornaliere() {
  const [giorni, setGiorni] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) setGiorni(json.giorni)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  return { giorni, loading, carica }
}
