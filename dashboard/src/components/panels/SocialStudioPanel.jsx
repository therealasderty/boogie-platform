/**
 * SocialStudioPanel.jsx
 * Unifica Post Builder + Social Scheduler in un'unica sezione con 3 tab:
 *  1. Post Builder  — carosello editor (ex PostBuilderPanel)
 *  2. Calendario    — FullCalendar con post programmati + appuntamenti sbiaditi
 *  3. Da pubblicare — contenuti Airtable pronti per i social (ex SocialPanel)
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin  from '@fullcalendar/daygrid'
import listPlugin     from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import {
  Slideshow, Plus, ArrowLeft, Sparkle, CalendarDots,
  PaperPlaneTilt, FloppyDisk, Clock, X,
  InstagramLogo, FacebookLogo, GoogleLogo, ShareNetwork,
} from '@phosphor-icons/react'
import { authFetch }         from '../../lib/authFetch'
import { cloudinaryThumb }   from '../../lib/cloudinary'
import { useSocialPosts }    from '../../hooks/useSocialPosts'
import { usePresetSocial }  from '../../hooks/usePresetSocial'
import { useAppuntamenti }   from '../../hooks/useAppuntamenti'
import { useOrari }          from '../../hooks/useOrari'
import { useMedia }          from '../../hooks/useMedia'
import { IconRefresh, IconTrash, IconEdit } from '../../icons/index.jsx'
import { TEMPLATES } from './social/SlideTemplates.jsx'
import styles from './SocialStudioPanel.module.css'

// ─── Costanti ─────────────────────────────────────────────────────────────────

const SITO_BASE = 'https://boogiebistrot.com'

const PIATTAFORME_CONFIG = [
  { key: 'instagram', label: 'Instagram',       color: '#E1306C', Icon: InstagramLogo, requiresImg: true  },
  { key: 'facebook',  label: 'Facebook',        color: '#1877F2', Icon: FacebookLogo,  requiresImg: false },
  { key: 'google',    label: 'Google Business', color: '#4285F4', Icon: GoogleLogo,    requiresImg: false },
]

const TEMPLATE_SIZES = {
  '1:1':  { w: 1080, h: 1080 },
  '4:5':  { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
}

const PREVIEW_W = 270

const STATO_COLORI_POST = {
  Bozza:       '#7A6448',
  Programmato: '#1565C0',
  Pubblicato:  '#2E7D32',
  Errore:      '#C0392B',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function formatData(dateStr) {
  if (!dateStr) return ''
  try {
    const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function isoToLocalDateStr(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

// Converte un ISO UTC string in formato "YYYY-MM-DDTHH:MM" per input datetime-local
function isoToDatetimeLocal(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const pad = n => String(n).padStart(2, '0')
    const mins = d.getMinutes() >= 30 ? '30' : '00'
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${mins}`
  } catch { return '' }
}

// Converte il valore di datetime-local (ora locale) in ISO UTC
function datetimeLocalToIso(localStr) {
  if (!localStr) return ''
  try { return new Date(localStr).toISOString() } catch { return '' }
}

function buildSlide(template, sorgente, record) {
  const id = uid()
  const locked = !!record
  if (template === 'foto_11' || template === 'foto_45' || template === 'foto_916') {
    return { id, template, data: { imageUrl: '', mostraLogo: true } }
  }
  if (template === 'agenda_cover') {
    return {
      id,
      template,
      data: {
        titolo:         'Questa settimana',
        labelPeriodo:   '',
        sottotitolo:    'Scorri per il programma',
        imageUrl:       '',
        mostraIndirizzo: false,
      },
    }
  }
  const data = record ? fillSlideDataFromEvento(template, record, {}) : {}
  return { id, template: template || 'cover', eventoLocked: locked, data }
}

function buildAgendaEvents(appuntamenti, orari = []) {
  const aperti = orari.length > 0 ? new Set(orari.filter(o => o.attivo).map(o => o.giorno)) : null
  const BASE = { backgroundColor: 'transparent', borderColor: 'transparent', textColor: 'var(--text2)', editable: false }
  return appuntamenti.filter(a => a.stato !== 'futuro').flatMap(a => {
    const ricorrente = a.ricorrenza && a.ricorrenza !== 'nessuna'
    const base = { ...BASE, extendedProps: { isAgenda: true, ricorrente } }
    if (!ricorrente) return a.data ? [{ ...base, id: `ag-${a.id}`, title: a.title, date: a.data }] : []
    const endRecur = a.dataFineRicorrenza || undefined
    if (a.ricorrenza === 'giornaliera') {
      const esclusi = a.giorniEsclusione ? a.giorniEsclusione.split(',').map(Number) : []
      const daysOfWeek = [0,1,2,3,4,5,6].filter(d => !esclusi.includes(d) && (!aperti || aperti.has(d)))
      return [{ ...base, id: `ag-${a.id}`, title: a.title, daysOfWeek, startRecur: a.data || undefined, endRecur }]
    }
    if (a.ricorrenza === 'settimanale') {
      const daysOfWeek = (a.giorniSettimana ? a.giorniSettimana.split(',').map(Number) : [])
        .filter(d => !aperti || aperti.has(d))
      return [{ ...base, id: `ag-${a.id}`, title: a.title, daysOfWeek, startRecur: a.data || undefined, endRecur }]
    }
    return []
  })
}

// ─── Ghost suggestions ────────────────────────────────────────────────────────

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function buildGhostSuggestions(appuntamenti, posts, orari = []) {
  const aperti = orari.length > 0 ? new Set(orari.filter(o => o.attivo).map(o => o.giorno)) : null
  const oggi = localToday()
  // date già coperte da post reali (±1 giorno per evento)
  const postDate = new Set(posts.filter(p => p.dataProgrammata).map(p => p.dataProgrammata.slice(0, 10)))

  function hasPostNear(date, eventoTitolo) {
    // verifica se c'è un post reale entro ±2 giorni con stesso titolo
    return posts.some(p => {
      if (!p.dataProgrammata) return false
      const d = p.dataProgrammata.slice(0, 10)
      const diff = Math.abs(new Date(d) - new Date(date)) / 86400000
      return diff <= 2 && (p.titolo || '').toLowerCase().includes((eventoTitolo || '').toLowerCase().slice(0, 8))
    })
  }

  const ghosts = []

  for (const a of appuntamenti) {
    if (a.stato === 'bozza') continue
    const ricorrente = a.ricorrenza && a.ricorrenza !== 'nessuna'
    const titolo = a.title || a.titolo || ''

    if (!ricorrente && a.data && a.data >= oggi) {
      // Evento singolo futuro: -7, -3, -1
      const slots = [
        { offset: -7, template: 'cover',         label: `${titolo} — Annuncio` },
        { offset: -3, template: 'cover',          label: `${titolo} — Reminder` },
        { offset: -1, template: 'storia_evento',  label: `${titolo} — Last call` },
      ]
      for (const { offset, template, label } of slots) {
        const date = addDays(a.data, offset)
        if (date < oggi) continue
        if (hasPostNear(date, titolo)) continue
        ghosts.push({ id: `ghost-${a.id}-${offset}`, date, titolo: label, template, evento: a, isGhost: true })
      }
    }

    if (ricorrente) {
      // Ricorrente: 2gg prima delle prossime 4 occorrenze
      const giorni = a.ricorrenza === 'settimanale'
        ? (a.giorniSettimana || '').split(',').map(Number).filter(n => !isNaN(n))
        : [0,1,2,3,4,5,6].filter(d => {
            const esclusi = (a.giorniEsclusione || '').split(',').map(Number)
            return !esclusi.includes(d)
          })

      let trovate = 0
      for (let i = 1; i <= 28 && trovate < 4; i++) {
        const d = new Date(oggi + 'T12:00:00')
        d.setDate(d.getDate() + i)
        if (!giorni.includes(d.getDay())) continue
        if (aperti && !aperti.has(d.getDay())) continue
        const dataEvento = d.toISOString().split('T')[0]
        const dataSuggerita = addDays(dataEvento, -2)
        if (dataSuggerita < oggi) { trovate++; continue }
        if (hasPostNear(dataSuggerita, titolo)) { trovate++; continue }
        ghosts.push({ id: `ghost-${a.id}-rec-${i}`, date: dataSuggerita, titolo: `${titolo} — questa settimana`, template: 'cover', evento: a, isGhost: true })
        trovate++
      }
    }
  }

  return ghosts
}

// ─── TemplateThumbnailPreview ─────────────────────────────────────────────────

const THUMB_H = 80

function TemplateThumbnailPreview({ templateKey, demoImageUrl = '' }) {
  const T = TEMPLATES[templateKey]
  if (!T) return null
  const { Component, size, demoProps } = T
  const { w, h } = TEMPLATE_SIZES[size || '1:1']
  const scale = THUMB_H / h
  const prevW = Math.round(w * scale)
  const props = demoImageUrl
    ? { ...(demoProps || {}), imageUrl: demoImageUrl }
    : (demoProps || {})
  return (
    <div style={{ width: prevW, height: THUMB_H, overflow: 'hidden', flexShrink: 0, borderRadius: 4 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <Component {...props} />
      </div>
    </div>
  )
}

// ─── SlidePreview ─────────────────────────────────────────────────────────────

function SlidePreview({ slide }) {
  if (!slide) return (
    <div className={styles.previewEmpty}>
      <Slideshow size={48} weight="thin" style={{ opacity: 0.25 }} />
      <span>Seleziona o aggiungi una slide</span>
    </div>
  )
  const T = TEMPLATES[slide.template]
  if (!T) return null
  const { Component } = T
  const { w, h } = TEMPLATE_SIZES[T.size] || TEMPLATE_SIZES['1:1']
  const scale = PREVIEW_W / w
  const previewH = Math.round(h * scale)
  return (
    <div className={styles.previewScaleWrap} style={{ width: PREVIEW_W, height: previewH }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', flexShrink: 0 }}>
        <Component {...(slide.data || {})} />
      </div>
    </div>
  )
}

// ─── SlideEditorFoto ─────────────────────────────────────────────────────────
// Sub-componente isolato per le slide foto: carica useMedia internamente.

function SlideEditorFoto({ slide, onChange }) {
  const { items: mediaItems, loading: mediaLoading } = useMedia()
  const [tagFiltro, setTagFiltro] = useState('tutti')

  const { template, data = {} } = slide
  function update(key, val) { onChange({ ...slide, data: { ...data, [key]: val } }) }
  function cambiaFormato(nuovoTemplate) { onChange({ ...slide, template: nuovoTemplate }) }

  const tuttiTag = ['tutti', ...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean))]
  const fotoFiltrate = tagFiltro === 'tutti' ? mediaItems : mediaItems.filter(m => m.tag.includes(tagFiltro))
  const fotoAttuale  = data.imageUrl ? mediaItems.find(m => m.url === data.imageUrl) : null

  return (
    <div className={styles.slideEditor}>

      {/* Formato */}
      <label className={styles.sectionLabel}>Formato</label>
      <div className={styles.sorgenteRow}>
        <button
          className={`${styles.sorgenteBtn} ${template === 'foto_11' ? styles.sorgenteBtnActive : ''}`}
          onClick={() => cambiaFormato('foto_11')}
        >
          1:1  Quadrato
        </button>
        <button
          className={`${styles.sorgenteBtn} ${template === 'foto_45' ? styles.sorgenteBtnActive : ''}`}
          onClick={() => cambiaFormato('foto_45')}
        >
          4:5  Verticale
        </button>
        <button
          className={`${styles.sorgenteBtn} ${template === 'foto_916' ? styles.sorgenteBtnActive : ''}`}
          onClick={() => cambiaFormato('foto_916')}
        >
          9:16  Story
        </button>
      </div>

      {/* Logo */}
      <label className={styles.sectionLabel} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!data.mostraLogo} onChange={e => update('mostraLogo', e.target.checked)} />
        Mostra logo Boogie Bistrot
      </label>

      {/* Filtri tag */}
      <label className={styles.sectionLabel}>Foto dalla libreria media</label>
      <div className={styles.tagFiltri}>
        {tuttiTag.map(t => (
          <button
            key={t}
            className={`${styles.tagBtn} ${tagFiltro === t ? styles.tagBtnActive : ''}`}
            onClick={() => setTagFiltro(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Griglia foto */}
      {mediaLoading ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>Caricamento galleria…</div>
      ) : (
        <div className={styles.fotoGrid}>
          {fotoFiltrate.map(foto => (
            <button
              key={foto.id}
              className={`${styles.fotoCell} ${data.imageUrl === foto.url ? styles.fotoCellSelected : ''}`}
              onClick={() => update('imageUrl', data.imageUrl === foto.url ? '' : foto.url)}
              title={foto.alt || foto.nome}
            >
              <img src={cloudinaryThumb(foto.url, 120)} alt={foto.alt || ''} className={styles.fotoImg} />
              {data.imageUrl === foto.url && <div className={styles.fotoCheck}>✓</div>}
            </button>
          ))}
        </div>
      )}

      {/* Foto selezionata */}
      {fotoAttuale && (
        <div className={styles.fotoSelezionataWrap}>
          <img src={cloudinaryThumb(fotoAttuale.url, 80)} alt="" className={styles.fotoSelezionataPreview} />
          <div className={styles.fotoSelezionataInfo}>
            <span>{fotoAttuale.alt || fotoAttuale.nome || 'Foto selezionata'}</span>
            {fotoAttuale.tag?.length > 0 && <span className={styles.fotoTag}>{fotoAttuale.tag.join(', ')}</span>}
          </div>
          <button className={styles.fotoDeseleziona} onClick={() => update('imageUrl', '')}><X size={13} /></button>
        </div>
      )}
    </div>
  )
}

// ─── SlideEditorChiusura ──────────────────────────────────────────────────────

function SlideEditorChiusura({ slide, onChange, appuntamenti, eventoGlobaleId }) {
  const { items: mediaItems, loading: mediaLoading } = useMedia()
  const [tagFiltro, setTagFiltro] = useState('tutti')
  const { data = {} } = slide
  function update(key, val) { onChange({ ...slide, data: { ...data, [key]: val } }) }

  const tuttiTag    = ['tutti', ...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean))]
  const fotoFiltrate = tagFiltro === 'tutti' ? mediaItems : mediaItems.filter(m => m.tag.includes(tagFiltro))
  const fotoAttuale  = data.imageUrl ? mediaItems.find(m => m.url === data.imageUrl) : null

  return (
    <div className={styles.slideEditor}>
      <RecuperaEvento appuntamenti={appuntamenti} template="chiusura" slide={slide} onChange={onChange} eventoGlobaleId={eventoGlobaleId} />
      <label className={styles.sectionLabel}>Nome serata</label>
      <input className={styles.edInput} value={data.nomeSerata || ''} onChange={e => update('nomeSerata', e.target.value)} placeholder="Serata Paella" />

      <label className={styles.sectionLabel}>Foto dalla libreria</label>
      <div className={styles.tagFiltri}>
        {tuttiTag.map(t => (
          <button key={t} className={`${styles.tagBtn} ${tagFiltro === t ? styles.tagBtnActive : ''}`} onClick={() => setTagFiltro(t)}>
            {t}
          </button>
        ))}
      </div>
      {mediaLoading ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>Caricamento galleria…</div>
      ) : (
        <div className={styles.fotoGrid}>
          {fotoFiltrate.map(foto => (
            <button
              key={foto.id}
              className={`${styles.fotoCell} ${data.imageUrl === foto.url ? styles.fotoCellSelected : ''}`}
              onClick={() => update('imageUrl', data.imageUrl === foto.url ? '' : foto.url)}
              title={foto.alt || foto.nome}
            >
              <img src={cloudinaryThumb(foto.url, 120)} alt={foto.alt || ''} className={styles.fotoImg} />
              {data.imageUrl === foto.url && <div className={styles.fotoCheck}>✓</div>}
            </button>
          ))}
        </div>
      )}
      {fotoAttuale && (
        <div className={styles.fotoSelezionataWrap}>
          <img src={cloudinaryThumb(fotoAttuale.url, 80)} alt="" className={styles.fotoSelezionataPreview} />
          <div className={styles.fotoSelezionataInfo}>
            <span>{fotoAttuale.alt || fotoAttuale.nome || 'Foto selezionata'}</span>
            {fotoAttuale.tag?.length > 0 && <span className={styles.fotoTag}>{fotoAttuale.tag.join(', ')}</span>}
          </div>
          <button className={styles.fotoDeseleziona} onClick={() => update('imageUrl', '')}><X size={13} /></button>
        </div>
      )}
      <IndirizzoToggle data={data} update={update} />
    </div>
  )
}

