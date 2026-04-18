'use client'

import { useState } from 'react'

const inputClass  = 'w-full bg-neutral-50 border border-neutral-200 rounded-btn px-4 py-3 text-neutral-800 placeholder-neutral-300 outline-none focus:border-neutral-400 transition-colors font-light'
const labelClass  = 'block text-neutral-500 font-medium mb-1.5'
const sectionLabelClass = 'block text-neutral-500 uppercase font-medium mb-3'

export default function FormFidelity() {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [consensoPrivacy, setConsensoPrivacy] = useState(false)
  const [consensoMarketing, setConsensoMarketing] = useState(false)
  const [stato, setStato] = useState<'pronto' | 'inviando' | 'successo' | 'esistente' | 'errore'>('pronto')
  const [erroreMsg, setErroreMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consensoPrivacy) return
    setStato('inviando')
    setErroreMsg('')
    try {
      const res = await fetch('/api/fidelity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, cognome, email, telefono,
          data_nascita: dataNascita || null,
          consenso_privacy: consensoPrivacy,
          consenso_marketing: consensoMarketing,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error()
      setStato(json.alreadyMember ? 'esistente' : 'successo')
    } catch {
      setErroreMsg('Si è verificato un errore. Riprova o contattaci direttamente.')
      setStato('pronto')
    }
  }

  if (stato === 'successo') {
    return (
      <div className="rounded-card border border-brand/30 bg-brand/10 p-10 text-center">
        <p className="text-black font-medium mb-3" style={{ fontSize: 'var(--text-section)' }}>Iscrizione completata ✓</p>
        <p className="text-neutral-600 font-light" style={{ fontSize: 'var(--text-body)' }}>
          Benvenuto nel programma Boogie Elite! Riceverai una email di conferma a breve.
          Da ora in poi ogni visita conta.
        </p>
      </div>
    )
  }

  if (stato === 'esistente') {
    return (
      <div className="rounded-card border border-black/10 bg-black/3 p-10 text-center">
        <p className="text-neutral-800 font-medium mb-3" style={{ fontSize: 'var(--text-section)' }}>Sei già iscritto</p>
        <p className="text-neutral-500 font-light" style={{ fontSize: 'var(--text-body)' }}>
          Questa email è già registrata nel programma Fidelity. I tuoi punti ti aspettano!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Nome *</label>
          <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
            className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Mario" />
        </div>
        <div>
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Cognome</label>
          <input type="text" value={cognome} onChange={e => setCognome(e.target.value)}
            className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="Rossi" />
        </div>
        <div>
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Email *</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="mario@esempio.it" />
        </div>
        <div>
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>Telefono</label>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            className={inputClass} style={{ fontSize: 'var(--text-body)' }} placeholder="+39 333 000 0000" />
        </div>
      </div>

      <div>
        <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
          Data di nascita <span className="text-neutral-400 font-light">(opzionale)</span>
        </label>
        <input type="date" value={dataNascita} onChange={e => setDataNascita(e.target.value)}
          className={inputClass} style={{ fontSize: 'var(--text-body)', colorScheme: 'light' }} />
        <p className="mt-1.5 text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          🎂 Compilala per ricevere una sorpresa speciale nel mese del tuo compleanno
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required checked={consensoPrivacy} onChange={e => setConsensoPrivacy(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-brand w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Ho letto e accetto la{' '}
            <a href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">Privacy Policy</a> *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={consensoMarketing} onChange={e => setConsensoMarketing(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-brand w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Acconsento a ricevere comunicazioni promozionali da Boogie Bistrot
          </span>
        </label>
      </div>

      {erroreMsg && <p className="text-red-600" style={{ fontSize: 'var(--text-meta)' }}>{erroreMsg}</p>}

      <div>
        <button
          type="submit"
          disabled={stato === 'inviando' || !consensoPrivacy || !nome || !email}
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-8 py-3.5 rounded-btn transition-colors cursor-pointer"
          style={{ fontSize: 'var(--text-body)' }}
        >
          {stato === 'inviando' ? 'Iscrizione in corso…' : 'Iscriviti al programma'}
        </button>
      </div>

    </form>
  )
}
