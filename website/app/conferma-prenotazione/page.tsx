'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

type PrenotazioneDati = {
  nome: string
  data: string
  ora: string
  persone: string
  note: string
  preferenza: string
}

function ConfermaPrenotazioneContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''

  const [stato, setStato] = useState<'loading' | 'form' | 'gia-confermata' | 'successo' | 'errore-carico' | 'errore-conferma'>('loading')
  const [dati, setDati] = useState<PrenotazioneDati | null>(null)
  const [messaggio, setMessaggio] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) { setStato('errore-carico'); return }

    fetch(`/.netlify/functions/conferma?id=${encodeURIComponent(id)}&solo_dati=1`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setStato('errore-carico'); return }
        if (json.alreadyConfirmed) { setStato('gia-confermata'); return }
        setDati({ nome: json.nome, data: json.data, ora: json.ora, persone: json.persone, note: json.note, preferenza: json.preferenza })
        setStato('form')
      })
      .catch(() => setStato('errore-carico'))
  }, [id])

  async function handleConferma() {
    setSubmitting(true)
    try {
      const res = await fetch(`/.netlify/functions/conferma?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaggio: messaggio.trim() }),
      })
      const json = await res.json()
      setStato(json.success ? 'successo' : 'errore-conferma')
    } catch {
      setStato('errore-conferma')
    }
    setSubmitting(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-raleway), Arial, sans-serif' }}>
      <div style={{ background: 'white', borderTop: '3px solid #C4913A', maxWidth: 520, width: '100%', padding: '40px' }}>

        <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width={64} style={{ display: 'block', margin: '0 auto 24px' }} />

        {stato === 'loading' && (
          <p style={{ textAlign: 'center', color: '#8B6F47', fontSize: 14 }}>Caricamento...</p>
        )}

        {stato === 'gia-confermata' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#1A1610', marginBottom: 8 }}>Già confermata ✅</h1>
            <p style={{ color: '#4A4030', lineHeight: 1.7, fontSize: 14 }}>Questa prenotazione è già stata confermata in precedenza.</p>
          </>
        )}

        {stato === 'errore-carico' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#1A1610', marginBottom: 8 }}>Prenotazione non trovata</h1>
            <p style={{ color: '#4A4030', lineHeight: 1.7, fontSize: 14 }}>Il link potrebbe essere scaduto o non valido.</p>
          </>
        )}

        {stato === 'errore-conferma' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#C0392B', marginBottom: 8 }}>Errore durante la conferma</h1>
            <p style={{ color: '#4A4030', lineHeight: 1.7, fontSize: 14 }}>Si è verificato un problema. Riprova o contatta il team tecnico.</p>
          </>
        )}

        {stato === 'successo' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#2E7D32', marginBottom: 8 }}>Prenotazione confermata! ✅</h1>
            <p style={{ color: '#4A4030', lineHeight: 1.7, fontSize: 14 }}>
              È stata inviata un'email di conferma a <strong>{dati?.nome}</strong>.
            </p>
          </>
        )}

        {stato === 'form' && dati && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#1A1610', margin: '0 0 6px' }}>Conferma prenotazione</h1>
            <p style={{ fontSize: 13, color: '#8B6F47', margin: '0 0 24px' }}>Invia la conferma al cliente</p>

            <div style={{ background: '#F5F0E8', borderLeft: '3px solid #C4913A', padding: '16px 20px', marginBottom: 24 }}>
              {[
                { label: 'Cliente',  val: dati.nome },
                { label: 'Data',     val: dati.data },
                { label: 'Ora',      val: dati.ora },
                { label: 'Ospiti',   val: `${dati.persone} ${dati.persone === '1' ? 'persona' : 'persone'}` },
                ...(dati.preferenza ? [{ label: 'Preferenza', val: dati.preferenza }] : []),
                ...(dati.note       ? [{ label: 'Note',       val: dati.note       }] : []),
              ].map(({ label, val }) => (
                <p key={label} style={{ margin: '0 0 8px', fontSize: 13 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B6F47', display: 'block', marginBottom: 2 }}>{label}</span>
                  <strong>{val}</strong>
                </p>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4A4030', display: 'block', marginBottom: 6 }}>
                Messaggio personalizzato <span style={{ fontWeight: 400, color: '#8B6F47' }}>(opzionale)</span>
              </label>
              <textarea
                value={messaggio}
                onChange={e => setMessaggio(e.target.value)}
                placeholder="Es: Vi aspettiamo al vostro tavolo preferito…"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #D4C9B0', borderRadius: 4, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleConferma}
              disabled={submitting}
              style={{ background: '#C4913A', color: 'white', border: 'none', padding: '14px 28px', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {submitting ? 'Conferma in corso...' : '✅ Conferma e invia email al cliente'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function ConfermaPrenotazionePage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: '#8B6F47' }}>Caricamento...</p>
      </main>
    }>
      <ConfermaPrenotazioneContent />
    </Suspense>
  )
}