// ─── SlideEditorAgendaCover ─────────────────────────────────────────────────

function SlideEditorAgendaCover({ slide, onChange }) {
  const { items: mediaItems, loading: mediaLoading } = useMedia()
  const [tagFiltro, setTagFiltro] = useState('tutti')
  const { data = {} } = slide
  function update(key, val) { onChange({ ...slide, data: { ...data, [key]: val } }) }

  const tuttiTag     = ['tutti', ...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean))]
  const fotoFiltrate = tagFiltro === 'tutti' ? mediaItems : mediaItems.filter(m => m.tag.includes(tagFiltro))
  const fotoAttuale  = data.imageUrl ? mediaItems.find(m => m.url === data.imageUrl) : null

  return (
    <div className={styles.slideEditor}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text3)', margin: '0 0 10px' }}>
        Prima slide del carosello: scegli una foto dagli asset, poi aggiungi la slide «Agenda settimana».
      </p>
      <label className={styles.sectionLabel}>Titolo principale</label>
      <textarea className={styles.edTextarea} rows={2} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} placeholder="Questa settimana" />
      <label className={styles.sectionLabel}>Periodo (badge, opzionale)</label>
      <input className={styles.edInput} value={data.labelPeriodo || ''} onChange={e => update('labelPeriodo', e.target.value)} placeholder="es. 3 – 9 maggio (come sulla slide agenda)" />
      <label className={styles.sectionLabel}>Sottotitolo</label>
      <input className={styles.edInput} value={data.sottotitolo || ''} onChange={e => update('sottotitolo', e.target.value)} placeholder="Scorri per il programma" />
      <label className={styles.sectionLabel}>URL foto (opzionale, se non scegli dalla galleria)</label>
      <input className={styles.edInput} value={data.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} placeholder="https://res.cloudinary.com/..." />
      <label className={styles.sectionLabel}>Foto dalla libreria media</label>
      <div className={styles.tagFiltri}>
        {tuttiTag.map(t => (
          <button key={t} className={`${styles.tagBtn} ${tagFiltro === t ? styles.tagBtnActive : ''}`} onClick={() => setTagFiltro(t)}>
            {t}
          </button>
        ))}
      </div>
      {mediaLoading ? (
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>Caricamento galleria…</div>
      ) : (
        <div className={styles.fotoGrid}>
          {fotoFiltrate.map(foto => (
            <button
              key={foto.id}
              className={`${styles.fotoCell} ${data.imageUrl === foto.url ? styles.fotoCellSelected : ''}`}
              onClick={() => update('imageUrl', data.imageUrl === foto.url ? '' : foto.url)}
              title={foto.alt || foto.nome}
            >
              <img src={cloudinaryThumb(foto.url, 120)} alt={foto.alt || ''} className={styles.fotoImg} />
              {data.imageUrl === foto.url && <div className={styles.fotoCheck}>✓</div>}
            </button>
          ))}
        </div>
      )}
      {fotoAttuale && (
        <div className={styles.fotoSelezionataWrap}>
          <img src={cloudinaryThumb(fotoAttuale.url, 80)} alt="" className={styles.fotoSelezionataPreview} />
          <div className={styles.fotoSelezionataInfo}>
            <span>{fotoAttuale.alt || fotoAttuale.nome || 'Foto selezionata'}</span>
            {fotoAttuale.tag?.length > 0 && <span className={styles.fotoTag}>{fotoAttuale.tag.join(', ')}</span>}
          </div>
          <button className={styles.fotoDeseleziona} onClick={() => update('imageUrl', '')}><X size={13} /></button>
        </div>
      )}
      <IndirizzoToggle data={data} update={update} />
    </div>
  )
}

// ─── SlideEditor ─────────────────────────────────────────────────────────────

function fillSlideDataFromEvento(template, a, currentData) {
  if (template === 'cover') return { ...currentData, titolo: a.title || a.titolo || '', data: a.data || '', imageUrl: a.fotoHero || '', descrizione: a.descrizioneBreve || '' }
  if (template === 'storia_evento') return { ...currentData, titolo: a.title || a.titolo || '', data: a.data || '', ora: a.ora || '', imageUrl: a.fotoHero || '' }
  if (template === 'chiusura') {
    return { ...currentData, nomeSerata: a.title || a.titolo || '' }
  }
  if (template === 'prezzo_evento' || template === 'prezzo_storia') {
    let blocchi = []
    try { blocchi = JSON.parse(a.blocchi || '[]') } catch {}
    const bPrezzo = blocchi.find(b => b.tipo === 'prezzo') || {}
    return {
      ...currentData,
      titolo:        a.title || a.titolo || '',
      data:          a.data || '',
      ora:           a.ora || '',
      imageUrl:      a.fotoHero || '',
      prezzoImporto: bPrezzo.importo || '',
      prezzoLabel:   bPrezzo.titolo  || '',
      voci:          Array.isArray(bPrezzo.voci) ? bPrezzo.voci.filter(v => typeof v === 'string' && v) : [],
    }
  }
  return currentData
}

function RecuperaEvento({ appuntamenti, template, slide, onChange, eventoGlobaleId }) {
  if (!appuntamenti?.length) return null

  const isLocked = eventoGlobaleId && slide.eventoLocked !== false
  const eventoGlobale = eventoGlobaleId ? appuntamenti.find(a => a.id === eventoGlobaleId) : null

  if (isLocked && eventoGlobale) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '5px 8px', background: 'var(--bg3)', borderRadius: 6 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🔗 {eventoGlobale.title || eventoGlobale.titolo}
        </span>
        <button
          type="button"
          style={{ fontSize: '0.72rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px 4px' }}
          onClick={() => onChange({ ...slide, eventoLocked: false })}
          title="Sblocca e usa evento diverso"
        >
          Sblocca
        </button>
      </div>
    )
  }

  return (
    <select
      className={styles.select}
      value=""
      onChange={e => {
        const a = appuntamenti.find(a => a.id === e.target.value)
        if (!a) return
        onChange({ ...slide, data: fillSlideDataFromEvento(template, a, slide.data || {}), eventoLocked: false })
      }}
      style={{ marginBottom: 10 }}
    >
      <option value="">↓ Recupera dati da evento…</option>
      {appuntamenti.map(a => (
        <option key={a.id} value={a.id}>{a.title || a.titolo}{a.data ? ` (${formatData(a.data)})` : ''}</option>
      ))}
    </select>
  )
}

function IndirizzoToggle({ data, update }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 6 }}>
      <input
        type="checkbox"
        checked={!!data.mostraIndirizzo}
        onChange={e => update('mostraIndirizzo', e.target.checked)}
      />
      <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Mostra indirizzo (per sponsorizzate)</span>
    </label>
  )
}

