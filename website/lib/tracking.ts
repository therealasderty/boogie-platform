/**
 * Tracking form prenotazione — Umami Analytics.
 *
 * Tre metriche chiave:
 *  - form_start       → "Inizio Compilazione"
 *  - step_reached     → "Step Raggiunto"  { step, step_name }
 *  - booking_complete → "Prenotazione Completata"
 */

type TrackingPayload = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: TrackingPayload) => void
    }
  }
}

export function trackEvent(eventName: string, payload?: TrackingPayload) {
  if (typeof window === 'undefined') return

  if (typeof window.umami?.track === 'function') {
    window.umami.track(eventName, payload)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[boogie:track]', eventName, payload)
  }
}

export const track = {
  formStart:       ()                                => trackEvent('form_start'),
  stepReached:     (step: number, stepName: string)  => trackEvent('step_reached', { step, step_name: stepName }),
  bookingComplete: ()                                => trackEvent('booking_complete'),
}
