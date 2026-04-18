import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'

const API = API_BASE + '/note'

export function useNote() {
  const [note, setNote] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(API)
      const json = await res.json()
      if (json.success) setNote(json.note)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { carica() }, [carica])

  async function aggiungi(testo, autore, categoria, per) {
    const res = await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testo, autore, categoria, per }),
    })
    const json = await res.json()
    if (json.success) carica()
    return json
  }

  async function toggleCompletata(id, completata) {
    await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, completata }),
    })
    carica()
  }

  async function elimina(id) {
    await authFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    carica()
  }

  return { note, loading, carica, aggiungi, toggleCompletata, elimina }
}
