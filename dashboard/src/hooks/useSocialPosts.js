import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'

const API = '/.netlify/functions/gestisci-social-posts'

export function useSocialPosts({ stato } = {}) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const url = stato ? `${API}?stato=${encodeURIComponent(stato)}` : API
      const res  = await authFetch(url)
      const json = await res.json()
      if (json.success) setPosts(json.posts || [])
    } catch {}
    setLoading(false)
  }, [stato])

  useEffect(() => { carica() }, [carica])

  async function crea(dati) {
    const res  = await authFetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dati),
    })
    const json = await res.json()
    if (json.success) await carica()
    return json
  }

  async function aggiorna(dati) {
    const res  = await authFetch(API, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dati),
    })
    const json = await res.json()
    if (json.success) await carica()
    return json
  }

  async function elimina(id) {
    await authFetch(`${API}?id=${id}`, { method: 'DELETE' })
    await carica()
  }

  return { posts, loading, carica, crea, aggiorna, elimina }
}
