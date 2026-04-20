'use client'

import { useState } from 'react'

export default function FormContatti() {
  const [inviato, setInviato] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: collegare a backend / form provider
    setInviato(true)
  }

  if (inviato) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
            Nome
          </label>
          <input type="text" required placeholder="Mario"
            className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
            Cognome
          </label>
          <input type="text" required placeholder="Rossi"
            className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
            Telefono
          </label>
          <input type="tel" placeholder="+39 000 000 0000"
            className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
            Email
          </label>
          <input type="email" required placeholder="mario@email.it"
            className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
          Data di nascita <span className="text-neutral-400 font-light">(opzionale)</span>
        </label>
        <input type="date"
          className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-neutral-400 transition-colors font-light"
          style={{ fontSize: 'var(--text-meta)', colorScheme: 'light' }} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="block text-neutral-500 font-medium mb-1.5" style={{ fontSize: 'var(--text-meta)' }}>
          Messaggio
        </label>
        <textarea required rows={5} placeholder="Come possiamo aiutarti?"
          className="w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light resize-none"
          style={{ fontSize: 'var(--text-meta)' }} />
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Ho letto e accetto la{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-black transition-colors">Privacy Policy</a>. *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Acconsento a ricevere comunicazioni commerciali e newsletter da Boogie Bistrot.
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="self-start border border-black text-black hover:bg-black hover:text-white font-semibold px-8 py-3 rounded-btn transition-colors mt-2 cursor-pointer"
        style={{ fontSize: 'var(--text-meta)' }}
      >
        Invia messaggio
      </button>

    </form>
  )
}
