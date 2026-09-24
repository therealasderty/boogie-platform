/**
 * EmailMarketingPanel.jsx
 * Gestione campagne email marketing con template modulare a blocchi.
 *
 * Struttura:
 *  — Lista campagne (default)
 *  — Dettaglio campagna: 3 tab (Info, Template, Contatti)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  EnvelopeSimple, Plus, ArrowLeft, Trash,
  TextT, Image, Images, CursorClick, Minus, ArrowUp, ArrowDown,
  UploadSimple, Eye, FloppyDisk, ListBullets, Quotes, Users, SquaresFour,
  CaretDown, GearSix, Play, Pause, ArrowRight, GridFour, FilePdf,
} from '@phosphor-icons/react'
import { authFetch } from '../../lib/authFetch'
import { parseContattiCsv } from '../../lib/parseContattiCsv'
import { MediaLibraryModal } from './BlocchiEditor'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import styles from './EmailMarketingPanel.module.css'

/** Bump a ogni release del modulo — confronta con l’online dopo il deploy Netlify. */
export const EMAIL_MKTG_VERSION = '2026.09.24-e'

// ─── Costanti ─────────────────────────────────────────────────────────────────

const STATI_CAMPAGNA = ['Bozza', 'Programmata', 'InCorso', 'Completata', 'Pausa']

const STATI_BADGE = {
  Bozza:       { label: 'Bozza',       color: 'var(--text3)' },
  Programmata: { label: 'Programmata', color: '#1565C0' },
  InCorso:     { label: 'In corso',    color: 'var(--accent)' },
  Completata:  { label: 'Completata',  color: 'var(--success)' },
  Pausa:       { label: 'In pausa',    color: '#7A6448' },
}

const BLOCK_TYPES = [
  { type: 'preheader',           label: 'Preheader',     Icon: Eye,            group: 'struttura' },
  { type: 'header-scuro',        label: 'Header oro',    Icon: Image,          group: 'struttura' },
  { type: 'footer-ricco',        label: 'Footer',        Icon: Minus,          group: 'struttura' },
  { type: 'intestazione',        label: 'Titolo',        Icon: TextT,          group: 'testo' },
  { type: 'intestazione-piccola',label: 'Sottotitolo',   Icon: TextT,          group: 'testo' },
  { type: 'testo',               label: 'Testo',         Icon: TextT,          group: 'testo' },
  { type: 'evidenza',            label: 'Evidenza',      Icon: Quotes,         group: 'testo' },
  { type: 'lista',               label: 'Lista',         Icon: ListBullets,    group: 'testo' },
  { type: 'box-4',               label: '4 box',         Icon: GridFour,       group: 'testo' },
  { type: 'separatore',          label: 'Separatore',    Icon: Minus,          group: 'testo' },
  { type: 'hero',                label: 'Hero',          Icon: Images,         group: 'media' },
  { type: 'immagine',            label: 'Immagine',      Icon: Image,          group: 'media' },
  { type: 'mosaico',             label: 'Mosaico 4',     Icon: SquaresFour,    group: 'media' },
  { type: 'pulsante',            label: 'Pulsante CTA',  Icon: CursorClick,    group: 'azioni' },
  { type: 'contatti-diretti',    label: 'Contatti',      Icon: EnvelopeSimple, group: 'azioni' },
]

const BLOCK_GROUPS = [
  { id: 'struttura', label: 'Struttura' },
  { id: 'testo',     label: 'Testo' },
  { id: 'media',     label: 'Media' },
  { id: 'azioni',    label: 'Azioni' },
]

const DEFAULT_BLOCKS = {
  preheader:            { type: 'preheader',            testo: 'Sala esclusiva, ampio giardino e un menu su misura per il tuo evento aziendale.' },
  'header-scuro':       { type: 'header-scuro',         logoUrl: 'https://boogiebistrot.com/logo-email.png', indirizzo: 'Via Europa, 2 — Colle Brianza (LC)' },
  hero:                 { type: 'hero',                 url: '', alt: '', link: '' },
  intestazione:         { type: 'intestazione',         testo: 'Ciao {nome},' },
  'intestazione-piccola':{ type: 'intestazione-piccola', testo: 'Sottotitolo sezione' },
  testo:                { type: 'testo',                contenuto: 'Scrivi il tuo messaggio qui...' },
  immagine:             { type: 'immagine',             url: '', alt: '', link: '' },
  mosaico:              { type: 'mosaico',              immagini: [{ url: '', alt: '', link: '' }, { url: '', alt: '', link: '' }, { url: '', alt: '', link: '' }, { url: '', alt: '', link: '' }] },
  evidenza:             { type: 'evidenza',             contenuto: 'Testo in evidenza, offerta speciale o informazione importante.' },
  lista:                { type: 'lista',                voci: 'Prima voce\nSeconda voce\nTerza voce' },
  'box-4':              { type: 'box-4',                voci: 'Sala esclusiva — spazi riservati solo al vostro gruppo\nAmpio giardino — perfetto per aperitivi all\'aperto\nLocation storica — tra le colline brianzole\nMenu personalizzati — su misura per voi' },
  pulsante:             { type: 'pulsante',             testo: 'Scopri di più', href: 'https://boogiebistrot.com', stile: 'brand' },
  'contatti-diretti':   { type: 'contatti-diretti',     testo: 'Oppure contattaci direttamente:', sito: 'https://boogiebistrot.com', telefono: '+39 039 9260568', email: 'info@boogiebistrot.com' },
  separatore:           { type: 'separatore' },
  'footer-ricco':       { type: 'footer-ricco',         testo: 'Boogie Bistrot\nVia Europa, 2 — Colle Brianza (LC)', sito: 'https://boogiebistrot.com', instagram: 'https://www.instagram.com/boogiebistrot', unsubscribe: true },
}

function uid() { return Math.random().toString(36).slice(2, 9) }

const LAYOUT_TYPES = new Set(['preheader', 'header-scuro', 'footer-ricco'])

// ─── Preview HTML email ───────────────────────────────────────────────────────

const FONT_STACK = "'Raleway',Arial,sans-serif"
const CG = '#C4913A', CD = '#1A1610', CB = '#4A4030', CMUTED = '#8B6F47'
const CBG = '#F5F0E8', CLINE = '#D4C9B0', CFOOT = '#B0A898'
const LOGO_URL = 'https://boogiebistrot.com/logo-email.png'
const LOGO_DARK = 'https://boogiebistrot.com/logo-email.png'

