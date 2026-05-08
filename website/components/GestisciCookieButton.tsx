'use client'

export default function GestisciCookieButton() {
  function apri() {
    localStorage.removeItem('boogie_cookie_consent')
    document.cookie = 'boogie_cookie_consent=; path=/; max-age=0; SameSite=Lax'
    window.dispatchEvent(new Event('boogie_reset_cookie'))
  }

  return (
    <button
      onClick={apri}
      className="text-white/25 hover:text-white/50 transition-colors font-light text-left"
      style={{ fontSize: 'var(--text-label)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      Gestisci cookie
    </button>
  )
}
