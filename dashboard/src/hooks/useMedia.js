import { useState, useEffect, useCallback } from 'react'
import { cacheGet, cacheSet } from '../lib/cache'

const CACHE_KEY = 'media'
const AIRTABLE_TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`
const AT_HEADERS = { Authorization: `Bearer ${AIRTABLE_TOKEN}` }

export function useMedia() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    const cached = cacheGet(CACHE_KEY)
    if (cached) { setItems(cached); setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      let records = []
      let offset = null
      do {
        const url = `${BASE}/Media?fields[]=Nome&fields[]=URL&fields[]=Alt%20text&fields[]=Tag&fields[]=Ordine&fields[]=Solo%20Mobile&sort[0][field]=Ordine&sort[0][direction]=asc${offset ? `&offset=${offset}` : ''}`
        const res = await fetch(url, { headers: AT_HEADERS })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        records = [...records, ...(json.records || [])]
        offset = json.offset
      } while (offset)

      const mapped = records.map(r => ({
        id:   r.id,
        nome: r.fields['Nome'] || '',
        url:  r.fields['URL']  || '',
        alt:  r.fields['Alt text'] || '',
        tag:        r.fields['Tag'] ? r.fields['Tag'].split(',').map(t => t.trim()).filter(Boolean) : [],
        ordine:     r.fields['Ordine'] ?? 0,
        soloMobile: r.fields['Solo Mobile'] === true,
      })).filter(m => m.url)
      setItems(mapped)
      cacheSet(CACHE_KEY, mapped)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { items, loading, error, refetch: fetchAll }
}