function renderBlockHtml(b, nome = 'Mario') {
  const sub = s => (s || '').replace(/\{nome\}/gi, nome)
  switch (b.type) {
    case 'intestazione':
      return `<h2 style="font-family:${FONT_STACK};font-size:28px;font-weight:600;color:${CD};margin:0 0 20px;text-align:left;line-height:1.3;">${sub(b.testo)}</h2>`
    case 'intestazione-piccola':
      return `<h3 style="font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${CD};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">${sub(b.testo)}</h3>`
    case 'testo':
      return `<p style="font-family:${FONT_STACK};font-size:15px;line-height:1.8;color:${CB};margin:0 0 20px;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p>`
    case 'immagine': {
      if (!b.url) return `<p style="font-size:12px;color:${CMUTED};font-style:italic;text-align:center;margin-bottom:20px;">[Immagine: inserisci URL]</p>`
      const img = `<img src="${b.url}" alt="${b.alt || ''}" width="536" style="display:block;width:100%;max-width:536px;border:0;margin:0 auto 20px;border-radius:4px;">`
      return b.link ? `<a href="${b.link}" style="display:block;text-decoration:none;">${img}</a>` : img
    }
    case 'hero': {
      if (!b.url) return `<p style="font-size:12px;color:${CMUTED};font-style:italic;text-align:center;margin:0 0 20px;">[Hero: inserisci URL]</p>`
      const img = `<img src="${b.url}" alt="${b.alt || ''}" width="600" height="300" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;border:0;">`
      const frame = `<div style="display:block;overflow:hidden;position:relative;width:100%;padding-bottom:50%;height:0;background:${CBG};">${b.link ? `<a href="${b.link}" style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;text-decoration:none;">${img}</a>` : img}</div>`
      return frame
    }
    case 'mosaico': {
      const slots = Array.from({ length: 4 }, (_, i) => (b.immagini && b.immagini[i]) || { url: '', alt: '', link: '' })
      const cell = (slot, pad) => {
        const frame = (inner) =>
          `<div style="display:block;overflow:hidden;position:relative;width:100%;padding-bottom:66.67%;height:0;border-radius:2px;background:${CBG};">${inner}</div>`
        let inner
        if (slot.url) {
          const img = `<img src="${slot.url}" alt="${slot.alt || ''}" width="268" height="179" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;border:0;">`
          inner = slot.link ? `<a href="${slot.link}" style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;text-decoration:none;">${img}</a>` : img
        } else {
          inner = `<span style="position:absolute;top:50%;left:0;right:0;transform:translateY(-50%);font-family:${FONT_STACK};font-size:11px;color:${CMUTED};text-align:center;">Foto</span>`
        }
        return `<td width="50%" valign="top" style="width:50%;${pad}">${frame(inner)}</td>`
      }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;">
<tr>${cell(slots[0], 'padding:0 3px 3px 0;')}${cell(slots[1], 'padding:0 0 3px 3px;')}</tr>
<tr>${cell(slots[2], 'padding:3px 3px 0 0;')}${cell(slots[3], 'padding:3px 0 0 3px;')}</tr>
</table>`
    }
    case 'evidenza':
      return `<table cellpadding="0" cellspacing="0" width="100%" style="background:${CBG};border-left:3px solid ${CG};margin-bottom:24px;"><tr><td style="padding:16px 20px;"><p style="font-family:${FONT_STACK};font-size:15px;line-height:1.7;color:${CB};margin:0;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p></td></tr></table>`
    case 'lista': {
      const voci = (b.voci || '').split('\n').filter(v => v.trim())
      const rows = voci.map((v, i) => {
        const isLast = i === voci.length - 1
        return `<tr><td style="padding:0 0 ${isLast ? '0' : '8px'};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CBG};border:1px solid ${CLINE};border-radius:6px;border-collapse:separate;">
<tr>
<td width="36" valign="top" style="width:36px;padding:14px 0 14px 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.5;color:${CG};font-weight:700;">✓</td>
<td valign="top" style="padding:14px 16px 14px 4px;font-family:${FONT_STACK};font-size:15px;line-height:1.55;color:${CD};">${sub(v.trim())}</td>
</tr>
</table>
</td></tr>`
      }).join('')
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>`
    }
    case 'box-4': {
      const voci = (b.voci || '').split('\n').map(v => v.trim()).filter(Boolean).slice(0, 4)
      while (voci.length < 4) voci.push('')
      const cellHtml = (testo, pad) => {
        let inner
        if (!testo) {
          inner = `<p style="font-family:${FONT_STACK};font-size:13px;color:${CMUTED};margin:0;font-style:italic;">Box vuoto</p>`
        } else {
          const parts = testo.split(/\s+[—–-]\s+/)
          if (parts.length >= 2) {
            const titolo = sub(parts[0].replace(/^✓\s*/, ''))
            const resto = sub(parts.slice(1).join(' — '))
            inner = `<p style="font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${CD};margin:0 0 6px;line-height:1.35;">${titolo}</p><p style="font-family:${FONT_STACK};font-size:13px;line-height:1.55;color:${CB};margin:0;">${resto}</p>`
          } else {
            inner = `<p style="font-family:${FONT_STACK};font-size:14px;line-height:1.55;color:${CB};margin:0;">${sub(testo.replace(/^✓\s*/, ''))}</p>`
          }
        }
        return `<td width="50%" valign="top" style="width:50%;${pad}"><div style="background:${CBG};border-radius:4px;padding:14px 16px;height:100%;box-sizing:border-box;">${inner}</div></td>`
      }
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;">
<tr>${cellHtml(voci[0], 'padding:0 5px 5px 0;')}${cellHtml(voci[1], 'padding:0 0 5px 5px;')}</tr>
<tr>${cellHtml(voci[2], 'padding:5px 5px 0 0;')}${cellHtml(voci[3], 'padding:5px 0 0 5px;')}</tr>
</table>`
    }
    case 'pulsante': {
      let bg = CG, color = CD, border = ''
      if (b.stile === 'dark')  { bg = CD;   color = 'white' }
      if (b.stile === 'light') { bg = CBG;  border = ';border:1px solid ' + CLINE }
      return `<p style="text-align:center;margin:0 0 24px;"><a href="${b.href || '#'}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;padding:14px 32px;font-family:${FONT_STACK};font-size:14px;font-weight:600;letter-spacing:0.04em;border-radius:4px${border};">${b.testo || 'Clicca qui'}</a></p>`
    }
    case 'contatti-diretti': {
      const sito = (b.sito || 'https://boogiebistrot.com').trim()
      const tel = (b.telefono || '').trim()
      const em = (b.email || '').trim()
      const intro = sub(b.testo || 'Oppure contattaci direttamente:')
      const sitoLabel = sito.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Sito'
      const box = (label, valueHtml, pad) =>
        `<td width="33.33%" valign="top" style="width:33.33%;${pad}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CBG};border:1px solid ${CLINE};border-radius:6px;border-collapse:separate;">
<tr><td align="center" style="padding:16px 10px;">
<p style="font-family:${FONT_STACK};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${CG};margin:0 0 8px;">${label}</p>
${valueHtml}
</td></tr>
</table>
</td>`
      const sitoHtml = sito
        ? `<a href="${sito}" style="font-family:${FONT_STACK};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;">${sitoLabel}</a>`
        : `<span style="font-family:${FONT_STACK};font-size:13px;color:${CMUTED};">—</span>`
      const mailHtml = em
        ? `<a href="mailto:${em}" style="font-family:${FONT_STACK};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;word-break:break-all;">${em}</a>`
        : `<span style="font-family:${FONT_STACK};font-size:13px;color:${CMUTED};">—</span>`
      const telHtml = tel
        ? `<a href="tel:${tel.replace(/\s/g, '')}" style="font-family:${FONT_STACK};font-size:13px;font-weight:600;color:${CD};text-decoration:none;line-height:1.4;">${tel}</a>`
        : `<span style="font-family:${FONT_STACK};font-size:13px;color:${CMUTED};">—</span>`
      return `${intro ? `<p style="text-align:center;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${CB};margin:0 0 14px;">${intro}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;">
<tr>
${box('Sito', sitoHtml, 'padding:0 4px 0 0;')}
${box('Email', mailHtml, 'padding:0 2px;')}
${box('Telefono', telHtml, 'padding:0 0 0 4px;')}
</tr>
</table>`
    }
    case 'separatore':
      return `<hr style="border:none;border-top:1px solid ${CLINE};margin:24px 0;">`
    default: return ''
  }
}

function renderHeaderScuro(b) {
  let logo = b?.logoUrl || LOGO_DARK
  // logo-white su oro chiaro sparisce → forza logo scuro
  if (!logo || logo.includes('logo-white')) logo = LOGO_DARK
  const indirizzo = (b?.indirizzo || 'Via Europa, 2 — Colle Brianza (LC)').trim()
  const addr = indirizzo
    ? `<p style="margin:10px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.4;color:${CD};letter-spacing:0.02em;">${indirizzo}</p>`
    : ''
  return `<tr><td align="center" style="padding:20px 24px 16px;background:#eece9d;"><img src="${logo}" alt="Boogie Bistrot" width="72" style="display:block;width:72px;height:auto;border:0;margin:0 auto;">${addr}</td></tr>`
}

function renderFooterRicco(b) {
  const lines = (b?.testo || 'Boogie Bistrot\nVia Europa, 2 — Colle Brianza (LC)')
    .split('\n').map(l => l.trim()).filter(Boolean).join('<br>')
  const links = []
  if (b?.sito) links.push(`<a href="${b.sito}" style="color:${CD};text-decoration:underline;">boogiebistrot.com</a>`)
  if (b?.instagram) links.push(`<a href="${b.instagram}" style="color:${CD};text-decoration:underline;">Instagram</a>`)
  const unsub = b?.unsubscribe !== false
    ? `<br><a href="{{unsubscribe}}" style="color:${CB};text-decoration:underline;">Non vuoi più ricevere comunicazioni?</a>`
    : ''
  return `<tr><td align="center" style="padding:22px 32px;background:#eece9d;font-size:12px;color:${CD};text-align:center;font-family:${FONT_STACK};line-height:1.7;">${lines}${links.length ? `<br>${links.join(' &nbsp;·&nbsp; ')}` : ''}${unsub}</td></tr>`
}

function buildPreviewHtml(blocks) {
  const preheader = blocks.find(b => b.type === 'preheader')
  const header = blocks.find(b => b.type === 'header-scuro')
  const footer = blocks.find(b => b.type === 'footer-ricco')
  const content = blocks.filter(b => !LAYOUT_TYPES.has(b.type))
  const marketing = Boolean(header || footer || content.some(b => b.type === 'hero'))

  if (!marketing) {
    const body = content.map(b => renderBlockHtml(b)).join('\n')
    return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;background:${CBG};font-family:${FONT_STACK};">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid ${CG};">
<tr><td style="padding:32px 32px 16px;font-family:${FONT_STACK};">
<img src="${LOGO_URL}" alt="Boogie Bistrot" width="60" style="display:block;margin:0 auto 12px;border:0;">
${body}
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid ${CLINE};">
<p style="font-size:11px;color:${CFOOT};margin:0;line-height:1.7;">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</p>
</td></tr>
</table></td></tr></table></body></html>`
  }

  // Layout marketing: 600px, header/footer strutturali, hero full-bleed
  const rows = []
  if (header) rows.push(renderHeaderScuro(header))
  for (const b of content) {
    if (b.type === 'hero') {
      rows.push(`<tr><td style="padding:0;font-family:${FONT_STACK};">${renderBlockHtml(b)}</td></tr>`)
    } else {
      rows.push(`<tr><td style="padding:16px 32px 0;font-family:${FONT_STACK};">${renderBlockHtml(b)}</td></tr>`)
    }
  }
  // padding bottom before footer
  rows.push(`<tr><td style="padding:8px 0 0;"></td></tr>`)
  rows.push(footer ? renderFooterRicco(footer) : `<tr><td align="center" style="padding:22px 32px;background:#eece9d;font-size:12px;color:${CD};text-align:center;font-family:${FONT_STACK};">Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)</td></tr>`)

  const pre = preheader?.testo
    ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader.testo}</div>`
    : ''

  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;background:#f2ede4;font-family:${FONT_STACK};">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;max-width:600px;width:100%;border-radius:6px;overflow:hidden;">
${rows.join('\n')}
</table></td></tr></table></body></html>`
}

/** Scarica la newsletter come PDF su una sola pagina A4. */
async function exportNewsletterPdf(html, titolo) {
  const safeTitle = (titolo || 'Newsletter Boogie').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Newsletter-Boogie'

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Esporta PDF newsletter')
  iframe.style.cssText = 'position:fixed;left:-12000px;top:0;width:620px;height:1200px;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)

  const cleanup = () => {
    try { iframe.remove() } catch { /* ignore */ }
  }

  try {
    const doc = iframe.contentDocument
    doc.open()
    doc.write(html)
    doc.title = safeTitle
    doc.close()

    await new Promise((resolve) => {
      if (iframe.contentDocument?.readyState === 'complete') setTimeout(resolve, 80)
      else iframe.onload = () => resolve()
      setTimeout(resolve, 2500)
    })

    const images = [...(doc.images || [])]
    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
    }))
    if (doc.fonts?.ready) {
      try { await doc.fonts.ready } catch { /* ignore */ }
    }
    await new Promise((r) => setTimeout(r, 400))

    // Altezza iframe = contenuto intero (evita ritagli)
    const fullH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 800)
    iframe.style.height = `${fullH + 40}px`
    await new Promise((r) => setTimeout(r, 100))

    // Cattura la card email (600px), non il body con padding esterno
    const target =
      doc.querySelector('table[width="600"]') ||
      doc.querySelector('table[width="520"]') ||
      doc.body

    const dataUrl = await toJpeg(target, {
      quality: 0.93,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
    })

    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Immagine PDF non valida'))
      img.src = dataUrl
    })

    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    if (!imgW || !imgH) throw new Error('Dimensioni cattura non valide')

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    const pageW = pdf.internal.pageSize.getWidth()  // 210
    const pageH = pdf.internal.pageSize.getHeight() // 297
    const margin = 8
    const maxW = pageW - margin * 2
    const maxH = pageH - margin * 2

    // Fit contain: scala in base al lato che limita di più
    const ratio = Math.min(maxW / imgW, maxH / imgH)
    const drawW = imgW * ratio
    const drawH = imgH * ratio
    const x = (pageW - drawW) / 2
    const y = (pageH - drawH) / 2

    pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'MEDIUM')
    pdf.save(`${safeTitle}.pdf`)
  } catch (err) {
    console.warn('PDF cattura fallita, fallback stampa:', err)
    cleanup()
    await exportNewsletterPdfPrint(html, safeTitle)
    return
  } finally {
    cleanup()
  }
}

