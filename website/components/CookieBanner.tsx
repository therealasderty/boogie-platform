'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Preferenze = {
  necessari: true
  analitici: boolean
  marketing: boolean
}

const STORAGE_KEY = 'boogie_cookie_consent'

function leggiConsent(): Preferenze | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function salvaConsent(p: Preferenze) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export default function CookieBanner() {
  const [visibile, setVisibile] = useState(() => !leggiConsent())
  const [personalizza, setPersonalizza] = useState(false)
  const [analitici, setAnalitici] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const reset = () => { setPersonalizza(false); setVisibile(true) }
    window.addEventListener('boogie_reset_cookie', reset)
    return () => window.removeEventListener('boogie_reset_cookie', reset)
  }, [])

  function accettaTutti() {
    salvaConsent({ necessari: true, analitici: true, marketing: true })
    setVisibile(false)
  }

  function soloNecessari() {
    salvaConsent({ necessari: true, analitici: false, marketing: false })
    setVisibile(false)
  }

  function salvaPersonalizzati() {
    salvaConsent({ necessari: true, analitici, marketing })
    setVisibile(false)
  }

  if (!visibile) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[300] md:bottom-6 md:left-6 md:right-auto md:max-w-md"
      style={{ padding: '0' }}
    >
      <div
        className="text-white shadow-2xl"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', borderTopLeftRadius: 'var(--radius-card)', borderTopRightRadius: 'var(--radius-card)' }}
      >
        {/* Corpo principale */}
        <div style={{ padding: '20px 20px 16px' }}>
          <p className="font-medium text-white mb-1" style={{ fontSize: 'var(--text-body)' }}>
            Questo sito usa i cookie
          </p>
          <p className="text-text-faint leading-relaxed" style={{ fontSize: 'var(--text-meta)' }}>
            Utilizziamo cookie tecnici necessari e, con il tuo consenso, cookie analitici e di marketing.{' '}
            <Link href="/privacy" className="text-brand underline underline-offset-2 hover:text-brand-hover">
              Privacy policy
            </Link>
          </p>

          {/* Pannello personalizza */}
          {personalizza && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Necessari */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p className="text-white font-medium" style={{ fontSize: 'var(--text-meta)', margin: 0 }}>Necessari</p>
                  <p className="text-text-faint" style={{ fontSize: '0.75rem', margin: 0 }}>Funzionamento del sito, sempre attivi</p>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: 'var(--color-brand)', flexShrink: 0, opacity: 0.5 }} />
              </label>

              {/* Analitici */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                <div>
                  <p className="text-white font-medium" style={{ fontSize: 'var(--text-meta)', margin: 0 }}>Analitici</p>
                  <p className="text-text-faint" style={{ fontSize: '0.75rem', margin: 0 }}>Statistiche anonime di visita</p>
                </div>
                <Toggle value={analitici} onChange={setAnalitici} />
              </label>

              {/* Marketing */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                <div>
                  <p className="text-white font-medium" style={{ fontSize: 'var(--text-meta)', margin: 0 }}>Marketing</p>
                  <p className="text-text-faint" style={{ fontSize: '0.75rem', margin: 0 }}>Annunci personalizzati</p>
                </div>
                <Toggle value={marketing} onChange={setMarketing} />
              </label>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={accettaTutti}
            className="bg-brand hover:bg-brand-hover text-black font-medium rounded-btn transition-colors"
            style={{ padding: '10px 16px', fontSize: 'var(--text-meta)', width: '100%' }}
          >
            Accetta tutti
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={soloNecessari}
              className="rounded-btn transition-colors text-text-muted hover:text-white"
              style={{ padding: '8px 12px', fontSize: 'var(--text-meta)', flex: 1, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
            >
              Solo necessari
            </button>
            {!personalizza ? (
              <button
                onClick={() => setPersonalizza(true)}
                className="rounded-btn transition-colors text-text-muted hover:text-white"
                style={{ padding: '8px 12px', fontSize: 'var(--text-meta)', flex: 1, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
              >
                Personalizza
              </button>
            ) : (
              <button
                onClick={salvaPersonalizzati}
                className="rounded-btn transition-colors text-text-muted hover:text-white"
                style={{ padding: '8px 12px', fontSize: 'var(--text-meta)', flex: 1, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
              >
                Salva scelta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 999, flexShrink: 0,
        background: value ? 'var(--color-brand)' : 'rgba(255,255,255,0.15)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }} />
    </div>
  )
}
