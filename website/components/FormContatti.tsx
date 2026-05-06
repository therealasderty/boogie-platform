'use client'

import { useState } from 'react'
import { inputClass, labelClass } from '@/lib/form-classes'

export default function FormContatti() {
  const [stato, setStato] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [loadedAt] = useState(() => Date.now())

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStato('loading')

    const fd = new FormData(e.currentTarget)

    // Anti-spam: honeypot deve essere vuoto, e devono essere passati almeno 3s
    if (fd.get('website') || Date.now() - loadedAt < 3000) {
      setStato('ok') // risposta silenziosa: il bot crede di aver avuto successo
      return
    }

    const payload = {
      nome:               fd.get('nome'),
      cognome:            fd.get('cognome'),
      telefono:           fd.get('telefono'),
      email:              fd.get('email'),
      messaggio:          fd.get('messaggio'),
      consenso_privacy:   fd.get('consenso_privacy') === 'on',
      consenso_marketing: fd.get('consenso_marketing') === 'on',
      website:            fd.get('website'), // honeypot
    }

    try {
      const res = await fetch('/.netlify/functions/contatta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setStato('ok')
    } catch {
      setStato('error')
    }
  }

  if (stato === 'ok') {
    return (
      <div className="flex flex-col gap-3 py-8">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-brand">
          <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 16.5l4.5 4.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="font-medium text-neutral-800" style={{ fontSize: 'var(--text-body)' }}>
          Messaggio inviato, grazie!
        </p>
        <p className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          Ti risponderemo il prima possibile.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Honeypot anti-spam — nascosto agli utenti, visibile ai bot */}
      <div aria-hidden="true" tabIndex={-1} style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
        <label>Non compilare questo campo</label>
        <input name="website" type="text" autoComplete="off" tabIndex={-1} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
            Nome
          </label>
          <input name="nome" type="text" required placeholder="Mario"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
            Cognome
          </label>
          <input name="cognome" type="text" required placeholder="Rossi"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
            Telefono
          </label>
          <input name="telefono" type="tel" placeholder="+39 000 000 0000"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
            Email
          </label>
          <input name="email" type="email" required placeholder="mario@email.it"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
          Data di nascita <span className="text-neutral-400 font-light">(opzionale)</span>
        </label>
        <input name="data_nascita" type="date"
          className={inputClass}
          style={{ fontSize: 'var(--text-meta)', colorScheme: 'light' }} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass} style={{ fontSize: 'var(--text-meta)' }}>
          Messaggio
        </label>
        <textarea name="messaggio" required rows={5} placeholder="Come possiamo aiutarti?"
          className={`${inputClass} resize-none`}
          style={{ fontSize: 'var(--text-meta)' }} />
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input name="consenso_privacy" type="checkbox" required className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Ho letto e accetto la{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-black transition-colors">Privacy Policy</a>. *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input name="consenso_marketing" type="checkbox" className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Acconsento a ricevere comunicazioni commerciali e newsletter da Boogie Bistrot.
          </span>
        </label>
      </div>

      {stato === 'error' && (
        <p className="text-red-500 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          Si è verificato un errore. Riprova o contattaci direttamente.
        </p>
      )}

      <button
        type="submit"
        disabled={stato === 'loading'}
        className="self-start border border-black text-black hover:bg-black hover:text-white font-semibold px-8 py-3 rounded-btn transition-colors mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontSize: 'var(--text-meta)' }}
      >
        {stato === 'loading' ? 'Invio in corso...' : 'Invia messaggio'}
      </button>

    </form>
  )
}
