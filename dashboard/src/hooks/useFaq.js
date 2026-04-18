import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/authFetch'
import { API_BASE } from '../lib/config'
const BASE = API_BASE
const GESTISCI = BASE + '/gestisci-faq'

export function useFaq() {
  const [faq, setFaq] = useState([])
  const [loading, setLoading] = useState(true)

  const carica = useCallback(() => {
    setLoading(true)
    authFetch(BASE + '/get-faq')
      .then(r => r.json())
      .then(json => { if (json.success) setFaq(json.faq || []); setLoading(false); })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { carica() }, [carica])

  const salva = useCallback(async (payload, id = null) => {
    const res = await authFetch(GESTISCI, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id, ...payload } : payload),
    })
    return res.json()
  }, [])

  const elimina = useCallback(async (id) => {
    const res = await authFetch(`${GESTISCI}?id=${id}`, { method: 'DELETE' })
    return res.json()
  }, [])

  const aggiornaOrdine = useCallback(async (faqOrdinati) => {
    await Promise.all(
      faqOrdinati.map((f, i) =>
        authFetch(GESTISCI, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: f.id, ordine: i + 1 }),
        })
      )
    )
  }, [])

  const toggleAttivo = useCallback(async (item) => {
    const res = await authFetch(GESTISCI, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, domanda: item.domanda, risposta: item.risposta, ordine: item.ordine, attivo: !item.attivo }),
    })
    return res.json()
  }, [])

  return { faq, loading, ricarica: carica, salva, elimina, aggiornaOrdine, toggleAttivo }
}