function SlideEditor({ slide, onChange, appuntamenti, eventoGlobaleId, orari }) {
  if (!slide) return null
  const { template, data = {} } = slide
  function update(key, val) { onChange({ ...slide, data: { ...data, [key]: val } }) }

  const usaEvento = ['cover', 'storia_evento', 'prezzo_evento', 'prezzo_storia', 'chiusura'].includes(template)

  if (template === 'foto_11' || template === 'foto_45' || template === 'foto_916') {
    return <SlideEditorFoto slide={slide} onChange={onChange} />
  }

  if (template === 'agenda_settimana' || template === 'agenda_settimana_storia') {
    return <SlideEditorAgenda slide={slide} onChange={onChange} appuntamenti={appuntamenti} orari={orari} />
  }

  if (template === 'agenda_cover') {
    return <SlideEditorAgendaCover slide={slide} onChange={onChange} />
  }

  if (template === 'cover') return (
    <div className={styles.slideEditor}>
      <RecuperaEvento appuntamenti={appuntamenti} template={template} slide={slide} onChange={onChange} eventoGlobaleId={eventoGlobaleId} />
      <label className={styles.sectionLabel}>Titolo</label>
      <textarea className={styles.edTextarea} rows={2} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} placeholder="Serata Paella" />
      <label className={styles.sectionLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.sectionLabel}>Descrizione (opzionale)</label>
      <textarea className={styles.edTextarea} rows={3} value={data.descrizione || ''} onChange={e => update('descrizione', e.target.value)} placeholder="Goditi la nostra ricca Paella Mista..." />
      <label className={styles.sectionLabel}>URL foto sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} placeholder="https://res.cloudinary.com/..." />
      <IndirizzoToggle data={data} update={update} />
    </div>
  )

  if (template === 'storia_evento') return (
    <div className={styles.slideEditor}>
      {usaEvento && <RecuperaEvento appuntamenti={appuntamenti} template={template} slide={slide} onChange={onChange} eventoGlobaleId={eventoGlobaleId} />}
      <label className={styles.sectionLabel}>Titolo</label>
      <input className={styles.edInput} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} />
      <label className={styles.sectionLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.sectionLabel}>Ora</label>
      <input className={styles.edInput} value={data.ora || ''} placeholder="es. 20:00" onChange={e => update('ora', e.target.value)} />
      <label className={styles.sectionLabel}>URL immagine sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} placeholder="https://res.cloudinary.com/..." onChange={e => update('imageUrl', e.target.value)} />
      <IndirizzoToggle data={data} update={update} />
    </div>
  )

  if (template === 'chiusura') return (
    <SlideEditorChiusura slide={slide} onChange={onChange} appuntamenti={appuntamenti} eventoGlobaleId={eventoGlobaleId} />
  )

  if (template === 'prezzo_evento' || template === 'prezzo_storia') {
    const voci = Array.isArray(data.voci) ? data.voci : []
    function updateVoce(i, val) {
      const next = [...voci]; next[i] = val; update('voci', next)
    }
    function aggiungiVoce() { update('voci', [...voci, '']) }
    function rimuoviVoce(i) { update('voci', voci.filter((_, idx) => idx !== i)) }
    return (
      <div className={styles.slideEditor}>
        <RecuperaEvento appuntamenti={appuntamenti} template={template} slide={slide} onChange={onChange} eventoGlobaleId={eventoGlobaleId} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className={styles.sectionLabel}>Data</label>
            <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
          </div>
          <div>
            <label className={styles.sectionLabel}>Ora</label>
            <input className={styles.edInput} value={data.ora || ''} placeholder="19:30" onChange={e => update('ora', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className={styles.sectionLabel}>Importo</label>
            <input className={styles.edInput} value={data.prezzoImporto || ''} placeholder="26€" onChange={e => update('prezzoImporto', e.target.value)} />
          </div>
          <div>
            <label className={styles.sectionLabel}>Nome menù / offerta</label>
            <input className={styles.edInput} value={data.prezzoLabel || ''} placeholder="Menù Paella" onChange={e => update('prezzoLabel', e.target.value)} />
          </div>
        </div>
        <label className={styles.sectionLabel}>Cosa è incluso</label>
        {voci.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, marginBottom: 6 }}>
            <input className={styles.edInput} value={v} onChange={e => updateVoce(i, e.target.value)} placeholder={`Voce ${i + 1}`} style={{ margin: 0 }} />
            <button className="btn-icon" onClick={() => rimuoviVoce(i)} title="Rimuovi"><X size={13} /></button>
          </div>
        ))}
        <button className="btn-secondary" style={{ fontSize: '0.8rem', marginTop: 2 }} onClick={aggiungiVoce}>+ Aggiungi voce</button>
        <label className={styles.sectionLabel} style={{ marginTop: 8 }}>URL foto sfondo</label>
        <input className={styles.edInput} value={data.imageUrl || ''} placeholder="https://res.cloudinary.com/..." onChange={e => update('imageUrl', e.target.value)} />
        <IndirizzoToggle data={data} update={update} />
      </div>
    )
  }

  return null
}

// ─── SlideEditorAgenda ───────────────────────────────────────────────────────

const GIORNI_INTERI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

function localDateStr(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekBounds(mondayStr) {
  const monday = new Date(mondayStr + 'T12:00:00')
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return { from: mondayStr, to: localDateStr(sunday) }
}

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return localDateStr(d)
}

function descriviGiorni(giorniNums) {
  // Ordina lun–dom (0=dom va in fondo)
  const ordered = [...giorniNums].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
  if (ordered.length === 0) return ''
  // Controlla se è un range continuo (es. lun–dom)
  const tutti7 = [1,2,3,4,5,6,0]
  const isContiguous = ordered.every((g, i) => {
    if (i === 0) return true
    const prev = ordered[i - 1]
    const prevIdx = tutti7.indexOf(prev)
    const curIdx  = tutti7.indexOf(g)
    return curIdx === prevIdx + 1
  })
  const first = ordered[0]
  const last  = ordered[ordered.length - 1]
  const firstIdx = tutti7.indexOf(first)
  const lastIdx = tutti7.indexOf(last)
  const giorniNelRange = tutti7.slice(firstIdx, lastIdx + 1)
  const mancantiNelRange = giorniNelRange.filter(g => !ordered.includes(g))

  // Se mancano 1-2 giorni nel range visibile, usa "Da X a Y (Z escluso)"
  if (mancantiNelRange.length <= 2 && mancantiNelRange.length > 0) {
    const first = GIORNI_INTERI[ordered[0]]
    const last  = GIORNI_INTERI[ordered[ordered.length - 1]]
    const esclusi = mancantiNelRange.map(g => GIORNI_INTERI[g]).join(' e ')
    return `Da ${first} a ${last} (${esclusi} escluso)`
  }
  if (isContiguous && ordered.length >= 3) {
    return `Da ${GIORNI_INTERI[ordered[0]]} a ${GIORNI_INTERI[ordered[ordered.length - 1]]}`
  }
  return ordered.map(g => GIORNI_INTERI[g]).join(', ')
}

function SlideEditorAgenda({ slide, onChange, appuntamenti, orari }) {
  const { data = {} } = slide
  const oggi = localDateStr(new Date())
  const [settimana, setSettimana] = useState(data.settimana || getMondayOfWeek(oggi))

  function caricaSettimana() {
    const { from, to } = getWeekBounds(settimana)
    const risultati = []
    // Giorni di apertura ordinaria (0=dom…6=sab); null = nessun filtro
    const aperti = orari?.length > 0 ? new Set(orari.filter(o => o.attivo).map(o => o.giorno)) : null

    for (const a of (appuntamenti || [])) {
      if (a.stato === 'futuro' || a.stato === 'bozza') continue
      const titolo = a.title || a.titolo || ''
      const ricorrenza = a.ricorrenza || 'nessuna'
      const startRecur = a.data || null
      const endRecur   = a.dataFineRicorrenza || null

      if (ricorrenza === 'nessuna') {
        // Includi anche passato: il backend auto-archivia eventi con data < oggi
        if ((a.stato === 'attivo' || a.stato === 'passato') && a.data && a.data >= from && a.data <= to) {
          risultati.push({ titolo, data: a.data, ora: a.ora || '', ricorrente: false })
        }
      } else if (ricorrenza === 'settimanale') {
        const giorni = a.giorniSettimana ? a.giorniSettimana.split(',').map(Number) : []
        // Trova i giorni della settimana che cadono in questo range E sono attivi
        const giorni_attivi_settimana = []
        for (let d = new Date(from + 'T12:00:00'); localDateStr(d) <= to; d.setDate(d.getDate() + 1)) {
          const ds = localDateStr(d)
          if (!giorni.includes(d.getDay())) continue
          if (aperti && !aperti.has(d.getDay())) continue
          if (startRecur && ds < startRecur) continue
          if (endRecur   && ds > endRecur)   continue
          giorni_attivi_settimana.push(d.getDay())
        }
        if (giorni_attivi_settimana.length > 0) {
          risultati.push({ titolo, data: null, ora: a.ora || '', ricorrente: true, giorniLabel: descriviGiorni(giorni_attivi_settimana) })
        }
      } else if (ricorrenza === 'giornaliera') {
        const giorni_esclusi = a.giorniEsclusione ? a.giorniEsclusione.split(',').map(Number) : []
        const giorni_attivi_settimana = []
        for (let d = new Date(from + 'T12:00:00'); localDateStr(d) <= to; d.setDate(d.getDate() + 1)) {
          const ds = localDateStr(d)
          if (giorni_esclusi.includes(d.getDay())) continue
          if (aperti && !aperti.has(d.getDay())) continue
          if (startRecur && ds < startRecur) continue
          if (endRecur   && ds > endRecur)   continue
          giorni_attivi_settimana.push(d.getDay())
        }
        if (giorni_attivi_settimana.length > 0) {
          risultati.push({ titolo, data: null, ora: a.ora || '', ricorrente: true, giorniLabel: descriviGiorni(giorni_attivi_settimana) })
        }
      } else if (ricorrenza === 'mensile' && a.data) {
        const dayOfMonth = new Date(a.data + 'T12:00:00').getDate()
        for (let d = new Date(from + 'T12:00:00'); localDateStr(d) <= to; d.setDate(d.getDate() + 1)) {
          const ds = localDateStr(d)
          if (d.getDate() !== dayOfMonth) continue
          if (startRecur && ds < startRecur) continue
          if (endRecur   && ds > endRecur)   continue
          risultati.push({ titolo, data: ds, ora: a.ora || '', ricorrente: false })
        }
      }
    }

    // Singoli prima (per data), poi ricorrenti
    risultati.sort((a, b) => {
      if (!a.ricorrente && !b.ricorrente) return (a.data || '').localeCompare(b.data || '')
      if (!a.ricorrente) return -1
      if (!b.ricorrente) return 1
      return (a.titolo || '').localeCompare(b.titolo || '')
    })

    const labelSettimana = `${new Date(from + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} – ${new Date(to + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`
    onChange({ ...slide, data: { ...data, eventi: risultati, settimana, labelSettimana } })
  }

  const eventi = Array.isArray(data.eventi) ? data.eventi : []

  return (
    <div className={styles.slideEditor}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          className={styles.edInput}
          type="date"
          value={settimana}
          onChange={e => setSettimana(getMondayOfWeek(e.target.value))}
          style={{ flex: 1 }}
          title="Seleziona un giorno della settimana"
        />
        <button type="button" className="btn-secondary" style={{ flexShrink: 0, fontSize: '0.8rem' }} onClick={caricaSettimana}>
          Carica settimana
        </button>
      </div>
      <label className={styles.sectionLabel}>Label intestazione</label>
      <input className={styles.edInput} value={data.labelSettimana || ''} onChange={e => onChange({ ...slide, data: { ...data, labelSettimana: e.target.value } })} placeholder="Questa settimana" />
      {eventi.length > 0 && (
        <>
          <label className={styles.sectionLabel} style={{ marginTop: 8 }}>Eventi ({eventi.length})</label>
          {eventi.map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.data} · {ev.titolo}{ev.ora ? ` · ${ev.ora}` : ''}
              </span>
              <button
                type="button"
                style={{ flexShrink: 0, fontSize: '0.72rem', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                onClick={() => onChange({ ...slide, data: { ...data, eventi: eventi.filter((_, idx) => idx !== i) } })}
              >✕</button>
            </div>
          ))}
        </>
      )}
      {eventi.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>Seleziona una settimana e clicca "Carica settimana"</div>}
    </div>
  )
}