/** Fallback stampa: zoom Chrome per far entrare tutto in 1 pagina. */
async function exportNewsletterPdfPrint(html, titolo) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Stampa newsletter')
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:100vh;border:0;opacity:0;pointer-events:none;z-index:-1'
  document.body.appendChild(iframe)

  const printCss = `
<style>
  @page { size: A4 portrait; margin: 8mm; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
</style>`
  const fullHtml = html.includes('</head>')
    ? html.replace('</head>', `${printCss}</head>`)
    : `${printCss}${html}`

  const doc = iframe.contentDocument
  doc.open()
  doc.write(fullHtml)
  doc.title = titolo || 'Newsletter Boogie'
  doc.close()

  await new Promise((resolve) => {
    if (iframe.contentDocument?.readyState === 'complete') setTimeout(resolve, 80)
    else iframe.onload = () => resolve()
    setTimeout(resolve, 2000)
  })

  const images = [...(doc.images || [])]
  await Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve()
    return new Promise((resolve) => {
      img.onload = resolve
      img.onerror = resolve
    })
  }))
  await new Promise((r) => setTimeout(r, 300))

  try {
    // ~A4 printable area in CSS px @96dpi (210-16mm ≈ 194mm, 297-16mm ≈ 281mm)
    const maxW = 194 * (96 / 25.4)
    const maxH = 281 * (96 / 25.4)
    const w = Math.max(doc.body.scrollWidth, 600)
    const h = Math.max(doc.body.scrollHeight, 400)
    const zoom = Math.min(1, maxW / w, maxH / h)
    doc.body.style.zoom = String(zoom)
  } catch { /* ignore */ }

  await new Promise((r) => setTimeout(r, 150))

  try {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  } finally {
    setTimeout(() => iframe.remove(), 2000)
  }
}

// ─── Badge stato ──────────────────────────────────────────────────────────────

