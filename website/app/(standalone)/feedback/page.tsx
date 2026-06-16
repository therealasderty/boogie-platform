'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

const STAR_LABELS = ['Pessimo', 'Scarso', 'Nella media', 'Buono', 'Eccellente']

function FeedbackContent() {
  const searchParams = useSearchParams()
  const nome = searchParams.get('nome') ?? ''
  const data = searchParams.get('data') ?? ''

  const [voto, setVoto] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [commento, setCommento] = useState('')
  const [stato, setStato] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const dataFormattata = data
    ? new Date(data + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'la tua visita'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commento.trim()) return
    setStato('loading')
    try {
      const res = await fetch('/.netlify/functions/salva-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, dataPrenotazione: data, voto: voto || null, commento: commento.trim() }),
      })
      setStato(res.ok ? 'ok' : 'error')
    } catch {
      setStato('error')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'var(--font-raleway), Arial, sans-serif' }}>
      <div style={{ background: 'white', borderTop: '3px solid #C4913A', maxWidth: 520, width: '100%', padding: '40px' }}>

        <img src="https://boogiebistrot.com/logo-email.png" alt="Boogie Bistrot" width={64} style={{ display: 'block', margin: '0 auto 24px' }} />

        {stato === 'ok' ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: '#1A1610', margin: '0 0 12px' }}>
              Grazie per il tuo feedback 🙏
            </h1>
            <p style={{ fontSize: 14, color: '#4A4030', lineHeight: 1.7, margin: 0 }}>
              Il tuo messaggio ci aiuta a migliorare. Lo leggeremo con attenzione.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B6F47', margin: '0 0 8px' }}>
              Boogie Bistrot
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 400, color: '#1A1610', margin: '0 0 8px', lineHeight: 1.3 }}>
              {nome ? `Ciao ${nome},` : 'Ciao,'}
            </h1>
            <p style={{ fontSize: 15, color: '#4A4030', lineHeight: 1.7, margin: '0 0 28px' }}>
              Cosa è andato storto durante {dataFormattata}? Il tuo feedback ci aiuta a fare meglio.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Stelle */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4A4030', display: 'block', marginBottom: 10 }}>
                  Valutazione <span style={{ fontWeight: 400, color: '#8B6F47' }}>(opzionale)</span>
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setVoto(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        fontSize: 28, lineHeight: 1,
                        color: n <= (hovered || voto) ? '#C4913A' : '#D4C9B0',
                        transition: 'color 0.15s',
                      }}
                      aria-label={STAR_LABELS[n - 1]}
                    >
                      ★
                    </button>
                  ))}
                  {(hovered || voto) > 0 && (
                    <span style={{ fontSize: 13, color: '#8B6F47', marginLeft: 4 }}>
                      {STAR_LABELS[(hovered || voto) - 1]}
                    </span>
                  )}
                </div>
              </div>

              {/* Commento */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4A4030', display: 'block', marginBottom: 6 }}>
                  Raccontaci cosa è successo <span style={{ color: '#C0392B' }}>*</span>
                </label>
                <textarea
                  value={commento}
                  onChange={e => setCommento(e.target.value)}
                  required
                  rows={5}
                  placeholder="Es: Il servizio era lento, il tavolo non era pronto…"
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 14, lineHeight: 1.6,
                    border: '1px solid #D4C9B0', borderRadius: 4, fontFamily: 'inherit',
                    resize: 'vertical', boxSizing: 'border-box', color: '#1A1610',
                    background: '#FDFAF6', outline: 'none',
                  }}
                />
              </div>

              {stato === 'error' && (
                <p style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>
                  Si è verificato un errore. Riprova o scrivici a{' '}
                  <a href="mailto:info@boogiebistrot.com" style={{ color: '#C4913A' }}>info@boogiebistrot.com</a>.
                </p>
              )}

              <button
                type="submit"
                disabled={stato === 'loading' || !commento.trim()}
                style={{
                  background: '#1A1610', color: 'white', border: 'none',
                  padding: '14px 28px', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.05em', borderRadius: 4, cursor: 'pointer',
                  opacity: stato === 'loading' || !commento.trim() ? 0.5 : 1,
                  fontFamily: 'inherit', alignSelf: 'flex-start',
                  transition: 'opacity 0.15s',
                }}
              >
                {stato === 'loading' ? 'Invio in corso…' : 'Invia feedback'}
              </button>

            </form>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #D4C9B0' }}>
              <p style={{ fontSize: 11, color: '#B0A898', margin: 0, lineHeight: 1.7 }}>
                Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)<br />
                Hai ricevuto questa email perché hai cenato da noi. Non vuoi ricevere questi messaggi?{' '}
                <a href="mailto:info@boogiebistrot.com" style={{ color: '#C4913A' }}>Scrivici</a>.
              </p>
            </div>
          </>
        )}

      </div>
    </main>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: '#8B6F47' }}>Caricamento…</p>
      </main>
    }>
      <FeedbackContent />
    </Suspense>
  )
}
