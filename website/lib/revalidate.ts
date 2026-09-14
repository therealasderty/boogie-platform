/**
 * TTL per `fetch(..., { next: { revalidate } })`.
 * Per `export const revalidate` nelle `page.tsx` / `sitemap.ts` Next richiede numeri
 * letterali (es. `259_200`): duplicare qui i valori o aggiornare entrambi a mano.
 */
export const SECONDI_GIORNO = 86_400

/** Blog, media, recensioni, FAQ, località — aggiornati raramente */
export const REVALIDATE_3_GIORNI_S = 3 * SECONDI_GIORNO

export const REVALIDATE_BLOG_S = REVALIDATE_3_GIORNI_S

/** Menu, orari — aggiornati raramente */
export const REVALIDATE_AGENDA_S = SECONDI_GIORNO

/**
 * Eventi in navbar/hero. Deve restare basso: un fetch Airtable vuoto o fallito
 * cacherato per un giorno lascia homepage e dropdown senza appuntamenti,
 * mentre /api/agenda (client) continua a mostrarli.
 */
export const REVALIDATE_EVENTI_S = 120