function StatoBadge({ stato }) {
  const cfg = STATI_BADGE[stato] || STATI_BADGE['Bozza']
  return (
    <span className={styles.statoBadge} style={{ color: cfg.color, borderColor: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── Editor singolo blocco ────────────────────────────────────────────────────

function BlockEditor({ block, onChange }) {
  const [mostraMedia, setMostraMedia] = useState(false)
  const [mediaSlot, setMediaSlot] = useState(null)
  function set(key, val) { onChange({ ...block, [key]: val }) }

  function setMosaicoSlot(idx, patch) {
    const imgs = Array.from({ length: 4 }, (_, i) => ({
      url: '', alt: '', link: '',
      ...((block.immagini && block.immagini[i]) || {}),
    }))
    imgs[idx] = { ...imgs[idx], ...patch }
    onChange({ ...block, immagini: imgs })
  }

  switch (block.type) {
    case 'preheader':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo anteprima inbox (preheader)</label>
          <input className={styles.fieldInput} value={block.testo || ''} onChange={e => set('testo', e.target.value)} placeholder="Testo corto che appare nella preview della mail…" />
          <p className={styles.separatorNote}>Nascosto nel corpo: lo vedono i client email nell’anteprima.</p>
        </div>
      )
    case 'header-scuro':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>URL logo (su sfondo oro)</label>
          <input className={styles.fieldInput} value={block.logoUrl || ''} onChange={e => set('logoUrl', e.target.value)} placeholder={LOGO_DARK} />
          <label className={styles.fieldLabel}>Indirizzo</label>
          <input
            className={styles.fieldInput}
            value={block.indirizzo ?? 'Via Europa, 2 — Colle Brianza (LC)'}
            onChange={e => set('indirizzo', e.target.value)}
            placeholder="Via Europa, 2 — Colle Brianza (LC)"
          />
          <p className={styles.separatorNote}>Barra oro sito (#eece9d). Logo scuro + indirizzo sotto.</p>
        </div>
      )
    case 'hero':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Immagine hero (full width)</label>
          <div className={styles.imgRow}>
            <input className={styles.fieldInput} value={block.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." />
            <button className="btn-secondary" type="button" onClick={() => setMostraMedia(true)}>
              <Images size={15} /> Libreria
            </button>
          </div>
          {block.url && <img src={block.url} alt={block.alt || ''} className={styles.imgPreview} />}
          <label className={styles.fieldLabel}>Testo alternativo (alt)</label>
          <input className={styles.fieldInput} value={block.alt || ''} onChange={e => set('alt', e.target.value)} />
          <label className={styles.fieldLabel}>Link (opzionale)</label>
          <input className={styles.fieldInput} value={block.link || ''} onChange={e => set('link', e.target.value)} placeholder="https://boogiebistrot.com" />
          {mostraMedia && (
            <MediaLibraryModal
              onSelect={m => { onChange({ ...block, url: m.url, alt: m.alt || m.nome }); setMostraMedia(false) }}
              onClose={() => setMostraMedia(false)}
            />
          )}
        </div>
      )
    case 'intestazione':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo <span className={styles.hint}>(usa {'{nome}'} per il nome)</span></label>
          <input className={styles.fieldInput} value={block.testo || ''} onChange={e => set('testo', e.target.value)} placeholder="Ciao {nome}," />
        </div>
      )
    case 'intestazione-piccola':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo sottotitolo</label>
          <input className={styles.fieldInput} value={block.testo || ''} onChange={e => set('testo', e.target.value)} placeholder="Sottotitolo sezione" />
        </div>
      )
    case 'testo':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Contenuto <span className={styles.hint}>(usa {'{nome}'} per il nome)</span></label>
          <textarea className={styles.fieldTextarea} value={block.contenuto || ''} onChange={e => set('contenuto', e.target.value)} rows={5} placeholder="Scrivi il tuo messaggio..." />
        </div>
      )
    case 'immagine':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Immagine</label>
          <div className={styles.imgRow}>
            <input className={styles.fieldInput} value={block.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." />
            <button className="btn-secondary" type="button" onClick={() => setMostraMedia(true)}>
              <Images size={15} /> Libreria
            </button>
          </div>
          {block.url && (
            <img src={block.url} alt={block.alt || ''} className={styles.imgPreview} />
          )}
          <label className={styles.fieldLabel}>Testo alternativo (alt)</label>
          <input className={styles.fieldInput} value={block.alt || ''} onChange={e => set('alt', e.target.value)} placeholder="Descrizione immagine" />
          <label className={styles.fieldLabel}>Link (opzionale)</label>
          <input className={styles.fieldInput} value={block.link || ''} onChange={e => set('link', e.target.value)} placeholder="https://boogiebistrot.com" />
          {mostraMedia && (
            <MediaLibraryModal
              onSelect={m => { onChange({ ...block, url: m.url, alt: m.alt || m.nome }); setMostraMedia(false) }}
              onClose={() => setMostraMedia(false)}
            />
          )}
        </div>
      )
    case 'mosaico': {
      const slots = Array.from({ length: 4 }, (_, i) => ({
        url: '', alt: '', link: '',
        ...((block.immagini && block.immagini[i]) || {}),
      }))
      return (
        <div className={styles.blockFields}>
          <p className={styles.separatorNote}>Griglia 2×2. Scegli 4 foto dalla libreria o inserisci URL.</p>
          <div className={styles.mosaicEditor}>
            {slots.map((slot, idx) => (
              <div key={idx} className={styles.mosaicSlot}>
                <div className={styles.mosaicSlotHead}>Foto {idx + 1}</div>
                {slot.url
                  ? <img src={slot.url} alt={slot.alt || ''} className={styles.mosaicThumb} />
                  : <div className={styles.mosaicEmpty}>—</div>}
                <div className={styles.imgRow}>
                  <input
                    className={styles.fieldInput}
                    value={slot.url || ''}
                    onChange={e => setMosaicoSlot(idx, { url: e.target.value })}
                    placeholder="https://..."
                  />
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => { setMediaSlot(idx); setMostraMedia(true) }}
                  >
                    <Images size={15} />
                  </button>
                </div>
                <input
                  className={styles.fieldInput}
                  value={slot.link || ''}
                  onChange={e => setMosaicoSlot(idx, { link: e.target.value })}
                  placeholder="Link (opz.)"
                />
              </div>
            ))}
          </div>
          {mostraMedia && mediaSlot != null && (
            <MediaLibraryModal
              onSelect={m => {
                setMosaicoSlot(mediaSlot, { url: m.url, alt: m.alt || m.nome || '' })
                setMostraMedia(false)
                setMediaSlot(null)
              }}
              onClose={() => { setMostraMedia(false); setMediaSlot(null) }}
            />
          )}
        </div>
      )
    }
    case 'evidenza':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo in evidenza <span className={styles.hint}>(usa {'{nome}'} per il nome)</span></label>
          <textarea className={styles.fieldTextarea} value={block.contenuto || ''} onChange={e => set('contenuto', e.target.value)} rows={3} placeholder="Offerta speciale, informazione importante..." />
        </div>
      )
    case 'lista':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Voci <span className={styles.hint}>(una per riga — ogni voce diventa un riquadro)</span></label>
          <textarea className={styles.fieldTextarea} value={block.voci || ''} onChange={e => set('voci', e.target.value)} rows={5} placeholder={'Prima voce\nSeconda voce\nTerza voce'} />
        </div>
      )
    case 'box-4':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>4 box <span className={styles.hint}>(una voce per riga, max 4 — usa “Titolo — descrizione”)</span></label>
          <textarea
            className={styles.fieldTextarea}
            value={block.voci || ''}
            onChange={e => set('voci', e.target.value)}
            rows={5}
            placeholder={'Sala esclusiva — spazi riservati\nAmpio giardino — aperitivi\nLocation storica — Brianza\nMenu personalizzati — su misura'}
          />
        </div>
      )
    case 'pulsante':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo pulsante</label>
          <input className={styles.fieldInput} value={block.testo || ''} onChange={e => set('testo', e.target.value)} placeholder="Scopri di più" />
          <label className={styles.fieldLabel}>URL destinazione</label>
          <input className={styles.fieldInput} value={block.href || ''} onChange={e => set('href', e.target.value)} placeholder="https://boogiebistrot.com" />
          <label className={styles.fieldLabel}>Stile</label>
          <select className={styles.fieldSelect} value={block.stile || 'brand'} onChange={e => set('stile', e.target.value)}>
            <option value="brand">Oro (principale)</option>
            <option value="dark">Scuro</option>
            <option value="light">Chiaro</option>
          </select>
        </div>
      )
    case 'contatti-diretti':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo intro</label>
          <input className={styles.fieldInput} value={block.testo || ''} onChange={e => set('testo', e.target.value)} />
          <label className={styles.fieldLabel}>Sito</label>
          <input className={styles.fieldInput} value={block.sito || ''} onChange={e => set('sito', e.target.value)} placeholder="https://boogiebistrot.com" />
          <label className={styles.fieldLabel}>Email</label>
          <input className={styles.fieldInput} value={block.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@boogiebistrot.com" />
          <label className={styles.fieldLabel}>Telefono</label>
          <input className={styles.fieldInput} value={block.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+39 039 9260568" />
        </div>
      )
    case 'footer-ricco':
      return (
        <div className={styles.blockFields}>
          <label className={styles.fieldLabel}>Testo footer <span className={styles.hint}>(una riga = un a capo)</span></label>
          <textarea className={styles.fieldTextarea} value={block.testo || ''} onChange={e => set('testo', e.target.value)} rows={3} />
          <label className={styles.fieldLabel}>Sito</label>
          <input className={styles.fieldInput} value={block.sito || ''} onChange={e => set('sito', e.target.value)} />
          <label className={styles.fieldLabel}>Instagram</label>
          <input className={styles.fieldInput} value={block.instagram || ''} onChange={e => set('instagram', e.target.value)} />
          <label className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={block.unsubscribe !== false} onChange={e => set('unsubscribe', e.target.checked)} />
            Mostra link “Non vuoi più ricevere comunicazioni?” (Brevo)
          </label>
        </div>
      )
    case 'separatore':
      return <p className={styles.separatorNote}>Linea di separazione orizzontale.</p>
    default:
      return null
  }
}