// ─── CaptureContainer ─────────────────────────────────────────────────────────

function CaptureContainer({ captureRef, slide }) {
  const T = TEMPLATES[slide.template]
  if (!T) return null
  const { Component } = T
  const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
  return (
    <div style={{ position: 'fixed', left: -9999, top: 0, width: w, height: h, zIndex: -1, overflow: 'hidden' }}>
      <div ref={captureRef} style={{ width: w, height: h }}>
        <Component {...(slide.data || {})} />
      </div>
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, onEdit, onElimina, onPubblica }) {
  const slides   = (() => { try { return JSON.parse(post.slides || '[]') } catch { return [] } })()
  const isStoria = slides.length > 0 && slides.every(s => TEMPLATES[s.template]?.size === '9:16')
  return (
    <div className={styles.postCard}>
      <div className={styles.postCardTop}>
        <div className={styles.postCardInfo}>
          <div className={styles.postCardTitolo}>{post.titolo}</div>
          <div className={styles.postCardMeta}>
            <span className={styles.postCardStato} style={{ color: STATO_COLORI_POST[post.stato] || '#7A6448' }}>
              ● {post.stato}
            </span>
            <span className={styles.postCardDate}>{formatData(post.dataProgrammata || post.dataCreazione)}</span>
            <span className={styles.postCardSlides}>{slides.length} slide</span>
            <span className={isStoria ? styles.calChipStoria : styles.calChipPost}>{isStoria ? 'Storia' : 'Post'}</span>
          </div>
          {post.caption && (
            <div className={styles.postCardCaption}>{post.caption.slice(0, 100)}{post.caption.length > 100 ? '…' : ''}</div>
          )}
        </div>
        <div className={styles.postCardActions}>
          <button className="btn-icon" onClick={() => onEdit(post)} title="Modifica"><IconEdit size={14} /></button>
          <button className="btn-icon danger" onClick={() => onElimina(post.id)} title="Elimina"><IconTrash size={14} /></button>
        </div>
      </div>
      {post.stato !== 'Pubblicato' && (
        <div className={styles.postCardFooter}>
          <button type="button" className="btn-accent btn-sm" onClick={() => onPubblica(post)}>
            <PaperPlaneTilt size={13} weight="fill" /> Pubblica ora
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PostEditor ───────────────────────────────────────────────────────────────

const CL_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CL_PRESET     = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function PostEditor({ postIniziale, onSalva, onAnnulla }) {
  const { appuntamenti, loading: loadingEventi } = useAppuntamenti()
  const { orari } = useOrari()
  const { preset: presets, loading: loadingPresets, crea: creaPreset, aggiorna: aggiornaPreset, elimina: eliminaPreset } = usePresetSocial()
  const { items: mediaItems } = useMedia()
  const demoImageUrl = mediaItems.find(m => m.url)?.url || ''

  const [tipoContenuto,   setTipoContenuto]   = useState(postIniziale?.tipoContenuto || 'post')
  const [slides,          setSlides]          = useState(() => { try { return JSON.parse(postIniziale?.slides || '[]') } catch { return [] } })
  const [selectedSlideId, setSelectedSlideId] = useState(null)
  const dragIndex = useRef(null)
  const [caption,         setCaption]         = useState(postIniziale?.caption || '')
  const [piattaforme,     setPiattaforme]     = useState(() => {
    const p = (postIniziale?.piattaforme || 'instagram,facebook').split(',').filter(Boolean)
    return { instagram: p.includes('instagram'), facebook: p.includes('facebook') }
  })
  const [dataProgrammata, setDataProgrammata] = useState(postIniziale?.dataProgrammata || '')
  const [titolo,          setTitolo]          = useState(postIniziale?.titolo || '')
  const [presetDrawerOpen,  setPresetDrawerOpen]  = useState(false)
  const [nuovoNomePreset,   setNuovoNomePreset]   = useState('')
  const [salvaPresetMode,   setSalvaPresetMode]   = useState(false)
  const [rinominaId,        setRinominaId]        = useState(null)
  const [rinominaNome,      setRinominaNome]      = useState('')
  const [sorgente,        setSorgente]        = useState('evento')
  const [recordSelId,     setRecordSelId]     = useState('')
  const [templateSel,     setTemplateSel]     = useState('cover')
  const [ghostPickerOpen, setGhostPickerOpen] = useState(false)
  const [programmaOpen,   setProgrammaOpen]   = useState(false)
  const [programmaTemp,   setProgrammaTemp]   = useState('')
  const dataSuggerita = postIniziale?.dataSuggerita || ''
  const [generando,       setGenerando]       = useState(false)
  const [catturando,      setCatturando]      = useState(false)
  const [salvando,        setSalvando]        = useState(false)
  const [msg,             setMsg]             = useState(null)
  const captureRef = useRef(null)
  const [captureSlide, setCaptureSlide] = useState(null)

  const selectedSlide = slides.find(s => s.id === selectedSlideId) || null

  function updateSelectedSlide(updated) {
    setSlides(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function handleAggiungiSlide(tpl) {
    const t      = tpl || templateSel
    const record = recordSelId ? appuntamenti.find(a => a.id === recordSelId) : null
    const nuova  = buildSlide(t, 'evento', record)
    setSlides(prev => [...prev, nuova])
    setSelectedSlideId(nuova.id)
    setGhostPickerOpen(false)
    setMsg(null)
  }

  async function handleGeneraCaption() {
    setGenerando(true); setMsg(null)
    try {
      const evento = sorgente === 'evento' && recordSelId ? appuntamenti.find(a => a.id === recordSelId) : null
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo: evento?.title || evento?.titolo || titolo || 'Post Boogie Bistrot', descrizione: evento?.descrizioneBreve || '', data: evento?.data || '', ora: evento?.ora || '', tipo: sorgente === 'evento' ? 'evento' : 'post_libero' }),
      })
      const json = await res.json()
      if (json.success) setCaption(json.caption)
      else setMsg({ tipo: 'err', testo: json.error || 'Errore generazione AI' })
    } catch (e) { setMsg({ tipo: 'err', testo: e.message }) }
    finally { setGenerando(false) }
  }

  async function uploadBlob(blob) {
    if (!CL_CLOUD_NAME || !CL_PRESET) throw new Error('Cloudinary non configurato')
    const fd = new FormData()
    fd.append('file', blob, 'slide.png')
    fd.append('upload_preset', CL_PRESET)
    fd.append('folder', 'social_posts')
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CL_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!data.secure_url) throw new Error(data.error?.message || 'Upload Cloudinary fallito')
    return data.secure_url
  }

  async function imgToDataUrl(url) {
    if (!url || url.startsWith('data:')) return url
    try {
      const res  = await fetch(url, { cache: 'no-cache', mode: 'cors' })
      const blob = await res.blob()
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      return url
    }
  }

  async function catturaTutteLeSlide(slidesInput) {
    const aggiornate = [...slidesInput]
    for (let i = 0; i < aggiornate.length; i++) {
      const slide = aggiornate[i]
      // Non saltare mai — ri-cattura sempre per garantire che le immagini siano incluse
      // Pre-converti le immagini in data URL per evitare problemi CORS durante toPng
      const dataPerCaptura = { ...slide.data }
      if (dataPerCaptura.imageUrl) dataPerCaptura.imageUrl = await imgToDataUrl(dataPerCaptura.imageUrl)
      setCaptureSlide({ ...slide, data: dataPerCaptura })
      await new Promise(r => setTimeout(r, 600))
      if (!captureRef.current) continue
      try {
        await document.fonts.ready
        const T = TEMPLATES[slide.template]
        const { w, h } = TEMPLATE_SIZES[(T?.size) || '1:1']
        const dataUrl = await toPng(captureRef.current, { width: w, height: h, pixelRatio: 1 })
        const blob = await (await fetch(dataUrl)).blob()
        const url  = await uploadBlob(blob)
        aggiornate[i] = { ...slide, cloudinaryUrl: url }
        setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, cloudinaryUrl: url } : s))
      } catch (e) {
        console.error(`Cattura slide ${i} fallita:`, e)
        throw new Error(`Slide ${i + 1}: ${e.message}`)
      }
    }
    setCaptureSlide(null)
    return aggiornate
  }

  async function handleSalva(stato = 'Bozza', dataProgrammataOverride = null) {
    if (slides.length === 0) { setMsg({ tipo: 'err', testo: 'Aggiungi almeno una slide.' }); return }
    if (!titolo.trim()) { setMsg({ tipo: 'err', testo: 'Inserisci un titolo per il post.' }); return }
    const dataEffettiva = dataProgrammataOverride || dataProgrammata
    if (stato === 'Programmato' && !dataEffettiva) { setMsg({ tipo: 'err', testo: 'Seleziona data e ora di programmazione.' }); return }

    setSalvando(true); setMsg(null)
    try {
      let slidesToSave = slides
      // Il cron Netlify (pubblica-social-schedulato) usa solo cloudinaryUrl / imageUrl sulle slide.
      // Senza cattura PNG le slide template non hanno URL pubblicabili → il post resta "Programmato" o va in Errore.
      if (stato === 'Programmato') {
        setCatturando(true)
        try {
          slidesToSave = await catturaTutteLeSlide(slides)
        } finally {
          setCatturando(false)
        }
      }
      const piattaformeStr = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k).join(',')
      const res  = await authFetch('/.netlify/functions/gestisci-social-posts', {
        method: postIniziale?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postIniziale?.id, titolo: titolo.trim(), stato, caption, slides: JSON.stringify(slidesToSave), piattaforme: piattaformeStr, dataProgrammata: stato === 'Programmato' ? datetimeLocalToIso(dataEffettiva) : '', tipoContenuto }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Salvataggio fallito')
      setMsg({
        tipo: 'ok',
        testo: stato === 'Programmato'
          ? 'Post programmato: immagini salvate. Sarà pubblicato quando la data sarà passata (job Netlify su Meta).'
          : 'Bozza salvata.',
      })
      setTimeout(() => onSalva(), 1000)
    } catch (e) { setMsg({ tipo: 'err', testo: e.message }) }
    finally { setSalvando(false) }
  }

  async function handlePubblica() {
    if (slides.length === 0) { setMsg({ tipo: 'err', testo: 'Aggiungi almeno una slide.' }); return }
    const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)
    if (piattaformeAttive.length === 0) { setMsg({ tipo: 'err', testo: 'Seleziona almeno una piattaforma.' }); return }
    if (!window.confirm('Catturare le slide e pubblicare ora?')) return

    setCatturando(true); setMsg(null)
    try {
      const slidesConUrl = await catturaTutteLeSlide(slides)
      const imageUrls    = slidesConUrl.map(s => s.cloudinaryUrl).filter(Boolean)
      if (imageUrls.length === 0) throw new Error('Nessuna immagine catturata — verifica le slide.')

      const piattaformeStr = piattaformeAttive.join(',')
      const isStoria = slidesConUrl.every(s => TEMPLATES[s.template]?.size === '9:16')
      const linkUrls = isStoria ? slidesConUrl.map(s => s.data?.linkUrl || '') : []
      const saveRes  = await authFetch('/.netlify/functions/gestisci-social-posts', {
        method: postIniziale?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postIniziale?.id, titolo: titolo || 'Post carosello', stato: 'Bozza', caption, slides: JSON.stringify(slidesConUrl), piattaforme: piattaformeStr, tipoContenuto }),
      })
      const saveJson = await saveRes.json()
      const postId   = saveJson.post?.id

      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica-carosello', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrls, piattaforme: piattaformeAttive, postId, mediaType: isStoria ? 'STORIES' : 'CAROUSEL', linkUrls }),
      })
      let json
      try { json = await res.json() } catch {
        setMsg({ tipo: 'parziale', testo: 'Timeout — verifica direttamente su Instagram se il post è stato pubblicato' })
        setTimeout(() => onSalva(), 2000)
        return
      }
      if (json.success) {
        setMsg({ tipo: 'ok', testo: `Pubblicato su ${piattaformeAttive.join(', ')}!` })
        setTimeout(() => onSalva(), 1500)
      } else {
        const errs = json.errori && Object.keys(json.errori).length > 0
          ? Object.entries(json.errori).map(([p, e]) => `${p}: ${e}`).join(' | ')
          : json.error || 'Errore sconosciuto — controlla i log Netlify'
        setMsg({ tipo: 'parziale', testo: errs })
      }
    } catch (e) { setMsg({ tipo: 'err', testo: e.message }) }
    finally { setCatturando(false) }
  }

  const piattaformeAttive = Object.entries(piattaforme).filter(([k, v]) => v && !(k === 'facebook' && tipoContenuto === 'storia')).map(([k]) => k)

  async function handleSalvaPreset() {
    if (!nuovoNomePreset.trim()) return
    await creaPreset(nuovoNomePreset.trim(), slides)
    setNuovoNomePreset('')
    setSalvaPresetMode(false)
  }

  async function handleRinominaPreset(id) {
    if (!rinominaNome.trim()) return
    await aggiornaPreset(id, rinominaNome.trim(), undefined)
    setRinominaId(null)
    setRinominaNome('')
  }

  function handleApplicaPreset(p) {
    try {
      const parsed = typeof p.slides === 'string' ? JSON.parse(p.slides) : p.slides
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSlides(parsed.map(s => ({ ...s, id: uid() })))
        setSelectedSlideId(null)
      }
    } catch {}
    setPresetDrawerOpen(false)
  }

  return (
    <div className={styles.editor}>

      <div className={styles.editorHeader}>
        <button className="btn-secondary" onClick={onAnnulla} style={{ gap: 6 }}>
          <ArrowLeft size={14} /> Torna alla lista
        </button>
        <div className={styles.editorHeaderRight}>
          <button className="btn-secondary" onClick={() => setPresetDrawerOpen(true)} title="Usa o salva preset">
            Preset
          </button>
          <button className="btn-secondary" onClick={() => handleSalva('Bozza')} disabled={salvando || catturando}>
            <FloppyDisk size={14} /> Salva bozza
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className={dataProgrammata ? styles.btnProgrammato : 'btn-secondary'}
              onClick={() => { setProgrammaTemp(isoToDatetimeLocal(dataProgrammata) || dataSuggerita); setProgrammaOpen(v => !v) }}
              disabled={salvando || catturando}
            >
              <Clock size={14} />
              {dataProgrammata
                ? new Date(dataProgrammata).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Programma'}
            </button>
            {programmaOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setProgrammaOpen(false)} />
                <div className={styles.programmaPopover}>
                  <div className={styles.programmaPopoverLabel}>Data e ora di pubblicazione</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className={styles.input}
                      type="date"
                      value={programmaTemp ? programmaTemp.slice(0, 10) : ''}
                      onChange={e => setProgrammaTemp(e.target.value + 'T' + (programmaTemp ? programmaTemp.slice(11, 13) : '12') + ':00')}
                      autoFocus
                    />
                    <select
                      className={styles.input}
                      style={{ width: 'auto' }}
                      value={programmaTemp ? programmaTemp.slice(11, 16) : '12:00'}
                      onChange={e => {
                        const datePart = programmaTemp?.slice(0, 10) || isoToLocalDateStr(new Date().toISOString())
                        setProgrammaTemp(datePart + 'T' + e.target.value)
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).flatMap(h => [
                        <option key={h + ':00'} value={h + ':00'}>{h}:00</option>,
                        <option key={h + ':30'} value={h + ':30'}>{h}:30</option>,
                      ])}
                    </select>
                  </div>
                  <div className={styles.programmaPopoverActions}>
                    {dataProgrammata ? (
                      <>
                        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => { setDataProgrammata(''); setProgrammaOpen(false) }}>
                          Rimuovi
                        </button>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.8rem' }}
                          disabled={!programmaTemp}
                          onClick={() => { setDataProgrammata(programmaTemp); handleSalva('Programmato', programmaTemp); setProgrammaOpen(false) }}
                        >
                          <Clock size={13} /> Modifica
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.8rem' }}
                        disabled={!programmaTemp}
                        onClick={() => { setDataProgrammata(programmaTemp); handleSalva('Programmato', programmaTemp); setProgrammaOpen(false) }}
                      >
                        <Clock size={13} /> Conferma e programma
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <button type="button" className="btn-accent" onClick={handlePubblica} disabled={salvando || catturando || piattaformeAttive.length === 0}>
            {catturando ? 'Cattura in corso…' : <><PaperPlaneTilt size={14} weight="fill" /> Pubblica ora</>}
          </button>
        </div>
      </div>

      {msg && <div className={msg.tipo === 'ok' ? styles.msgOk : msg.tipo === 'parziale' ? styles.msgParz : styles.msgErr}>{msg.testo}</div>}

      <div className={styles.editorBody}>

        {/* Colonna sinistra */}
        <div className={styles.colLeft}>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Tipo contenuto</div>
            <div className={styles.tipoToggle}>
              {[['post', 'Post'], ['storia', 'Storia']].map(([v, l]) => (
                <button key={v} className={`${styles.tipoBtn} ${tipoContenuto === v ? styles.tipoBtnActive : ''}`} onClick={() => setTipoContenuto(v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Titolo post</div>
            <input className={styles.input} value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Serata Jazz — Carosello" />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Evento collegato (opzionale)</div>
            <select className={styles.select} value={recordSelId} onChange={e => setRecordSelId(e.target.value)}>
              <option value="">— Nessun evento —</option>
              {loadingEventi ? <option disabled>Caricamento…</option> : appuntamenti.map(a => (
                <option key={a.id} value={a.id}>{a.title || a.titolo}{a.data ? ` (${formatData(a.data)})` : ''}</option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Aggiungi slide</div>
            <div className={styles.templateGrid}>
              {Object.entries(TEMPLATES).filter(([, { size }]) => tipoContenuto === 'storia' ? size === '9:16' : size !== '9:16').map(([key, { label, size }]) => (
                <button key={key} className={`${styles.templateBtn} ${templateSel === key ? styles.templateBtnActive : ''}`} onClick={() => setTemplateSel(key)}>
                  <TemplateThumbnailPreview templateKey={key} demoImageUrl={demoImageUrl} />
                  <span>{label}</span>
                  {size === '4:5' && <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 400 }}>4:5</span>}
            {size === '9:16' && <span style={{ fontSize: '0.6rem', color: '#9B91F0', fontWeight: 500 }}>Story</span>}
                </button>
              ))}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => handleAggiungiSlide()}>
              <Plus size={14} /> Aggiungi slide
            </button>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Caption</div>
            <div className={styles.captionRow}>
              <textarea className={styles.captionTextarea} rows={5} value={caption}
                onChange={e => { setCaption(e.target.value); setMsg(null) }} placeholder="Scrivi la caption oppure generala con AI…" />
            </div>
            <div className={styles.captionFooter}>
              <button className={styles.btnAi} onClick={handleGeneraCaption} disabled={generando}>
                <Sparkle size={13} weight="fill" />{generando ? 'Generando…' : 'Genera AI'}
              </button>
              <span className={styles.charCount}>{caption.length} / 2200</span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pubblica su</div>
            <div className={styles.piattaformeRow}>
              {[{ key: 'instagram', Icon: InstagramLogo, label: 'Instagram', color: '#E1306C' }, { key: 'facebook', Icon: FacebookLogo, label: 'Facebook', color: '#1877F2' }].map(({ key, Icon, label, color }) => {
                const fbDisabled = key === 'facebook' && tipoContenuto === 'storia'
                return (
                  <button key={key}
                    className={`${styles.piattBtn} ${piattaforme[key] && !fbDisabled ? styles.piattBtnActive : ''}`}
                    style={fbDisabled ? { opacity: 0.3, cursor: 'not-allowed' } : piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
                    title={fbDisabled ? 'Le Storie non sono supportate su Facebook' : undefined}
                    onClick={() => { if (!fbDisabled) setPiattaforme(p => ({ ...p, [key]: !p[key] })) }}>
                    <Icon size={15} /> {label}
                  </button>
                )
              })}
            </div>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', lineHeight: 1.5, margin: '8px 0 0' }}>
            <strong>Programma</strong> genera le PNG delle slide (come «Pubblica ora») e le salva su Cloudinary; poi Netlify esegue{' '}
            <code style={{ fontSize: '0.65rem' }}>pubblica-social-schedulato</code> circa ogni 30 minuti e pubblica su Instagram/Facebook quando la data/ora è passata.
            Non compare subito sul social: controlla stato in lista o su Airtable (Pubblicato / Errore + messaggio).
          </p>

        </div>

        {/* Colonna destra */}
        <div className={styles.colRight}>
          {slides.length > 0 ? (
            <div className={styles.carouselPreview}>
              {slides.map((slide, i) => {
                const T = TEMPLATES[slide.template]
                if (!T) return null
                const { Component } = T
                const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
                const CAROUSEL_H = 220
                const scale = CAROUSEL_H / h
                const prevW = Math.round(w * scale)
                return (
                  <div key={slide.id}
                    className={`${styles.carouselSlot} ${slide.id === selectedSlideId ? styles.carouselSlotSelected : ''}`}
                    onClick={() => setSelectedSlideId(slide.id)}
                    style={{ width: prevW, height: CAROUSEL_H, flexShrink: 0 }}
                    draggable
                    onDragStart={() => { dragIndex.current = i }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      const from = dragIndex.current
                      if (from === null || from === i) return
                      const next = [...slides]
                      const [moved] = next.splice(from, 1)
                      next.splice(i, 0, moved)
                      setSlides(next)
                      dragIndex.current = null
                    }}
                  >
                    <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                      <Component {...(slide.data || {})} />
                    </div>
                    <div className={styles.carouselNum}>{i + 1}</div>
                    <button className={styles.carouselRemove} onClick={e => { e.stopPropagation(); setSlides(prev => prev.filter(s => s.id !== slide.id)); if (selectedSlideId === slide.id) setSelectedSlideId(null) }} title="Rimuovi">
                      <X size={10} />
                    </button>
                  </div>
                )
              })}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button className={styles.carouselGhost} style={{ height: 220 }} onClick={() => setGhostPickerOpen(v => !v)} title="Aggiungi slide">
                  <Plus size={22} weight="light" />
                </button>
                {ghostPickerOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setGhostPickerOpen(false)} />
                    <div className={styles.ghostPicker}>
                      {Object.entries(TEMPLATES)
                        .filter(([, { size }]) => tipoContenuto === 'storia' ? size === '9:16' : size !== '9:16')
                        .map(([key, { label }]) => (
                          <button key={key} className={styles.ghostPickerBtn} onClick={() => handleAggiungiSlide(key)}>
                            <TemplateThumbnailPreview templateKey={key} demoImageUrl={demoImageUrl} />
                            <span>{label}</span>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.slideStrip}>
              <div className={styles.stripEmpty}>
                <Slideshow size={28} weight="thin" style={{ opacity: 0.3 }} />
                <span>Nessuna slide</span>
              </div>
            </div>
          )}

          <div className={styles.previewArea}>
            <SlidePreview slide={selectedSlide} />
            {selectedSlide && (
              <div className={styles.slideEditorWrap}>
                <div className={styles.sectionLabel}>Modifica dati slide</div>
                <SlideEditor slide={selectedSlide} onChange={updateSelectedSlide} appuntamenti={appuntamenti} eventoGlobaleId={recordSelId} orari={orari} />
              </div>
            )}
          </div>
        </div>
      </div>

      {catturando && captureSlide && TEMPLATES[captureSlide.template] && (
        <CaptureContainer captureRef={captureRef} slide={captureSlide} />
      )}

      {/* ── Preset Drawer ── */}
      {presetDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} onClick={() => { setPresetDrawerOpen(false); setSalvaPresetMode(false); setRinominaId(null) }} />
          <div style={{ width: 320, background: 'var(--bg1)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.9rem' }}>Preset slide</strong>
              <button className="btn-icon" onClick={() => { setPresetDrawerOpen(false); setSalvaPresetMode(false); setRinominaId(null) }}><X size={16} /></button>
            </div>

            {/* Salva come preset */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              {salvaPresetMode ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className={styles.edInput}
                    placeholder="Nome preset…"
                    value={nuovoNomePreset}
                    onChange={e => setNuovoNomePreset(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSalvaPreset() }}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={handleSalvaPreset}>Salva</button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => { setSalvaPresetMode(false); setNuovoNomePreset('') }}>✕</button>
                </div>
              ) : (
                <button className="btn-secondary" style={{ width: '100%', fontSize: '0.82rem' }} onClick={() => setSalvaPresetMode(true)} disabled={slides.length === 0}>
                  <FloppyDisk size={13} /> Salva slides correnti come preset
                </button>
              )}
            </div>

            {/* Lista preset */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loadingPresets ? (
                <div style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text3)' }}>Caricamento…</div>
              ) : presets.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '0.82rem', color: 'var(--text3)' }}>Nessun preset salvato.</div>
              ) : presets.map(p => {
                const slideCount = (() => { try { return JSON.parse(p.slides || '[]').length } catch { return 0 } })()
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                    {rinominaId === p.id ? (
                      <>
                        <input
                          className={styles.edInput}
                          value={rinominaNome}
                          onChange={e => setRinominaNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRinominaPreset(p.id) }}
                          autoFocus
                          style={{ flex: 1, fontSize: '0.82rem' }}
                        />
                        <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => handleRinominaPreset(p.id)}>OK</button>
                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '3px 6px' }} onClick={() => setRinominaId(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{slideCount} slide</div>
                        </div>
                        <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px', flexShrink: 0 }} onClick={() => handleApplicaPreset(p)}>Usa</button>
                        <button className="btn-icon" title="Rinomina" onClick={() => { setRinominaId(p.id); setRinominaNome(p.nome) }}><IconEdit size={13} /></button>
                        <button className="btn-icon danger" title="Elimina" onClick={async () => { if (window.confirm(`Eliminare "${p.nome}"?`)) await eliminaPreset(p.id) }}><IconTrash size={13} /></button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FeedPreview ──────────────────────────────────────────────────────────────

const STATO_COLORI_DOT = {
  'Pubblicato':  '#27AE60',
  'Programmato': '#c9a84c',
  'Bozza':       '#7A6448',
}

function FeedCell({ post, onClick }) {
  const slides = (() => { try { return JSON.parse(post.slides || '[]') } catch { return [] } })()
  const firstSlide = slides[0]
  const isStoria = slides.length > 0 && slides.every(s => TEMPLATES[s.template]?.size === '9:16')
  const dotColor = STATO_COLORI_DOT[post.stato] || '#7A6448'

  // Determine thumbnail content — imageUrl è dentro firstSlide.data
  const firstImageUrl = firstSlide?.data?.imageUrl || ''
  let thumb = null
  if (firstSlide?.template && TEMPLATES[firstSlide.template]) {
    const T = TEMPLATES[firstSlide.template]
    const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
    const scale = 200 / w
    thumb = (
      <div className={styles.feedCellTemplate}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'center center', pointerEvents: 'none', flexShrink: 0 }}>
            <T.Component {...(firstSlide.data || {})} />
          </div>
        </div>
      </div>
    )
  } else if (firstImageUrl) {
    thumb = <img src={firstImageUrl} alt="" className={styles.feedCellThumb} />
  } else {
    thumb = (
      <div style={{ width: '100%', height: '100%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Slideshow size={28} weight="thin" style={{ opacity: 0.2 }} />
      </div>
    )
  }

  const dateLabel = post.dataProgrammata
    ? new Date(post.dataProgrammata).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    : post.dataCreazione
      ? new Date(post.dataCreazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
      : ''

  return (
    <div className={styles.feedCell} onClick={() => onClick(post)}>
      {thumb}
      <div className={styles.feedCellDot} style={{ background: dotColor }} />
      {isStoria && <span className={styles.feedCellStoria}>Storia</span>}
      <div className={styles.feedOverlay}>
        <div className={styles.feedOverlayTitolo}>{post.titolo}</div>
        <div className={styles.feedOverlayMeta}>{post.stato}{dateLabel ? ` · ${dateLabel}` : ''}</div>
      </div>
    </div>
  )
}

function FeedPreview({ posts, onEdit }) {
  const [filtro, setFiltro] = useState('post')  // 'tutti' | 'post' | 'storia'

  const sorted = [...posts]
    .filter(p => {
      const slides = (() => { try { return JSON.parse(p.slides || '[]') } catch { return [] } })()
      const isStoria = slides.length > 0 && slides.every(s => TEMPLATES[s.template]?.size === '9:16')
      if (filtro === 'post')   return !isStoria
      if (filtro === 'storia') return isStoria
      return true
    })
    .sort((a, b) => {
      const da = a.dataProgrammata || a.dataCreazione || ''
      const db = b.dataProgrammata || b.dataCreazione || ''
      return db.localeCompare(da)  // più recente prima (come Instagram feed)
    })

  return (
    <div className={styles.feedWrap}>
      <div className={styles.feedToolbar}>
        <span className={styles.feedToolbarLabel}>Mostra:</span>
        {['tutti', 'post', 'storia'].map(f => (
          <button
            key={f}
            className={filtro === f ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setFiltro(f)}
          >
            {f === 'tutti' ? 'Tutti' : f === 'post' ? 'Post' : 'Storie'}
          </button>
        ))}
        <span className={styles.feedToolbarLabel} style={{ marginLeft: 'auto' }}>
          {sorted.length} contenuti
        </span>
      </div>
      <div className={styles.feedGrid}>
        {sorted.length === 0 && (
          <div className={styles.feedEmpty}>Nessun contenuto</div>
        )}
        {sorted.map(p => (
          <FeedCell key={p.id} post={p} onClick={onEdit} />
        ))}
      </div>
    </div>
  )
}

// ─── SocialCalendario ─────────────────────────────────────────────────────────

function EventoContenuto({ info }) {
  const { isAgenda, ricorrente, stato, isGhost } = info.event.extendedProps
  if (isAgenda) {
    const dotColor = ricorrente ? '#9B91F0' : '#c9a84c'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '1px 4px', width: '100%', overflow: 'hidden', cursor: 'default', opacity: 0.4 }}>
        <span style={{ flexShrink: 0, width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {info.event.title}
        </span>
      </div>
    )
  }
  if (isGhost) {
    const tipoLabel = info.event.extendedProps.ghost?.template === 'storia_evento' ? 'Storia' : 'Post'
    return (
      <div style={{ border: '1.5px dashed #7A6448', borderRadius: '4px', padding: '2px 6px', width: '100%', cursor: 'pointer', overflow: 'hidden', background: 'rgba(122,100,72,0.08)' }}>
        <div style={{ fontWeight: 500, color: '#9a8060', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ✦ {info.event.title}
        </div>
        <span className={tipoLabel === 'Storia' ? styles.calChipStoria : styles.calChipPost}>{tipoLabel}</span>
      </div>
    )
  }
  const color = STATO_COLORI_POST[stato] || '#7A6448'
  const { post } = info.event.extendedProps
  const slides = (() => { try { return JSON.parse(post?.slides || '[]') } catch { return [] } })()
  const firstSlide = slides[0]
  const tipoLabel = (post?.tipoContenuto || 'post') === 'storia' ? 'Storia' : 'Post'
  const oraStr = (() => {
    const dp = post?.dataProgrammata || post?.dataPubblicata
    if (!dp || !dp.includes('T')) return null
    try { return new Date(dp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) } catch { return null }
  })()
  const CAL_THUMB_W = 28
  const thumbContent = firstSlide?.template ? (() => {
    const T = TEMPLATES[firstSlide.template]
    if (!T) return null
    const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
    const scale = CAL_THUMB_W / w
    return (
      <div style={{ width: CAL_THUMB_W, flexShrink: 0, borderRadius: 2, overflow: 'hidden', position: 'relative', alignSelf: 'stretch' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, width: w, height: h, marginTop: -Math.round(h * scale / 2), transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
          <T.Component {...(firstSlide.data || {})} />
        </div>
      </div>
    )
  })() : (firstSlide?.data?.imageUrl ? (
    <img src={firstSlide.data.imageUrl} alt="" style={{ width: CAL_THUMB_W, alignSelf: 'stretch', objectFit: 'cover', objectPosition: 'top', borderRadius: 2, flexShrink: 0 }} />
  ) : null)
  return (
    <div style={{ background: color, borderRadius: '4px', padding: '2px 4px', width: '100%', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'stretch', gap: 4 }}>
      {thumbContent}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 3, padding: '0 4px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', color: '#fff', display: 'inline-block', marginBottom: '1px' }}>{tipoLabel}</span>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
          {info.event.title}
        </div>
        <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{stato}</span>
          {oraStr && <><span style={{ opacity: 0.4 }}>·</span><span>{oraStr}</span></>}
        </div>
      </div>
    </div>
  )
}

// ─── PostPreviewModal ─────────────────────────────────────────────────────────

const MODAL_PREV_W = 300

function PostPreviewModal({ post, onChiudi, onModifica }) {
  const [slideIdx, setSlideIdx] = useState(0)
  const slides = useMemo(() => { try { return JSON.parse(post?.slides || '[]') } catch { return [] } }, [post])

  const slide = slides[slideIdx]
  const T = slide ? TEMPLATES[slide.template] : null
  let slideContent = null
  if (T) {
    const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
    const scale = MODAL_PREV_W / w
    const prevH = Math.round(h * scale)
    slideContent = (
      <div style={{ width: MODAL_PREV_W, height: prevH, overflow: 'hidden', borderRadius: 8, flexShrink: 0 }}>
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
          <T.Component {...(slide.data || {})} />
        </div>
      </div>
    )
  }

  const dp = post?.dataProgrammata
  const dataFmt = dp ? new Date(dp).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null
  const oraFmt  = dp ? new Date(dp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null
  const piattaforme = post?.piattaforme ? post.piattaforme.split(',').filter(Boolean) : []
  const tipoLabel = (post?.tipoContenuto || 'post') === 'storia' ? 'Storia' : 'Post'
  const color = STATO_COLORI_POST[post?.stato] || '#7A6448'

  return (
    <div className={styles.modalOverlay} onClick={onChiudi}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onChiudi}><X size={18} /></button>

        <div className={styles.modalHeader}>
          <div className={styles.modalTitolo}>{post?.titolo}</div>
          <div className={styles.modalBadges}>
            <span className={styles.modalBadgeStato} style={{ background: color }}>{post?.stato}</span>
            <span className={tipoLabel === 'Storia' ? styles.calChipStoria : styles.calChipPost}>{tipoLabel}</span>
          </div>
        </div>

        <div className={styles.modalCarousel}>
          {slides.length > 1 && (
            <button className={styles.modalArrow} disabled={slideIdx === 0} onClick={() => setSlideIdx(i => i - 1)}>‹</button>
          )}
          <div className={styles.modalSlideWrap}>{slideContent}</div>
          {slides.length > 1 && (
            <button className={styles.modalArrow} disabled={slideIdx === slides.length - 1} onClick={() => setSlideIdx(i => i + 1)}>›</button>
          )}
        </div>

        {slides.length > 1 && (
          <div className={styles.modalDots}>
            {slides.map((_, i) => (
              <button key={i} className={`${styles.modalDot} ${i === slideIdx ? styles.modalDotActive : ''}`} onClick={() => setSlideIdx(i)} />
            ))}
          </div>
        )}

        <div className={styles.modalMeta}>
          {dp && (
            <div className={styles.modalMetaRow}>
              <Clock size={14} />
              <span>{dataFmt} alle {oraFmt}</span>
            </div>
          )}
          {piattaforme.length > 0 && (
            <div className={styles.modalMetaRow}>
              {piattaforme.map(p => {
                const cfg = PIATTAFORME_CONFIG.find(c => c.key === p)
                return cfg ? <cfg.Icon key={p} size={15} style={{ color: cfg.color }} /> : null
              })}
              <span>{piattaforme.map(p => PIATTAFORME_CONFIG.find(c => c.key === p)?.label).filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        {post?.caption && (
          <div className={styles.modalCaption}>
            <div className={styles.modalCaptionLabel}>Caption</div>
            <div className={styles.modalCaptionText} style={{ whiteSpace: 'pre-wrap' }}>{post.caption}</div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.modalBtnEdit} onClick={() => { onChiudi(); onModifica(post) }}>
            <IconEdit size={14} /> Modifica
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SocialCalendario ─────────────────────────────────────────────────────────

function SocialCalendario({ posts, onApriPreview, onApriEditorDaGhost, onApriEditorDaGiorno }) {
  const { appuntamenti } = useAppuntamenti()
  const { orari } = useOrari()
  const calRef = useRef(null)
  const onGiornoRef = useRef(onApriEditorDaGiorno)
  useEffect(() => { onGiornoRef.current = onApriEditorDaGiorno }, [onApriEditorDaGiorno])
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false)
  const agendaEvents = useMemo(() => buildAgendaEvents(appuntamenti, orari), [appuntamenti, orari])
  const ghosts = useMemo(() => buildGhostSuggestions(appuntamenti, posts, orari), [appuntamenti, posts, orari])

  const postEvents = useMemo(() => posts
    .filter(p => p.dataProgrammata || p.dataCreazione)
    .map(p => ({
      id:    `post-${p.id}`,
      title: p.titolo,
      start: p.dataProgrammata || p.dataCreazione.slice(0, 10),
      backgroundColor: 'transparent',
      borderColor:     'transparent',
      extendedProps: { isAgenda: false, isGhost: false, stato: p.stato, post: p },
    })), [posts])

  const ghostEvents = useMemo(() => ghosts.map(g => ({
    id:    g.id,
    title: g.titolo,
    date:  g.date,
    backgroundColor: 'transparent',
    borderColor:     'transparent',
    extendedProps: { isAgenda: false, isGhost: true, ghost: g },
  })), [ghosts])

  return (
    <div className={styles.calWrap}>
      <div className={styles.calToolbar}>
        <button
          className={`${styles.calToggle} ${mostraSuggerimenti ? styles.calToggleOn : ''}`}
          onClick={() => setMostraSuggerimenti(v => !v)}
        >
          <span className={styles.calToggleThumb} />
          Suggerimenti AI
        </button>
      </div>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="it"
        events={[...agendaEvents, ...postEvents, ...(mostraSuggerimenti ? ghostEvents : [])]}
        eventContent={(info) => <EventoContenuto info={info} />}
        eventClick={(info) => {
          if (info.event.extendedProps.isAgenda) return
          if (info.event.extendedProps.isGhost) {
            onApriEditorDaGhost(info.event.extendedProps.ghost)
            return
          }
          onApriPreview(info.event.extendedProps.post)
        }}
        dayCellDidMount={(arg) => {
          const frame = arg.el.querySelector('.fc-daygrid-day-frame')
          if (!frame) return
          const btn = document.createElement('button')
          btn.className = 'social-day-add-btn'
          btn.title = 'Nuovo post'
          btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
          btn.addEventListener('click', (e) => { e.stopPropagation(); onGiornoRef.current(arg.date) })
          frame.appendChild(btn)
        }}
        dayCellWillUnmount={(arg) => {
          arg.el.querySelector('.social-day-add-btn')?.remove()
        }}
        initialView={window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth'}
        headerToolbar={window.innerWidth < 768
          ? { left: 'prev,next', center: 'title', right: '' }
          : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
        buttonText={{ today: 'Vai ad oggi', month: 'Mese', list: 'Lista' }}
        height="auto"
        firstDay={1}
        nowIndicator={true}
        dayMaxEvents={4}
        allDayText=""
        listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
        listDaySideFormat={false}
        noEventsText="Nessun post programmato"
      />
    </div>
  )
}

// ─── ComposerPost ─────────────────────────────────────────────────────────────

function ComposerPost({ onClose }) {
  const { items: mediaItems, loading: mediaLoading } = useMedia()
  const [fotoSelezionata, setFotoSelezionata] = useState(null)
  const [tagFiltro,       setTagFiltro]       = useState('tutti')
  const [caption,         setCaption]         = useState('')
  const [argomento,       setArgomento]       = useState('')
  const [piattaforme,     setPiattaforme]     = useState({ instagram: true, facebook: true, google: false })
  const [generando,       setGenerando]       = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [risultato,       setRisultato]       = useState(null)

  const tuttiTag = ['tutti', ...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean)).values()]
  const fotoFiltrate = tagFiltro === 'tutti' ? mediaItems : mediaItems.filter(m => m.tag.includes(tagFiltro))
  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)

  async function handleGeneraCaption() {
    setGenerando(true); setRisultato(null)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo: argomento || 'Post Boogie Bistrot', descrizione: '', tipo: 'post_libero' }),
      })
      const data = await res.json()
      if (data.success && data.caption) setCaption(data.caption)
      else setRisultato({ tipo: 'err', msg: data.error || 'Errore generazione' })
    } catch (e) { setRisultato({ tipo: 'err', msg: e.message }) }
    finally { setGenerando(false) }
  }

  async function handlePubblica() {
    if (!caption.trim()) { setRisultato({ tipo: 'err', msg: 'Scrivi una caption prima di pubblicare.' }); return }
    if (piattaformeAttive.length === 0) { setRisultato({ tipo: 'err', msg: 'Seleziona almeno una piattaforma.' }); return }
    if (piattaforme.instagram && !fotoSelezionata) { setRisultato({ tipo: 'err', msg: 'Instagram richiede una foto.' }); return }
    if (!window.confirm(`Pubblicare su ${piattaformeAttive.join(', ')}?`)) return

    setLoading(true); setRisultato(null)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl: fotoSelezionata?.url || '', piattaforme: piattaformeAttive, titolo: argomento || 'Boogie Bistrot', link: SITO_BASE }),
      })
      let data
      try { data = await res.json() } catch {
        setRisultato({ tipo: 'parziale', msg: 'Timeout — verifica direttamente su Instagram se il post è stato pubblicato' })
        return
      }
      setRisultato({ tipo: data.success ? 'ok' : 'parziale', data })
    } catch (e) { setRisultato({ tipo: 'err', msg: e.message }) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.composer}>
      <div className={styles.composerHeader}>
        <span className={styles.composerTitolo}>Crea post rapido</span>
        <button className={styles.composerClose} onClick={onClose}><X size={16} /></button>
      </div>

      <div className={styles.composerBody}>
        <div className={styles.composerSection}>
          <div className={styles.sectionLabel}>Foto dalla galleria</div>
          <div className={styles.tagFiltri}>
            {tuttiTag.map(t => (
              <button key={t} className={`${styles.tagBtn} ${tagFiltro === t ? styles.tagBtnActive : ''}`} onClick={() => setTagFiltro(t)}>{t}</button>
            ))}
          </div>
          {mediaLoading ? (
            <div className={styles.composerLoading}>Caricamento galleria...</div>
          ) : (
            <div className={styles.fotoGrid}>
              {fotoFiltrate.map(foto => (
                <button key={foto.id} className={`${styles.fotoCell} ${fotoSelezionata?.id === foto.id ? styles.fotoCellSelected : ''}`}
                  onClick={() => setFotoSelezionata(f => f?.id === foto.id ? null : foto)} title={foto.alt || foto.nome}>
                  <img src={cloudinaryThumb(foto.url)} alt={foto.alt || ''} className={styles.fotoImg} />
                  {fotoSelezionata?.id === foto.id && <div className={styles.fotoCheck}>✓</div>}
                </button>
              ))}
            </div>
          )}
          {fotoSelezionata && (
            <div className={styles.fotoSelezionataWrap}>
              <img src={fotoSelezionata.url} alt="" className={styles.fotoSelezionataPreview} />
              <div className={styles.fotoSelezionataInfo}>
                <span>{fotoSelezionata.alt || fotoSelezionata.nome || 'Foto selezionata'}</span>
                {fotoSelezionata.tag.length > 0 && <span className={styles.fotoTag}>{fotoSelezionata.tag.join(', ')}</span>}
              </div>
              <button className={styles.fotoDeseleziona} onClick={() => setFotoSelezionata(null)}><X size={13} /></button>
            </div>
          )}
        </div>

        <div className={styles.composerSection}>
          <div className={styles.sectionLabel}>Caption</div>
          <div className={styles.argomentoRow}>
            <input className={styles.argomentoInput} value={argomento} onChange={e => setArgomento(e.target.value)}
              placeholder='Argomento per l&apos;AI (es. "serata estiva in giardino")…' />
            <button className={styles.btnAi} onClick={handleGeneraCaption} disabled={generando}>
              <Sparkle size={13} weight="fill" />{generando ? 'Generando...' : 'Genera AI'}
            </button>
          </div>
          <textarea className={styles.composerTextarea} value={caption} onChange={e => { setCaption(e.target.value); setRisultato(null) }}
            rows={6} placeholder="Scrivi la caption oppure generala con AI..." />
          <div className={styles.charCount} style={{ alignSelf: 'flex-end' }}>{caption.length} / 2200</div>
        </div>

        <div className={styles.composerSection}>
          <div className={styles.sectionLabel}>Pubblica su</div>
          <div className={styles.piattaformeGroup}>
            {PIATTAFORME_CONFIG.map(({ key, label, color, Icon, requiresImg }) => (
              <button key={key}
                className={`${styles.piattaformaBtn} ${piattaforme[key] ? styles.piattaformaBtnActive : ''}`}
                style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
                onClick={() => setPiattaforme(prev => ({ ...prev, [key]: !prev[key] }))}
                title={requiresImg && !fotoSelezionata ? 'Richiede una foto selezionata' : label}>
                <Icon size={15} />{label}
                {requiresImg && !fotoSelezionata && <span className={styles.piattaformaWarn}>⚠</span>}
              </button>
            ))}
          </div>
        </div>

        {risultato?.tipo === 'ok' && <div className={styles.risultatoOk}>✓ Pubblicato con successo su {piattaformeAttive.join(', ')}</div>}
        {risultato?.tipo === 'parziale' && risultato.data && (
          <div className={styles.risultatoParziale}>
            {Object.entries(risultato.data.risultati || {}).map(([p]) => <div key={p} className={styles.risultatoRiga}>✓ {p}: pubblicato</div>)}
            {Object.entries(risultato.data.errori || {}).map(([p, e]) => <div key={p} className={styles.risultatoRigaErr}>✕ {p}: {e}</div>)}
          </div>
        )}
        {risultato?.tipo === 'err' && <div className={styles.risultatoErr}>{risultato.msg}</div>}
      </div>

      <div className={styles.composerFooter}>
        <button className="btn-secondary" onClick={onClose}>Annulla</button>
        <button type="button" className="btn-accent" onClick={handlePubblica} disabled={loading || piattaformeAttive.length === 0}>
          {loading ? 'Pubblicando...' : 'Pubblica ora →'}
        </button>
      </div>
    </div>
  )
}

// ─── CardSocial ───────────────────────────────────────────────────────────────

function CardSocial({ item, onAggiornato }) {
  const [caption,     setCaption]     = useState(item.socialCopy || '')
  const [piattaforme, setPiattaforme] = useState({ instagram: true, facebook: true, google: false })
  const [loading,     setLoading]     = useState(false)
  const [generando,   setGenerando]   = useState(false)
  const [risultato,   setRisultato]   = useState(null)

  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)
  const linkPubblico = item.slug ? `${SITO_BASE}/${item.source === 'blog' ? 'blog' : 'eventi-speciali'}/${item.slug}` : ''
  const imageUrl = item.fotoHero || item.fotoUrl || ''

  async function aggiornaSuAirtable(nuovoStatoSocial, nuovaCaption) {
    const endpoint = item.source === 'blog' ? 'gestisci-blog' : 'gestisci-appuntamenti'
    await authFetch(`/.netlify/functions/${endpoint}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, statoSocial: nuovoStatoSocial, socialCopy: nuovaCaption }),
    })
  }

  async function handleGeneraCaption() {
    setGenerando(true); setRisultato(null)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo: item.titolo || item.title || '', descrizione: item.descrizioneBreve || '', data: item.data || '', ora: item.ora || '', tipo: item.source === 'blog' ? 'articolo' : 'evento' }),
      })
      const data = await res.json()
      if (data.success && data.caption) setCaption(data.caption)
      else setRisultato({ tipo: 'err', msg: data.error || 'Errore nella generazione caption' })
    } catch (e) { setRisultato({ tipo: 'err', msg: e.message }) }
    finally { setGenerando(false) }
  }

  async function handlePubblica() {
    if (!caption.trim()) { setRisultato({ tipo: 'err', msg: 'Inserisci una caption prima di pubblicare.' }); return }
    if (piattaformeAttive.length === 0) { setRisultato({ tipo: 'err', msg: 'Seleziona almeno una piattaforma.' }); return }
    if (!window.confirm(`Pubblicare su ${piattaformeAttive.join(', ')}?`)) return
    setLoading(true); setRisultato(null)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl, piattaforme: piattaformeAttive, titolo: item.titolo || item.title || '', link: linkPubblico }),
      })
      let data
      try { data = await res.json() } catch {
        setRisultato({ tipo: 'parziale', msg: 'Timeout — verifica direttamente su Instagram se il post è stato pubblicato' })
        return
      }
      setRisultato({ tipo: data.success ? 'ok' : 'parziale', data })
      if (data.success || Object.keys(data.risultati || {}).length > 0) {
        await aggiornaSuAirtable('pubblicato', caption)
        onAggiornato()
      }
    } catch (e) { setRisultato({ tipo: 'err', msg: e.message }) }
    finally { setLoading(false) }
  }

  async function handleSegnaManualmente() {
    setLoading(true)
    try { await aggiornaSuAirtable('pubblicato', caption); onAggiornato() }
    catch (e) { setRisultato({ tipo: 'err', msg: e.message }) }
    finally { setLoading(false) }
  }

  return (
    <div className={`${styles.socialCard} ${item.statoSocial === 'pubblicato' ? styles.socialCardPubblicata : ''}`}>
      <div className={styles.socialCardTop}>
        {imageUrl && <img className={styles.socialCardFoto} src={imageUrl} alt="" />}
        <div className={styles.socialCardInfo}>
          <div className={styles.socialCardTitolo}>{item.titolo || item.title}</div>
          <div className={styles.socialCardMeta}>
            <span className={`${styles.badge} ${item.source === 'blog' ? styles.badgeBlog : styles.badgeEvento}`}>
              {item.source === 'blog' ? 'Blog' : 'Evento'}
            </span>
            {item.data && (
              <span className={styles.socialCardData}>
                {new Date(item.data + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {item.statoSocial === 'pubblicato' && <span className={styles.badgePubblicato}>✓ Pubblicato</span>}
          </div>
          {linkPubblico && <a href={linkPubblico} target="_blank" rel="noreferrer" className={styles.linkPubblico}>{linkPubblico.replace('https://', '')}</a>}
        </div>
      </div>

      <div className={styles.captionSection}>
        <label className={styles.fieldLabel}>Caption</label>
        <div className={styles.captionWrap}>
          <textarea className={styles.captionTextareaCard} value={caption}
            onChange={e => { setCaption(e.target.value); setRisultato(null) }} rows={5}
            placeholder="Scrivi la caption del post o generala con AI..." />
          {imageUrl && <img className={styles.captionPreview} src={imageUrl} alt="" />}
        </div>
        <div className={styles.cardCaptionFooter}>
          <button className={styles.btnAi} onClick={handleGeneraCaption} disabled={generando}>
            <Sparkle size={13} weight="fill" />{generando ? 'Generando...' : 'Genera con AI'}
          </button>
          <span className={styles.charCount}>{caption.length} / 2200</span>
        </div>
      </div>

      <div className={styles.piattaformeSection}>
        <label className={styles.fieldLabel}>Pubblica su</label>
        <div className={styles.piattaformeGroup}>
          {PIATTAFORME_CONFIG.map(({ key, label, color, Icon, requiresImg }) => (
            <button key={key}
              title={requiresImg && !imageUrl ? 'Richiede FotoHero' : label}
              className={`${styles.piattaformaBtn} ${piattaforme[key] ? styles.piattaformaBtnActive : ''} ${requiresImg && !imageUrl ? styles.piattaformaBtnDisabled : ''}`}
              style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
              onClick={() => setPiattaforme(prev => ({ ...prev, [key]: !prev[key] }))}>
              <Icon size={15} />{label}
              {requiresImg && !imageUrl && <span className={styles.piattaformaWarn}>⚠</span>}
            </button>
          ))}
        </div>
      </div>

      {risultato?.tipo === 'ok' && <div style={{ margin: '0 16px' }} className={styles.risultatoOk}>✓ Pubblicato su {piattaformeAttive.join(', ')}</div>}
      {risultato?.tipo === 'parziale' && risultato.data && (
        <div style={{ margin: '0 16px' }} className={styles.risultatoParziale}>
          {Object.entries(risultato.data.risultati || {}).map(([p]) => <div key={p} className={styles.risultatoRiga}>✓ {p}: pubblicato</div>)}
          {Object.entries(risultato.data.errori || {}).map(([p, e]) => <div key={p} className={styles.risultatoRigaErr}>✕ {p}: {e}</div>)}
        </div>
      )}
      {risultato?.tipo === 'err' && <div style={{ margin: '0 16px' }} className={styles.risultatoErr}>{risultato.msg}</div>}

      <div className={styles.socialCardActions}>
        <button type="button" className="btn-outline-success btn-sm" onClick={handleSegnaManualmente} disabled={loading || item.statoSocial === 'pubblicato'} title="Segna come pubblicato senza API">
          ✓ Segna pubblicato
        </button>
        <button type="button" className="btn-accent btn-sm" onClick={handlePubblica} disabled={loading || piattaformeAttive.length === 0}>
          {loading ? 'Pubblicando...' : 'Pubblica ora →'}
        </button>
      </div>
    </div>
  )
}

// ─── Pannello principale ──────────────────────────────────────────────────────

export default function SocialStudioPanel() {
  const { posts, loading: loadingPosts, carica, elimina } = useSocialPosts()
  const [editorAperto,  setEditorAperto]  = useState(false)
  const [postInEdit,    setPostInEdit]    = useState(null)
  const [postPreview,   setPostPreview]   = useState(null)


  function apriEditor(post = null) {
    setPostInEdit(post)
    setEditorAperto(true)
  }

  function apriEditorDaGhost(ghost) {
    setPostInEdit({
      titolo: ghost.titolo,
      dataProgrammata: ghost.date + 'T12:00',
      slides: JSON.stringify([buildSlide(ghost.template, 'evento', ghost.evento)]),
      piattaforme: 'instagram,facebook',
      stato: 'Bozza',
    })
    setEditorAperto(true)
  }

  function chiudiEditor() {
    setEditorAperto(false)
    setPostInEdit(null)
    carica()
  }

  function apriEditorDaGiorno(date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    setPostInEdit({ dataSuggerita: dateStr + 'T12:00', stato: 'Bozza', piattaforme: 'instagram,facebook' })
    setEditorAperto(true)
  }

  const [vistaAttiva, setVistaAttiva] = useState('calendario')  // 'calendario' | 'feed'

  const programmatiCount = posts.filter(p => p.stato === 'Programmato').length

  const coverageLabel = useMemo(() => {
    const dates = posts
      .filter(p => p.stato === 'Programmato' && p.dataProgrammata)
      .map(p => p.dataProgrammata.slice(0, 10))
      .sort()
    if (dates.length === 0) return null
    const last = dates[dates.length - 1]
    try {
      return new Date(last + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    } catch { return null }
  }, [posts])

  // Editor a schermo pieno (sostituisce tutto il pannello)
  if (editorAperto) {
    return <PostEditor postIniziale={postInEdit} onSalva={chiudiEditor} onAnnulla={chiudiEditor} />
  }

  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titolo}>
            <ShareNetwork size={20} weight="light" />
            Social Studio
          </div>
          {programmatiCount > 0 && <span className={styles.badgeProgrammati}>{programmatiCount} programmati</span>}
          {coverageLabel && <span className={styles.coverageLabel}>Programmato fino al {coverageLabel}</span>}
        </div>
        <div className={styles.headerRight}>
          <button className="btn-primary" style={{ gap: 6, padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => apriEditor(null)}>
            <Plus size={14} /> Nuovo post
          </button>
          <button className="btn-icon" onClick={carica} title="Aggiorna"><IconRefresh size={15} /></button>
        </div>
      </div>

      <div className={styles.tabBar}>
        <button
          className={vistaAttiva === 'calendario' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setVistaAttiva('calendario')}
        >
          Calendario
        </button>
        <button
          className={vistaAttiva === 'feed' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setVistaAttiva('feed')}
        >
          Feed
        </button>
      </div>

      {vistaAttiva === 'calendario' && (
        <SocialCalendario posts={posts} onApriPreview={setPostPreview} onApriEditorDaGhost={apriEditorDaGhost} onApriEditorDaGiorno={apriEditorDaGiorno} />
      )}

      {postPreview && (
        <PostPreviewModal
          post={postPreview}
          onChiudi={() => setPostPreview(null)}
          onModifica={(p) => apriEditor(p)}
        />
      )}
      {vistaAttiva === 'feed' && (
        <FeedPreview posts={posts} onEdit={setPostPreview} />
      )}

    </div>
  )
}
