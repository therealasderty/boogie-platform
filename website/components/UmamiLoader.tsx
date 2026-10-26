'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const STORAGE_KEY = 'boogie_cookie_consent'

export default function UmamiLoader() {
  const [consentito, setConsentito] = useState(false)

  useEffect(() => {
    function leggi() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const prefs = JSON.parse(raw)
          setConsentito(prefs?.analitici === true)
        }
      } catch {
        // ignore
      }
    }

    leggi()
    window.addEventListener('boogie_reset_cookie', leggi)
    return () => window.removeEventListener('boogie_reset_cookie', leggi)
  }, [])

  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js'

  if (!websiteId || !consentito) return null

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