// ─── Menu aggiungi blocco ─────────────────────────────────────────────────────

function AddBlockMenu({ blocks, onAdd }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(type) {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div className={styles.addBlockWrap} ref={wrapRef}>
      <button
        type="button"
        className={`btn-primary ${styles.addBlockBtn}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <Plus size={14} /> Aggiungi blocco <CaretDown size={12} />
      </button>
      {open && (
        <div className={styles.addBlockMenu} role="menu">
          {BLOCK_GROUPS.map(g => {
            const items = BLOCK_TYPES.filter(t => t.group === g.id)
            return (
              <div key={g.id} className={styles.addBlockGroup}>
                <div className={styles.addBlockGroupLabel}>{g.label}</div>
                {items.map(({ type, label, Icon }) => {
                  const taken = LAYOUT_TYPES.has(type) && blocks.some(b => b.type === type)
                  return (
                    <button
                      key={type}
                      type="button"
                      role="menuitem"
                      className={styles.addBlockItem}
                      onClick={() => pick(type)}
                      title={taken ? 'Già presente — apre il blocco esistente' : label}
                    >
                      <Icon size={15} />
                      <span className={styles.addBlockItemLabel}>{label}</span>
                      {taken && <span className={styles.addBlockTaken}>già usato</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab Campagna (info + template uniti) ─────────────────────────────────────

function CampagnaTab({ campagna, onSaved, onContinuaAvvio }) {
  const [form, setForm] = useState({
    titolo:      campagna.titolo,
    oggettoMail: campagna.oggettoMail,
    stato:       campagna.stato,
  })
  const [blocks, setBlocks] = useState(() => {
    try { return JSON.parse(campagna.template || '[]').map(b => ({ ...b, _id: uid() })) }
    catch { return [] }
  })
  const [saving, setSaving] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function addBlock(type) {
    if (LAYOUT_TYPES.has(type) && blocks.some(b => b.type === type)) {
      const existing = blocks.find(b => b.type === type)
      setContentOpen(true)
      setExpandedId(existing._id)
      return
    }
    const b = { ...DEFAULT_BLOCKS[type], _id: uid() }
    setBlocks(prev => [...prev, b])
    setContentOpen(true)
    setExpandedId(b._id)
  }

  function updateBlock(id, updated) {
    setBlocks(prev => prev.map(b => b._id === id ? { ...updated, _id: id } : b))
  }

  function removeBlock(id) {
    setBlocks(prev => prev.filter(b => b._id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function moveBlock(id, dir) {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b._id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  async function salvaTutto() {
    setSaving(true)
    try {
      const clean = blocks.map(({ _id, ...b }) => b)
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tipo: 'campagna',
          id: campagna.id,
          titolo: form.titolo,
          oggettoMail: form.oggettoMail,
          stato: form.stato,
          template: clean,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSaved(data.campagna)
    } catch (e) {
      alert('Errore salvataggio: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const cleanBlocks = blocks.map(({ _id, ...b }) => b)

  async function scaricaPdf() {
    setExportingPdf(true)
    try {
      await exportNewsletterPdf(buildPreviewHtml(cleanBlocks), form.titolo || form.oggettoMail)
    } catch (e) {
      alert('Errore esportazione PDF: ' + (e.message || e))
    } finally {
      setExportingPdf(false)
    }
  }

  function blockSnippet(b) {
    if (b.type === 'mosaico') {
      const n = (b.immagini || []).filter(x => x?.url).length
      return n ? `${n}/4 foto` : '4 foto'
    }
    if (b.testo) return b.testo
    if (b.contenuto) return b.contenuto
    if (b.voci) return b.voci.split('\n')[0]
    if (b.url) return b.url.replace(/^https?:\/\//, '').slice(0, 40)
    if (b.logoUrl || b.type === 'header-scuro') return b.indirizzo || 'logo'
    if (b.href) return b.testo || b.href
    if (b.type === 'separatore') return '—'
    return ''
  }

  return (
    <div className={styles.campagnaLayout}>
      <div className={styles.campagnaEditor}>
        <ProgressoCampagna campagnaId={campagna.id} />

        <div className={styles.editorTopBar}>
          <div className={styles.editorTopFields}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Oggetto email</label>
              <input
                className={styles.fieldInput}
                value={form.oggettoMail}
                onChange={e => setField('oggettoMail', e.target.value)}
                placeholder="Es: La cena di Natale della tua azienda"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.editorStato}`}>
              <label className={styles.fieldLabel}>Stato</label>
              <select className={styles.fieldSelect} value={form.stato} onChange={e => setField('stato', e.target.value)}>
                {STATI_CAMPAGNA.map(s => <option key={s} value={s}>{STATI_BADGE[s]?.label || s}</option>)}
              </select>
            </div>
          </div>
          <button className={`btn-primary ${styles.editorActionBtn}`} onClick={salvaTutto} disabled={saving}>
            <FloppyDisk size={15} /> {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>

        <div className={styles.settingsPanel}>
          <button
            type="button"
            className={styles.settingsToggle}
            onClick={() => setSettingsOpen(o => !o)}
            aria-expanded={settingsOpen}
          >
            <GearSix size={14} />
            <span>Impostazioni campagna</span>
            <span className={`${styles.settingsCaret} ${settingsOpen ? styles.caretOpen : ''}`}>
              <CaretDown size={12} />
            </span>
          </button>
          {settingsOpen && (
            <div className={styles.settingsBody}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Nome campagna</label>
                <input
                  className={styles.fieldInput}
                  value={form.titolo}
                  onChange={e => setField('titolo', e.target.value)}
                />
              </div>
              <p className={styles.editorHint}>
                Invio: prime 250 subito all’avvio, poi max 250/giorno alle 10:00.
                Quando la grafica è pronta, passa allo step <strong>Avvio</strong>.
              </p>
            </div>
          )}
        </div>

        <div className={styles.settingsPanel}>
          <button
            type="button"
            className={styles.settingsToggle}
            onClick={() => setContentOpen(o => !o)}
            aria-expanded={contentOpen}
          >
            <EnvelopeSimple size={14} />
            <span>Contenuto email</span>
            {blocks.length > 0 && (
              <span className={styles.contentCount}>{blocks.length} blocchi</span>
            )}
            <span className={`${styles.settingsCaret} ${contentOpen ? styles.caretOpen : ''}`}>
              <CaretDown size={12} />
            </span>
          </button>
          {contentOpen && (
            <div className={styles.contentAccordionBody}>
              <div className={styles.templateHeaderRow}>
                <span className={styles.contentAccordionHint}>Modifica i blocchi della mail</span>
                <AddBlockMenu blocks={blocks} onAdd={addBlock} />
              </div>
              <div className={styles.blockList}>
                {blocks.length === 0 && (
                  <p className={styles.emptyBlocks}>
                    Nessun blocco. Aggiungi Header e Hero per iniziare.
                  </p>
                )}
                {blocks.map((b, idx) => {
                  const cfg = BLOCK_TYPES.find(t => t.type === b.type)
                  const Icon = cfg?.Icon || TextT
                  const isOpen = expandedId === b._id
                  const isLayout = LAYOUT_TYPES.has(b.type)
                  const snip = blockSnippet(b)
                  return (
                    <div key={b._id} className={`${styles.blockCard} ${isOpen ? styles.blockCardOpen : ''}`}>
                      <div className={styles.blockHeader} onClick={() => setExpandedId(isOpen ? null : b._id)}>
                        <div className={styles.blockTitleCol}>
                          <span className={styles.blockIcon}><Icon size={14} /></span>
                          <span className={styles.blockType}>{cfg?.label || b.type}</span>
                          {isLayout && <span className={styles.blockBadge}>Struttura</span>}
                          {!isOpen && snip && (
                            <span className={styles.blockSnippet}>{snip}</span>
                          )}
                        </div>
                        <div className={styles.blockActions} onClick={e => e.stopPropagation()}>
                          <button className="btn-icon btn-sm" title="Su" type="button" onClick={() => moveBlock(b._id, -1)} disabled={idx === 0}>
                            <ArrowUp size={12} />
                          </button>
                          <button className="btn-icon btn-sm" title="Giù" type="button" onClick={() => moveBlock(b._id, 1)} disabled={idx === blocks.length - 1}>
                            <ArrowDown size={12} />
                          </button>
                          <button className="btn-icon btn-sm danger" title="Rimuovi" type="button" onClick={() => removeBlock(b._id)}>
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className={styles.blockBody}>
                          <BlockEditor block={b} onChange={updated => updateBlock(b._id, updated)} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {onContinuaAvvio && (
          <div className={styles.stepFooter}>
            <button type="button" className="btn-primary" onClick={onContinuaAvvio}>
              Continua all’avvio <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      <aside className={styles.previewSticky}>
        <div className={styles.previewStickyInner}>
          <div className={styles.previewStickyHead}>
            <Eye size={14} />
            <span>Anteprima live</span>
            <button
              type="button"
              className={styles.pdfBtn}
              onClick={scaricaPdf}
              disabled={exportingPdf || cleanBlocks.length === 0}
              title="Scarica la newsletter in PDF per l’approvazione"
            >
              <FilePdf size={14} weight="fill" />
              {exportingPdf ? 'Preparazione…' : 'Scarica PDF'}
            </button>
          </div>
          <iframe
            className={styles.previewIframeSticky}
            title="Anteprima email"
            srcDoc={buildPreviewHtml(cleanBlocks)}
            sandbox="allow-same-origin"
          />
        </div>
      </aside>
    </div>
  )
}

// ─── Step 2: Avvio (contatti + stima + avvia) ─────────────────────────────────

function AvvioStep({ campagna, onCampagnaUpdate, onTornaGrafica }) {
  const [stats, setStats] = useState(null)
  const [countGlobali, setCountGlobali] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, globRes] = await Promise.all([
        authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=${campagna.id}`),
        authFetch('/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=global'),
      ])
      const campData = await campRes.json()
      const globData = await globRes.json()
      if (campData.success) setStats(campData.stats)
      if (globData.success) setCountGlobali(globData.stats.totale)
    } finally {
      setLoading(false)
    }
  }, [campagna.id])

  useEffect(() => { load() }, [load])

  const inCoda = stats?.DaInviare ?? 0
  const giaInCampagna = stats?.totale ?? 0
  const destinatariStimati = inCoda > 0 ? inCoda : (countGlobali ?? 0)
  const giorniStimati = destinatariStimati > 0 ? Math.ceil(destinatariStimati / 250) : 0
  const attiva = campagna.stato === 'InCorso' || campagna.stato === 'Programmata'

  return (
    <div className={styles.avvioStep}>
      <button type="button" className={`btn-ghost ${styles.backStep}`} onClick={onTornaGrafica}>
        <ArrowLeft size={15} /> Torna alla grafica
      </button>

      <div className={styles.avvioSummary}>
        <h3 className={styles.avvioTitle}>Pronto per l’invio?</h3>
        <p className={styles.avvioLead}>
          Oggetto: <strong>{campagna.oggettoMail || '— (manca oggetto)'}</strong>
        </p>
      </div>

      {loading ? (
        <p className={styles.loading}>Caricamento...</p>
      ) : (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{countGlobali ?? 0}</span>
            <span className={styles.statLabel}>Lista globale</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{destinatariStimati}</span>
            <span className={styles.statLabel}>Da raggiungere</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{giorniStimati || '—'}</span>
            <span className={styles.statLabel}>
              {giorniStimati === 1 ? 'Giorno stimato' : 'Giorni stimati'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>250</span>
            <span className={styles.statLabel}>Max / giorno</span>
          </div>
        </div>
      )}

      <div className={styles.avvioNote}>
        <p>
          All’avvio i contatti della <strong>lista globale</strong> vengono copiati in questa campagna:
          le <strong>prime 250 partono subito</strong>, le altre a 250 al giorno alle 10:00.
          {countGlobali === 0 && (
            <> La lista è vuota: aggiungili dalla scheda <strong>Contatti</strong> in home Email Marketing.</>
          )}
        </p>
      </div>

      <AvviaCampagnaBox
        campagna={campagna}
        onAvviata={(updated) => {
          load()
          if (updated) onCampagnaUpdate?.(updated)
        }}
      />

      {giaInCampagna > 0 && (
        <>
          <ProgressoCampagna campagnaId={campagna.id} />
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: 'var(--success)' }}>{stats?.Inviato || 0}</span>
              <span className={styles.statLabel}>Inviati</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: 'var(--accent)' }}>{inCoda}</span>
              <span className={styles.statLabel}>In coda</span>
            </div>
            {(stats?.Errore || 0) > 0 && (
              <div className={styles.statCard}>
                <span className={styles.statNum} style={{ color: 'var(--danger)' }}>{stats.Errore}</span>
                <span className={styles.statLabel}>Errori</span>
              </div>
            )}
            {attiva && stats?.oggiDaInviare > 0 && (
              <div className={`${styles.statCard} ${styles.statCardOggi}`}>
                <span className={styles.statNum}>{stats.oggiDaInviare}</span>
                <span className={styles.statLabel}>Oggi</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Avvia campagna (copia globali + schedule + InCorso) ─────────────────────

function AvviaCampagnaBox({ campagna, onAvviata }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [countGlobali, setCountGlobali] = useState(null)
  const attiva = campagna.stato === 'InCorso' || campagna.stato === 'Programmata'

  useEffect(() => {
    authFetch('/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=global')
      .then(r => r.json())
      .then(d => { if (d.success) setCountGlobali(d.stats.totale) })
  }, [])

  async function avvia() {
    const n = countGlobali ?? '?'
    if (!confirm(
      `Avviare la campagna?\n\n` +
      `• Copia i contatti dalla lista globale\n` +
      `• Invia subito le prime ~250 email\n` +
      `• Dal giorno dopo: max 250/giorno alle 10:00\n\n` +
      `Contatti in lista globale: ${n}`
    )) return

    setBusy(true)
    setMsg(null)
    try {
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'avvia-campagna', campagnaId: campagna.id, maxPerGiorno: 250 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      onAvviata?.(data.campagna)

      if (data.stato === 'Completata') {
        setMsg({ tipo: 'ok', testo: 'Nessun contatto da inviare — campagna completata.' })
        return
      }

      if (data.invioTrigger && !data.invioTrigger.ok) {
        setMsg({
          tipo: 'err',
          testo: `Campagna in coda, ma primo invio fallito: ${data.invioTrigger.error}. Prova «Invia lotto di oggi».`,
        })
        return
      }

      // Continua i chunk fino a ~250 di oggi
      setMsg({ tipo: 'ok', testo: 'Campagna avviata. Invio del primo lotto in corso…' })
      const inv = await inviaLottoOra(false)
      if (!inv.ok) {
        setMsg({
          tipo: 'err',
          testo: `Primo lotto incompleto: ${inv.error || 'errore'}. Usa «Invia lotto di oggi».`,
        })
      }
      onAvviata?.(data.campagna)
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
    } finally {
      setBusy(false)
    }
  }

  /** Invia fino a 250 email di oggi a chunk da 25 via gestisci (HTTP, non cron). */
  async function inviaLottoOra(confirmFirst = true) {
    if (confirmFirst && !confirm('Inviare ora fino a 250 email in coda per oggi?')) {
      return { ok: false, error: 'annullato' }
    }
    setBusy(true)
    setMsg({ tipo: 'ok', testo: 'Invio in corso…' })
    try {
      let inviati = 0
      let errori = 0
      let lastErr = null
      const TARGET = 250
      for (let i = 0; i < 12; i++) {
        const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ tipo: 'invia-lotto-ora', campagnaId: campagna.id, limit: 25 }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) {
          lastErr = data.error || `HTTP ${res.status}`
          if (i === 0 && inviati === 0) {
            setMsg({ tipo: 'err', testo: `Invio non partito: ${lastErr}` })
            return { ok: false, error: lastErr }
          }
          // Chunk fallito a metà strada: tieni quanto già inviato e segnala
          break
        }
        const chunkInviati = data.inviati || 0
        const chunkErrori = data.errori || 0
        const processed = chunkInviati + chunkErrori
        inviati += chunkInviati
        errori += chunkErrori
        setMsg({
          tipo: 'ok',
          testo: `Invio in corso… ${inviati} inviate` + (errori ? `, ${errori} errori` : '') +
            ` (obiettivo oggi ${TARGET})`,
        })
        // Nessun contatto processato → coda di oggi vuota
        if (processed === 0) break
        // Chunk parziale → non ci sono altre 25 in coda per oggi
        if (processed < 25) break
        // Raggiunto tetto giornaliero di questa sessione
        if (inviati + errori >= TARGET) break
      }
      if (inviati === 0 && errori === 0) {
        const msg = lastErr || 'Nessuna email da inviare per oggi (già inviate o data non dovuta).'
        setMsg({ tipo: 'err', testo: msg })
        return { ok: false, error: msg }
      }
      setMsg({
        tipo: inviati > 0 ? 'ok' : 'err',
        testo: `Fatto: ${inviati} email inviate` + (errori ? ` (${errori} errori)` : '') +
          (lastErr ? ` — ultimo errore chunk: ${lastErr}` : '') +
          '. Se restano email per oggi, ripremi «Invia lotto di oggi».',
      })
      onAvviata?.(campagna)
      return { ok: inviati > 0, inviati, errori }
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
      return { ok: false, error: e.message }
    } finally {
      setBusy(false)
    }
  }

  async function mettiInPausa() {
    if (!confirm('Mettere la campagna in pausa? Il cron non invierà altre email finché non la riavvii.')) return
    setBusy(true)
    try {
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'campagna', id: campagna.id, stato: 'Pausa' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMsg({ tipo: 'ok', testo: 'Campagna in pausa.' })
      onAvviata?.(data.campagna)
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.avviaBox}>
      <div className={styles.avviaMain}>
        <div>
          <h3 className={styles.importTitle}>
            {attiva ? 'Campagna attiva' : 'Avvio invii'}
          </h3>
          <p className={styles.importHint}>
            Max <strong>250 email/giorno</strong> (condivisi tra tutte le campagne).
            {countGlobali != null && (
              <> Lista globale: <strong>{countGlobali}</strong> contatti
                {countGlobali > 0 && <> → ~{Math.ceil(countGlobali / 250)} giorni</>}
              </>
            )}
            . All’avvio le prime 250 partono subito; dal giorno dopo alle 10:00.
          </p>
        </div>
        <div className={styles.avviaActions}>
          {attiva ? (
            <>
              <button type="button" className="btn-primary" onClick={() => inviaLottoOra(true)} disabled={busy}>
                <Play size={15} /> {busy ? 'Invio…' : 'Invia lotto di oggi'}
              </button>
              <button type="button" className="btn-secondary" onClick={mettiInPausa} disabled={busy}>
                <Pause size={15} /> {busy ? '...' : 'Pausa'}
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={avvia} disabled={busy}>
              <Play size={15} /> {busy ? 'Avvio...' : 'Avvia campagna'}
            </button>
          )}
        </div>
      </div>
      {msg && (
        <p className={msg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>{msg.testo}</p>
      )}
    </div>
  )
}

// ─── Lista contatti globali (home) ────────────────────────────────────────────

function ContattiGlobali() {
  const [contatti, setContatti]       = useState([])
  const [totale, setTotale]           = useState(0)
  const [nextCursor, setNextCursor]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [csvText, setCsvText]         = useState('')
  const [importing, setImporting]     = useState(false)
  const [importMsg, setImportMsg]     = useState(null)

  const loadAll = useCallback(async (cursor = null, replace = true) => {
    if (replace) setLoading(true); else setLoadingMore(true)
    try {
      const url = `/.netlify/functions/gestisci-campagne-mail?tipo=contatti&campagnaId=global${cursor ? '&cursor=' + cursor : ''}`
      const [contattiRes, statsRes] = await Promise.all([
        authFetch(url),
        replace ? authFetch('/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=global') : Promise.resolve(null),
      ])
      const contattiData = await contattiRes.json()
      if (contattiData.success) {
        setContatti(prev => replace ? contattiData.contatti : [...prev, ...contattiData.contatti])
        setNextCursor(contattiData.nextCursor || null)
      }
      if (statsRes) {
        const statsData = await statsRes.json()
        if (statsData.success) setTotale(statsData.stats.totale)
      }
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleImport() {
    const { contatti, scartati } = parseContattiCsv(csvText)
    if (!contatti.length) {
      setImportMsg({ tipo: 'errore', testo: 'Nessuna email valida. Usa il CSV con header Nome,Indirizzo,Sito Web,Email,Distanza (km),Ambito' })
      return
    }
    setImporting(true); setImportMsg(null)
    try {
      const res  = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'importa-contatti', campagnaId: 'global', contatti, maxPerGiorno: 99999 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      const extra = (data.scartati || scartati) ? ` (${data.scartati || scartati} scartati/duplicati)` : ''
      setImportMsg({ tipo: 'ok', testo: `${data.importati} contatti aggiunti alla lista${extra}.` })
      setCsvText('')
      await loadAll()
    } catch (e) {
      setImportMsg({ tipo: 'errore', testo: e.message })
    } finally {
      setImporting(false)
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsvText(String(reader.result || ''))
    reader.readAsText(file)
    e.target.value = ''
  }

  async function eliminaContatto(id) {
    if (!confirm('Rimuovere questo contatto dalla lista globale?')) return
    await authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=contatto&id=${id}`, { method: 'DELETE' })
    setContatti(prev => prev.filter(c => c.id !== id))
    setTotale(prev => prev - 1)
  }

  return (
    <div>
      <div className={styles.importBox}>
        <h3 className={styles.importTitle}>
          <UploadSimple size={16} /> Aggiungi contatti
        </h3>
        <p className={styles.importHint}>
          CSV: <code>Nome,Indirizzo,Sito Web,Email,Distanza (km),Ambito</code>
        </p>
        <div className={styles.importRow} style={{ marginBottom: 8 }}>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            Carica file .csv
            <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFile} style={{ display: 'none' }} />
          </label>
        </div>
        <textarea
          className={styles.csvTextarea}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={5}
          placeholder={'Nome,Indirizzo,Sito Web,Email,Distanza (km),Ambito\n...'}
        />
        <div className={styles.importRow}>
          <span />
          <button className="btn-accent" onClick={handleImport} disabled={importing || !csvText.trim()}>
            <UploadSimple size={15} /> {importing ? 'Aggiunta...' : 'Aggiungi alla lista'}
          </button>
        </div>
        {importMsg && (
          <p className={importMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
            {importMsg.testo}
          </p>
        )}
      </div>

      <div className={styles.contattiList}>
        <h3 className={styles.listTitle}>Contatti ({totale})</h3>
        {loading ? (
          <p className={styles.loading}>Caricamento...</p>
        ) : contatti.length === 0 ? (
          <p className={styles.emptyList}>Nessun contatto ancora. Aggiungi il primo lotto sopra.</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Azienda</th>
                  <th>Email</th>
                  <th>Ambito</th>
                  <th>Km</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contatti.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.contattoNome}>{c.azienda || c.nome || '—'}</div>
                      {c.indirizzo && <div className={styles.contattoAzienda}>{c.indirizzo}</div>}
                    </td>
                    <td>{c.email}</td>
                    <td>{c.ambito || '—'}</td>
                    <td>{c.distanzaKm != null ? c.distanzaKm : '—'}</td>
                    <td>
                      <button className="btn-icon btn-sm danger" onClick={() => eliminaContatto(c.id)}>
                        <Trash size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextCursor && (
              <button className="btn-secondary btn-sm" onClick={() => loadAll(nextCursor, false)} disabled={loadingMore}>
                {loadingMore ? 'Caricamento...' : 'Carica altri'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Progresso campagna ───────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProgressoCampagna({ campagnaId }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=${campagnaId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats) })
  }, [campagnaId])

  if (!stats || stats.totale === 0) return null

  const pct = stats.totale > 0 ? Math.round((stats.Inviato / stats.totale) * 100) : 0

  return (
    <div className={styles.progressBox}>
      {/* Barra */}
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBar} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.progressPct}>{pct}% completata</div>

      {/* Contatori */}
      <div className={styles.progressStats}>
        <div className={styles.progressStat}>
          <span className={styles.progressNum} style={{ color: 'var(--success)' }}>{stats.Inviato}</span>
          <span className={styles.progressLabel}>Inviati</span>
        </div>
        <div className={styles.progressStat}>
          <span className={styles.progressNum} style={{ color: 'var(--accent)' }}>{stats.DaInviare}</span>
          <span className={styles.progressLabel}>Rimanenti</span>
        </div>
        <div className={styles.progressStat}>
          <span className={styles.progressNum}>{stats.totale}</span>
          <span className={styles.progressLabel}>Totale</span>
        </div>
        {stats.Errore > 0 && (
          <div className={styles.progressStat}>
            <span className={styles.progressNum} style={{ color: 'var(--danger)' }}>{stats.Errore}</span>
            <span className={styles.progressLabel}>Errori</span>
          </div>
        )}
      </div>

      {/* Date */}
      <div className={styles.progressDate}>
        <span>Inizio: <strong>{fmt(stats.dataInizio)}</strong></span>
        <span>Fine stimata: <strong>{fmt(stats.dataFine)}</strong></span>
        {stats.giorniRimanenti > 0 && (
          <span className={styles.giorniRimanenti}>
            Ancora <strong>{stats.giorniRimanenti}</strong> {stats.giorniRimanenti === 1 ? 'giorno' : 'giorni'}
          </span>
        )}
        {stats.oggiDaInviare > 0 && (
          <span className={styles.oggiLabel}>
            Oggi: <strong>{stats.oggiDaInviare}</strong> da inviare
          </span>
        )}
      </div>
    </div>
  )
}

/** Mini progresso sulla card lista (solo campagne avviate / con contatti). */
function CardProgresso({ campagnaId, stato }) {
  const [stats, setStats] = useState(null)
  const attiva = stato === 'InCorso' || stato === 'Programmata' || stato === 'Completata' || stato === 'Pausa'

  useEffect(() => {
    if (!attiva) return
    let cancelled = false
    authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=${campagnaId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setStats(d.stats) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [campagnaId, attiva])

  if (!attiva || !stats || stats.totale === 0) return null

  const inviato = stats.Inviato || 0
  const rimanenti = stats.DaInviare || 0
  const pct = Math.round((inviato / stats.totale) * 100)

  return (
    <div className={styles.cardProgress} onClick={e => e.stopPropagation()}>
      <div className={styles.cardProgressBarWrap}>
        <div
          className={styles.cardProgressBar}
          style={{ width: `${pct}%` }}
          data-done={stato === 'Completata' ? '1' : undefined}
        />
      </div>
      <div className={styles.cardProgressMeta}>
        <span className={styles.cardProgressPct}>{pct}%</span>
        <span>{inviato}/{stats.totale} inviati</span>
        {rimanenti > 0 && <span className={styles.cardProgressRest}>{rimanenti} mancanti</span>}
        {stats.giorniRimanenti > 0 && (
          <span>~{stats.giorniRimanenti}g</span>
        )}
      </div>
    </div>
  )
}

// ─── Dettaglio campagna ───────────────────────────────────────────────────────

function DettaglioCampagna({ campagna: initialCampagna, onBack, onDeleted }) {
  const [campagna, setCampagna] = useState(initialCampagna)
  const [step, setStep] = useState(() =>
    (initialCampagna.stato === 'InCorso' || initialCampagna.stato === 'Programmata') ? 2 : 1
  )
  const [deleting, setDeleting] = useState(false)

  async function elimina() {
    if (!confirm(`Eliminare la campagna "${campagna.titolo}" e tutti i suoi contatti?`)) return
    setDeleting(true)
    try {
      const res = await authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=campagna&id=${campagna.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onDeleted(campagna.id)
    } catch (e) {
      alert('Errore eliminazione: ' + e.message)
      setDeleting(false)
    }
  }

  return (
    <div className={styles.dettaglio}>
      <div className={styles.dettaglioHeader}>
        <button className="btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Campagne
        </button>
        <div className={styles.dettaglioTitolo}>
          <h2 className={styles.pageTitle}>{campagna.titolo}</h2>
          <StatoBadge stato={campagna.stato} />
          <span className={styles.versionTagInline}>v{EMAIL_MKTG_VERSION}</span>
        </div>
        <div className={styles.dettaglioActions}>
          <button className="btn-icon danger" onClick={elimina} disabled={deleting} title="Elimina campagna">
            <Trash size={15} />
          </button>
        </div>
      </div>

      <div className={styles.stepBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={step === 1}
          className={`${styles.stepItem} ${step === 1 ? styles.stepItemActive : ''}`}
          onClick={() => setStep(1)}
        >
          <span className={styles.stepNum}>1</span>
          <span className={styles.stepLabel}>Grafica email</span>
        </button>
        <span className={styles.stepSep} aria-hidden />
        <button
          type="button"
          role="tab"
          aria-selected={step === 2}
          className={`${styles.stepItem} ${step === 2 ? styles.stepItemActive : ''}`}
          onClick={() => setStep(2)}
        >
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepLabel}>Avvio</span>
        </button>
      </div>

      {step === 1 && (
        <CampagnaTab
          campagna={campagna}
          onSaved={setCampagna}
          onContinuaAvvio={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <AvvioStep
          campagna={campagna}
          onCampagnaUpdate={updated => setCampagna(c => ({ ...c, ...updated }))}
          onTornaGrafica={() => setStep(1)}
        />
      )}
    </div>
  )
}

// ─── Lista campagne ───────────────────────────────────────────────────────────

function ListaCampagne({ onSelect }) {
  const [campagne, setCampagne] = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [homeTab, setHomeTab]   = useState('campagne')

  useEffect(() => {
    authFetch('/.netlify/functions/gestisci-campagne-mail?tipo=campagne')
      .then(r => r.json())
      .then(data => { if (data.success) setCampagne(data.campagne) })
      .finally(() => setLoading(false))
  }, [])

  async function nuovaCampagna() {
    setCreating(true)
    try {
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'campagna', titolo: 'Nuova campagna', oggettoMail: '' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCampagne(prev => [data.campagna, ...prev])
      onSelect(data.campagna)
    } catch (e) {
      alert('Errore: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Email Marketing</h1>
          <p className={styles.versionTag}>v{EMAIL_MKTG_VERSION}</p>
        </div>
        {homeTab === 'campagne' && (
          <button className="btn-outline-accent" onClick={nuovaCampagna} disabled={creating}>
            <Plus size={15} /> {creating ? 'Creazione...' : 'Nuova campagna'}
          </button>
        )}
      </div>

      {/* Tab home */}
      <div className={styles.tabs} style={{ marginBottom: '28px' }}>
        <button
          className={`btn-toggle ${homeTab === 'campagne' ? 'active' : ''}`}
          onClick={() => setHomeTab('campagne')}
        >
          <EnvelopeSimple size={14} /> Campagne
        </button>
        <button
          className={`btn-toggle ${homeTab === 'contatti' ? 'active' : ''}`}
          onClick={() => setHomeTab('contatti')}
        >
          <Users size={14} /> Contatti
        </button>
      </div>

      {homeTab === 'campagne' && (
        loading ? (
          <p className={styles.loading}>Caricamento...</p>
        ) : campagne.length === 0 ? (
          <div className={styles.empty}>
            <EnvelopeSimple size={40} weight="light" />
            <p>Nessuna campagna. Creane una per iniziare.</p>
          </div>
        ) : (
          <div className={styles.campagneGrid}>
            {campagne.map(c => (
              <div key={c.id} className={styles.campagnaCard} onClick={() => onSelect(c)}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitolo}>{c.titolo}</h3>
                  <StatoBadge stato={c.stato} />
                </div>
                {c.oggettoMail && (
                  <p className={styles.cardOggetto}>"{c.oggettoMail}"</p>
                )}
                <CardProgresso campagnaId={c.id} stato={c.stato} />
                <div className={styles.cardMeta}>
                  <span>{c.totaleInviati} inviati</span>
                  {c.dataCreazione && (
                    <span>{new Date(c.dataCreazione).toLocaleDateString('it-IT', { day:'numeric', month:'short', year:'numeric' })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {homeTab === 'contatti' && <ContattiGlobali />}
    </div>
  )
}

// ─── Panel principale ─────────────────────────────────────────────────────────

export default function EmailMarketingPanel() {
  const [campagnaSelezionata, setCampagnaSelezionata] = useState(null)

  function handleDeleted(id) {
    setCampagnaSelezionata(null)
  }

  if (campagnaSelezionata) {
    return (
      <DettaglioCampagna
        campagna={campagnaSelezionata}
        onBack={() => setCampagnaSelezionata(null)}
        onDeleted={handleDeleted}
      />
    )
  }

  return <ListaCampagne onSelect={setCampagnaSelezionata} />
}
