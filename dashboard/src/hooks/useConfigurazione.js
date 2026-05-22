import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const BASE = API_BASE

export function useConfigurazione() {
  const [config, setConfig] = useState({})
  const [ids, setIds] = useState({})
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(BASE + '/gestisci-configurazione')
      const json = await res.json()
      if (json.success) {
        setConfig(json.config || {})
        setIds(json.ids || {})
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (chiave, valore) => {
    const id = ids[chiave] ?? null
    const res = await authFetch(BASE + '/gestisci-configurazione', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiave, valore, id }),
    })
    const json = await res.json()
    if (json.success && json.id && !ids[chiave]) {
      setIds(prev => ({ ...prev, [chiave]: json.id }))
    }
    return json
  }, [ids])

  return { config, loading, ricarica: carica, salva }
}
