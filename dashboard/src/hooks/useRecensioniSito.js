import { useState, useEffect, useCallback } from 'react'

const AIRTABLE_TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`
const AT_HEADERS = { Authorization: `Bearer ${AIRTABLE_TOKEN}` }

export function useRecensioniSito() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${BASE}/RecensioniSito?sort[0][field]=Ordine&sort[0][direction]=asc`,
        { headers: AT_HEADERS }
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      setItems((json.records || []).map(r => ({
        id:          r.id,
        nome:        r.fields['Nome'] || '',
        piattaforma: r.fields['Piattaforma'] || 'Google',
        stelle:      r.fields['Stelle'] ?? 5,
        testo:       r.fields['Testo'] || '',
        data:        r.fields['Data'] || '',
        attivo:      r.fields['Attivo'] === true,
        ordine:      r.fields['Ordine'] ?? 0,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { items, loading, refetch: fetchAll }
}
