import { useState, useEffect } from 'react'
import { fetchUmamiStats } from '../lib/umami'

export function useUmamiStats(startAt, endAt) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!startAt || !endAt) return
    let cancelled = false
    setLoading(true)
    fetchUmamiStats(startAt, endAt)
      .then(d  => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [startAt, endAt])

  return { data, loading }
}
