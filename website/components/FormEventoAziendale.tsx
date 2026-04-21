'use client'

import { useState } from 'react'

const TIPI_EVENTO = [
  'Cena aziendale',
  'Pranzo di lavoro',
  'Team building',
  'Cena di Natale',
  'Altro',
]

const inputClass = "w-full px-4 py-3 rounded-btn bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors font-light"

export default function FormEventoAziendale() {
  const [stato, setStato] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStato('loading')

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      nome:                fd.get('nome'),
      cognome:             fd.get('cognome'),
      email:               fd.get('email'),
      telefono:            fd.get('telefono'),
      data_evento:         fd.get('data_evento'),
      num_ospiti:          fd.get('num_ospiti'),
      tipo_evento:         fd.get('tipo_evento'),
      note:                fd.get('note'),
      consenso_privacy:    fd.get('consenso_privacy') === 'on',
      consenso_marketing:  fd.get('consenso_marketing') === 'on',
    }

    try {
      const res = await fetch('/.netlify/functions/contatta-evento-aziendale', {
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
          Richiesta inviata, grazie!
        </p>
        <p className="text-neutral-400 font-light" style={{ fontSize: 'var(--text-meta)' }}>
          Ti risponderemo al più presto per definire insieme tutti i dettagli.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Nome / Cognome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Nome *
          </label>
          <input name="nome" type="text" required placeholder="Mario"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Cognome
          </label>
          <input name="cognome" type="text" placeholder="Rossi"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      {/* Email / Telefono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Email *
          </label>
          <input name="email" type="email" required placeholder="mario@azienda.it"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Telefono
          </label>
          <input name="telefono" type="tel" placeholder="+39 000 000 0000"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      {/* Tipo evento / Numero ospiti */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Tipo di evento
          </label>
          <select name="tipo_evento"
            className={`${inputClass} cursor-pointer`}
            style={{ fontSize: 'var(--text-meta)' }}
            defaultValue=""
          >
            <option value="" disabled>Seleziona...</option>
            {TIPI_EVENTO.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
            Numero ospiti *
          </label>
          <input name="num_ospiti" type="number" required min={1} placeholder="Es. 20"
            className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
        </div>
      </div>

      {/* Data / periodo */}
      <div className="flex flex-col gap-2">
        <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
          Data o periodo indicativo
        </label>
        <input name="data_evento" type="text" placeholder="Es. 15 dicembre 2025, o fine novembre"
          className={inputClass} style={{ fontSize: 'var(--text-meta)' }} />
      </div>

      {/* Note */}
      <div className="flex flex-col gap-2">
        <label className="text-neutral-500 font-medium" style={{ fontSize: 'var(--text-meta)' }}>
          Note e richieste particolari
        </label>
        <textarea name="note" rows={4}
          placeholder="Menu tematici, allergie, allestimento, orari particolari..."
          className={`${inputClass} resize-none`}
          style={{ fontSize: 'var(--text-meta)' }} />
      </div>

      {/* Privacy / Marketing */}
      <div className="flex flex-col gap-3 pt-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input name="consenso_privacy" type="checkbox" required
            className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
          <span className="text-neutral-500 font-light leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Ho letto e accetto la{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-black transition-colors">Privacy Policy</a>. *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input name="consenso_marketing" type="checkbox"
            className="mt-0.5 flex-shrink-0 accent-black w-4 h-4 cursor-pointer" />
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
        {stato === 'loading' ? 'Invio in corso...' : 'Invia richiesta'}
      </button>

    </form>
  )
}
