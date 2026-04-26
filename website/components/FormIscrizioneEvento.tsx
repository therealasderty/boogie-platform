'use client'

import { useState } from 'react'

import { inputClassDark as inputClass } from '@/lib/form-classes'

export default function FormIscrizioneEvento({
  eventoTitolo,
  variante = 'terminato',
}: {
  eventoTitolo: string
  variante?: 'terminato' | 'tbd'
}) {
  const [stato, setStato] = useState<'pronto' | 'inviando' | 'successo' | 'errore'>('pronto')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [consensoPrivacy, setConsensoPrivacy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consensoPrivacy) return
    setStato('inviando')
    try {
      const res = await fetch('/api/iscriviti-aggiornamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome, email, telefono, dataNascita: dataNascita || null, eventoTitolo }),
      })
      if (!res.ok) throw new Error()
      setStato('successo')
    } catch {
      setStato('errore')
    }
  }

  if (stato === 'successo') {
    return (
      <div className="rounded-card border border-brand/30 bg-brand/5 p-8 text-center">
        <p className="text-brand font-medium mb-2" style={{ fontSize: 'var(--text-section)' }}>Sei nella lista ✓</p>
        <p className="text-text-muted" style={{ fontSize: 'var(--text-body)' }}>
          {variante === 'tbd'
            ? <>Ti avviseremo non appena la data di <strong className="text-white">"{eventoTitolo}"</strong> sarà confermata.</>
            : <>Ti avviseremo non appena <strong className="text-white">"{eventoTitolo}"</strong> tornerà disponibile.</>
          }
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Messaggio contestuale */}
      <div className="flex items-start gap-4 rounded-card p-5 mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-pill flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {variante === 'tbd' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          )}
        </div>
        <div>
          {variante === 'tbd' ? (
            <>
              <p className="text-white font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                Stiamo definendo la programmazione
              </p>
              <p className="text-text-faint leading-relaxed m-0" style={{ fontSize: 'var(--text-meta)' }}>
                La data di <strong className="text-text-muted">"{eventoTitolo}"</strong> non è ancora stata fissata. Lascia i tuoi contatti: ti avviseremo non appena la serata sarà confermata.
              </p>
            </>
          ) : (
            <>
              <p className="text-white font-medium mb-1" style={{ fontSize: 'var(--text-body)' }}>
                Questo appuntamento è terminato
              </p>
              <p className="text-text-faint leading-relaxed m-0" style={{ fontSize: 'var(--text-meta)' }}>
                <strong className="text-text-muted">"{eventoTitolo}"</strong> non è al momento disponibile per nuove prenotazioni — ma potrebbe tornare. Lascia i tuoi contatti e ti avviseremo per primi.
              </p>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <p className="text-text-faint mb-6" style={{ fontSize: 'var(--text-meta)' }}>
          Vuoi prenotare un tavolo per un&apos;altra data?{' '}
          <a href="/prenota" className="text-brand underline underline-offset-2 hover:text-brand-hover transition-colors">
            Vai alla prenotazione
          </a>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Nome *</label>
            <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
              className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Mario" />
          </div>
          <div>
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Cognome</label>
            <input type="text" value={cognome} onChange={e => setCognome(e.target.value)}
              className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Rossi" />
          </div>
          <div>
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="mario@esempio.it" />
          </div>
          <div>
            <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>Telefono</label>
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="+39 333 000 0000" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-text-faint font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
            Data di nascita <span className="text-text-faint/60">(opzionale)</span>
          </label>
          <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)}
            className={inputClass} style={{ fontSize: 'var(--text-body)', colorScheme: 'dark' }} />
          <p className="mt-1.5 text-text-faint/70" style={{ fontSize: 'var(--text-meta)' }}>
            Condividila per ricevere una sorpresa nel mese del tuo compleanno
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consensoPrivacy} onChange={e => setConsensoPrivacy(e.target.checked)}
              className="mt-0.5 accent-brand" required />
            <span className="text-text-faint leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
              Ho letto e accetto la{' '}
              <a href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">Privacy Policy</a> *
            </span>
          </label>
        </div>

        {stato === 'errore' && (
          <p className="text-red-400 mb-4" style={{ fontSize: 'var(--text-meta)' }}>
            Si è verificato un errore. Riprova o contattaci direttamente.
          </p>
        )}

        <button
          type="submit"
          disabled={stato === 'inviando' || !consensoPrivacy || !nome || !email}
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-8 py-3.5 rounded-btn transition-colors cursor-pointer"
          style={{ fontSize: 'var(--text-body)' }}
        >
          {stato === 'inviando' ? 'Invio in corso…' : variante === 'tbd' ? 'Avvisami quando è confermata' : 'Avvisami quando torna'}
        </button>
      </form>
    </div>
  )
}
