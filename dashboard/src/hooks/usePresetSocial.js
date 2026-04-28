import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const URL = `${API_BASE}/gestisci-preset-social`

export function usePresetSocial() {
  const [preset, setPreset]   = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await authFetch(URL)
      const json = await res.json()
      if (json.success) setPreset(json.preset)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  async function crea(nome, slides) {
    const res  = await authFetch(URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, slides: JSON.stringify(slides) }),
    })
    const json = await res.json()
    if (json.success) await carica()
    return json
  }

  async function aggiorna(id, nome, slides) {
    const body = { id }
    if (nome   !== undefined) body.nome   = nome
    if (slides !== undefined) body.slides = JSON.stringify(slides)
    const res  = await authFetch(URL, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.success) await carica()
    return json
  }

  async function elimina(id) {
    await authFetch(URL, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await carica()
  }

  return { preset, loading, carica, crea, aggiorna, elimina }
}
