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
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function buildSlide(template, sorgente, record) {
  const id = uid()
  if (template === 'cover') {
    return { id, template, data: { titolo: record?.title || record?.titolo || '', data: record?.data || '', imageUrl: record?.fotoHero || '', descrizione: record?.descrizioneBreve || '' } }
  }
  if (template === 'foto_11' || template === 'foto_45' || template === 'foto_916') {
    return { id, template, data: { imageUrl: '', mostraLogo: true } }
  }
  if (template === 'storia_evento') {
    return { id, template, data: { titolo: record?.title || record?.titolo || '', data: record?.data || '', ora: record?.ora || '', imageUrl: record?.fotoHero || '' } }
  }
  return { id, template: template || 'cover', data: {} }
}

function buildAgendaEvents(appuntamenti) {
  const BASE = { backgroundColor: 'transparent', borderColor: 'transparent', textColor: 'var(--text2)', editable: false }
  return appuntamenti.flatMap(a => {
    const ricorrente = a.ricorrenza && a.ricorrenza !== 'nessuna'
    const base = { ...BASE, extendedProps: { isAgenda: true, ricorrente } }
    if (!ricorrente) return a.data ? [{ ...base, id: `ag-${a.id}`, title: a.title, date: a.data }] : []
    const endRecur = a.dataFineRicorrenza || undefined
    if (a.ricorrenza === 'giornaliera') {
      const esclusi = a.giorniEsclusione ? a.giorniEsclusione.split(',').map(Number) : []
      return [{ ...base, id: `ag-${a.id}`, title: a.title, daysOfWeek: [0,1,2,3,4,5,6].filter(d => !esclusi.includes(d)), startRecur: a.data || undefined, endRecur }]
    }
    if (a.ricorrenza === 'settimanale') {
      const daysOfWeek = a.giorniSettimana ? a.giorniSettimana.split(',').map(Number) : []
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

function buildGhostSuggestions(appuntamenti, posts) {
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

function TemplateThumbnailPreview({ templateKey }) {
  const T = TEMPLATES[templateKey]
  if (!T) return null
  const { Component, size } = T
  const { w, h } = TEMPLATE_SIZES[size || '1:1']
  const scale = THUMB_H / h
  const prevW = Math.round(w * scale)
  return (
    <div style={{ width: prevW, height: THUMB_H, overflow: 'hidden', flexShrink: 0, borderRadius: 4 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <Component />
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

// ─── SlideEditor ─────────────────────────────────────────────────────────────

function fillSlideDataFromEvento(template, a, currentData) {
  if (template === 'cover') return { ...currentData, titolo: a.title || a.titolo || '', data: a.data || '', imageUrl: a.fotoHero || '', descrizione: a.descrizioneBreve || '' }
  if (template === 'storia_evento') return { ...currentData, titolo: a.title || a.titolo || '', data: a.data || '', ora: a.ora || '', imageUrl: a.fotoHero || '' }
  return currentData
}

function RecuperaEvento({ appuntamenti, template, slide, onChange }) {
  if (!appuntamenti?.length) return null
  return (
    <select
      className={styles.select}
      value=""
      onChange={e => {
        const a = appuntamenti.find(a => a.id === e.target.value)
        if (!a) return
        onChange({ ...slide, data: fillSlideDataFromEvento(template, a, slide.data || {}) })
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

function SlideEditor({ slide, onChange, appuntamenti }) {
  if (!slide) return null
  const { template, data = {} } = slide
  function update(key, val) { onChange({ ...slide, data: { ...data, [key]: val } }) }

  const usaEvento = ['cover', 'storia_evento'].includes(template)

  if (template === 'foto_11' || template === 'foto_45' || template === 'foto_916') {
    return <SlideEditorFoto slide={slide} onChange={onChange} />
  }

  if (template === 'cover') return (
    <div className={styles.slideEditor}>
      <RecuperaEvento appuntamenti={appuntamenti} template={template} slide={slide} onChange={onChange} />
      <label className={styles.sectionLabel}>Titolo</label>
      <textarea className={styles.edTextarea} rows={2} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} placeholder="Serata Paella" />
      <label className={styles.sectionLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.sectionLabel}>Descrizione (opzionale)</label>
      <textarea className={styles.edTextarea} rows={3} value={data.descrizione || ''} onChange={e => update('descrizione', e.target.value)} placeholder="Goditi la nostra ricca Paella Mista..." />
      <label className={styles.sectionLabel}>URL foto sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} placeholder="https://res.cloudinary.com/..." />
    </div>
  )

  if (template === 'storia_evento') return (
    <div className={styles.slideEditor}>
      {usaEvento && <RecuperaEvento appuntamenti={appuntamenti} template={template} slide={slide} onChange={onChange} />}
      <label className={styles.sectionLabel}>Titolo</label>
      <input className={styles.edInput} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} />
      <label className={styles.sectionLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.sectionLabel}>Ora</label>
      <input className={styles.edInput} value={data.ora || ''} placeholder="es. 20:00" onChange={e => update('ora', e.target.value)} />
      <label className={styles.sectionLabel}>URL immagine sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} placeholder="https://res.cloudinary.com/..." onChange={e => update('imageUrl', e.target.value)} />
    </div>
  )

  return null
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
            {isStoria && <span style={{ fontSize: '0.72rem', color: '#9B91F0', fontWeight: 600 }}>◉ Story</span>}
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
          <button className={styles.btnPubblicaNow} onClick={() => onPubblica(post)}>
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
  const { preset: presets, loading: loadingPresets, crea: creaPreset, aggiorna: aggiornaPreset, elimina: eliminaPreset } = usePresetSocial()

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

  function handleAggiungiSlide() {
    const record = recordSelId ? appuntamenti.find(a => a.id === recordSelId) : null
    const nuova  = buildSlide(templateSel, 'evento', record)
    setSlides(prev => [...prev, nuova])
    setSelectedSlideId(nuova.id)
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

  async function catturaTutteLeSlide(slidesInput) {
    const aggiornate = [...slidesInput]
    for (let i = 0; i < aggiornate.length; i++) {
      const slide = aggiornate[i]
      if (slide.cloudinaryUrl) continue
      setCaptureSlide(slide)
      await new Promise(r => setTimeout(r, 600))
      if (!captureRef.current) continue
      try {
        await document.fonts.ready
        const T = TEMPLATES[slide.template]
        const { w, h } = TEMPLATE_SIZES[(T?.size) || '1:1']
        const dataUrl = await toPng(captureRef.current, { width: w, height: h, pixelRatio: 1, cacheBust: true })
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

  async function handleSalva(stato = 'Bozza') {
    if (slides.length === 0) { setMsg({ tipo: 'err', testo: 'Aggiungi almeno una slide.' }); return }
    if (!titolo.trim()) { setMsg({ tipo: 'err', testo: 'Inserisci un titolo per il post.' }); return }
    if (stato === 'Programmato' && !dataProgrammata) { setMsg({ tipo: 'err', testo: 'Seleziona data e ora di programmazione.' }); return }

    setSalvando(true); setMsg(null)
    try {
      const piattaformeStr = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k).join(',')
      const res  = await authFetch('/.netlify/functions/gestisci-social-posts', {
        method: postIniziale?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postIniziale?.id, titolo: titolo.trim(), stato, caption, slides: JSON.stringify(slides), piattaforme: piattaformeStr, dataProgrammata: stato === 'Programmato' ? dataProgrammata : '' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Salvataggio fallito')
      setMsg({ tipo: 'ok', testo: stato === 'Programmato' ? 'Post programmato!' : 'Bozza salvata.' })
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
        body: JSON.stringify({ id: postIniziale?.id, titolo: titolo || 'Post carosello', stato: 'Bozza', caption, slides: JSON.stringify(slidesConUrl), piattaforme: piattaformeStr }),
      })
      const saveJson = await saveRes.json()
      const postId   = saveJson.post?.id

      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica-carosello', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrls, piattaforme: piattaformeAttive, postId, mediaType: isStoria ? 'STORIES' : 'CAROUSEL', linkUrls }),
      })
      const json = await res.json()
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

  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)

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
          <button className="btn-secondary" onClick={() => handleSalva('Programmato')} disabled={salvando || catturando || !dataProgrammata} title={!dataProgrammata ? 'Imposta prima la data di pubblicazione' : ''}>
            <Clock size={14} /> Programma
          </button>
          <button className={styles.btnPubblicaOra} onClick={handlePubblica} disabled={salvando || catturando || piattaformeAttive.length === 0}>
            {catturando ? 'Cattura in corso…' : <><PaperPlaneTilt size={14} weight="fill" /> Pubblica ora</>}
          </button>
        </div>
      </div>

      {msg && <div className={msg.tipo === 'ok' ? styles.msgOk : msg.tipo === 'parziale' ? styles.msgParz : styles.msgErr}>{msg.testo}</div>}

      <div className={styles.editorBody}>

        {/* Colonna sinistra */}
        <div className={styles.colLeft}>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Titolo post</div>
            <input className={styles.input} value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Serata Jazz — Carosello" />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Aggiungi slide</div>
            <select className={styles.select} value={recordSelId} onChange={e => setRecordSelId(e.target.value)}>
              <option value="">— Seleziona evento (opzionale) —</option>
              {loadingEventi ? <option disabled>Caricamento…</option> : appuntamenti.map(a => (
                <option key={a.id} value={a.id}>{a.title || a.titolo}{a.data ? ` (${formatData(a.data)})` : ''}</option>
              ))}
            </select>

            <div className={styles.sectionLabel} style={{ marginTop: 10 }}>Template grafico</div>
            <div className={styles.templateGrid}>
              {Object.entries(TEMPLATES).map(([key, { label, size }]) => (
                <button key={key} className={`${styles.templateBtn} ${templateSel === key ? styles.templateBtnActive : ''}`} onClick={() => setTemplateSel(key)}>
                  <TemplateThumbnailPreview templateKey={key} />
                  <span>{label}</span>
                  {size === '4:5' && <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 400 }}>4:5</span>}
            {size === '9:16' && <span style={{ fontSize: '0.6rem', color: '#9B91F0', fontWeight: 500 }}>Story</span>}
                </button>
              ))}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleAggiungiSlide}>
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
              {[{ key: 'instagram', Icon: InstagramLogo, label: 'Instagram', color: '#E1306C' }, { key: 'facebook', Icon: FacebookLogo, label: 'Facebook', color: '#1877F2' }].map(({ key, Icon, label, color }) => (
                <button key={key} className={`${styles.piattBtn} ${piattaforme[key] ? styles.piattBtnActive : ''}`}
                  style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
                  onClick={() => setPiattaforme(p => ({ ...p, [key]: !p[key] }))}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pubblica il (opzionale)</div>
            <input className={styles.input} type="datetime-local" value={dataProgrammata} onChange={e => setDataProgrammata(e.target.value)} />
            {dataProgrammata && (
              <div className={styles.scheduleInfo}><Clock size={12} /> Cron ogni ora — tolleranza massima 60 minuti</div>
            )}
          </div>
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
                <SlideEditor slide={selectedSlide} onChange={updateSelectedSlide} appuntamenti={appuntamenti} />
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
    return (
      <div style={{ border: '1.5px dashed #7A6448', borderRadius: '4px', padding: '2px 6px', width: '100%', cursor: 'pointer', overflow: 'hidden', background: 'rgba(122,100,72,0.08)' }}>
        <div style={{ fontWeight: 500, color: '#9a8060', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ✦ {info.event.title}
        </div>
      </div>
    )
  }
  const color = STATO_COLORI_POST[stato] || '#7A6448'
  return (
    <div style={{ background: color, borderRadius: '4px', padding: '2px 6px', width: '100%', cursor: 'pointer', overflow: 'hidden' }}>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {info.event.title}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>{stato}</div>
    </div>
  )
}

function SocialCalendario({ posts, onApriEditor, onApriEditorDaGhost }) {
  const { appuntamenti } = useAppuntamenti()
  const calRef = useRef(null)
  const agendaEvents = useMemo(() => buildAgendaEvents(appuntamenti), [appuntamenti])
  const ghosts = useMemo(() => buildGhostSuggestions(appuntamenti, posts), [appuntamenti, posts])

  const postEvents = useMemo(() => posts
    .filter(p => p.dataProgrammata || p.dataCreazione)
    .map(p => ({
      id:    `post-${p.id}`,
      title: p.titolo,
      date:  (p.dataProgrammata || p.dataCreazione + 'T12:00').slice(0, 10),
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
      <div style={{ padding: '4px 16px 8px', fontSize: '0.72rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#1565C0', marginRight: 4 }} />Post programmati</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, border: '1.5px dashed #7A6448', borderRadius: '50%', marginRight: 4 }} />Suggeriti (clicca per creare)</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', marginRight: 4, opacity: 0.5 }} />Appuntamenti</span>
      </div>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="it"
        events={[...agendaEvents, ...postEvents, ...ghostEvents]}
        eventContent={(info) => <EventoContenuto info={info} />}
        eventClick={(info) => {
          if (info.event.extendedProps.isAgenda) return
          if (info.event.extendedProps.isGhost) {
            onApriEditorDaGhost(info.event.extendedProps.ghost)
            return
          }
          onApriEditor(info.event.extendedProps.post)
        }}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
        buttonText={{ today: 'Vai ad oggi', month: 'Mese', list: 'Lista' }}
        height="auto"
        firstDay={1}
        nowIndicator={true}
        dayMaxEvents={4}
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
      const data = await res.json()
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
        <button className={styles.btnPubblica} onClick={handlePubblica} disabled={loading || piattaformeAttive.length === 0}>
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
      const data = await res.json()
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
        <button className={styles.btnSegna} onClick={handleSegnaManualmente} disabled={loading || item.statoSocial === 'pubblicato'} title="Segna come pubblicato senza API">
          ✓ Segna pubblicato
        </button>
        <button className={styles.btnPubblica} onClick={handlePubblica} disabled={loading || piattaformeAttive.length === 0}>
          {loading ? 'Pubblicando...' : 'Pubblica ora →'}
        </button>
      </div>
    </div>
  )
}

// ─── Pannello principale ──────────────────────────────────────────────────────

export default function SocialStudioPanel() {
  const { posts, loading: loadingPosts, carica, elimina } = useSocialPosts()
  const [tab,           setTab]           = useState('calendario')
  const [editorAperto,  setEditorAperto]  = useState(false)
  const [postInEdit,    setPostInEdit]    = useState(null)
  const [filtroStato,   setFiltroStato]   = useState('tutti')
  const [pubblicando,   setPubblicando]   = useState(null)


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
    setTab('calendario')
  }

  async function handleElimina(id) {
    if (!window.confirm('Eliminare questo post?')) return
    await elimina(id)
  }

  async function handlePubblicaPost(post) {
    const slides    = (() => { try { return JSON.parse(post.slides || '[]') } catch { return [] } })()
    const imageUrls = slides.map(s => s.cloudinaryUrl).filter(Boolean)
    const piattaforme = (post.piattaforme || 'instagram,facebook').split(',').filter(Boolean)
    const isStoria = slides.length > 0 && slides.every(s => TEMPLATES[s.template]?.size === '9:16')
    const linkUrls = isStoria ? slides.map(s => s.data?.linkUrl || '') : []

    if (imageUrls.length === 0) { alert('Questo post non ha immagini caricate. Aprilo e usa "Pubblica ora" per catturare le slide.'); return }
    if (!window.confirm(`Pubblicare su ${piattaforme.join(', ')}?`)) return

    setPubblicando(post.id)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica-carosello', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: post.caption, imageUrls, piattaforme, postId: post.id, mediaType: isStoria ? 'STORIES' : 'CAROUSEL', linkUrls }),
      })
      const json = await res.json()
      if (json.success) { alert(`Pubblicato con successo su ${piattaforme.join(', ')}!`); carica() }
      else {
        const errs = json.errori && Object.keys(json.errori).length > 0
          ? Object.entries(json.errori).map(([p, e]) => `${p}: ${e}`).join('\n')
          : json.error || 'Errore sconosciuto — controlla i log Netlify'
        alert('Pubblicazione parziale:\n' + errs)
        carica()
      }
    } catch (e) { alert('Errore: ' + e.message) }
    finally { setPubblicando(null) }
  }

  const postFiltrati  = filtroStato === 'tutti' ? posts : posts.filter(p => p.stato === filtroStato)
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

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {[
          ['builder',    'Post Builder'],
          ['calendario', 'Calendario'],
        ].map(([id, label]) => (
          <button key={id} className={`${styles.tabBtn} ${tab === id ? styles.tabBtnActive : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Post Builder ── */}
      {tab === 'builder' && (
        <>
          <div className={styles.filtriRow}>
            {[['tutti','Tutti'],['Bozza','Bozze'],['Programmato','Programmati'],['Pubblicato','Pubblicati'],['Errore','Errori']].map(([v, l]) => (
              <button key={v} className={`${styles.tab} ${filtroStato === v ? styles.tabActive : ''}`} onClick={() => setFiltroStato(v)}>{l}</button>
            ))}
          </div>

          {loadingPosts ? (
            <div className={styles.empty}>Caricamento post…</div>
          ) : postFiltrati.length === 0 ? (
            <div className={styles.emptyState}>
              <Slideshow size={48} weight="thin" style={{ opacity: 0.25 }} />
              <p className={styles.emptyTitolo}>Nessun post trovato</p>
              <p className={styles.emptySub}>Clicca <strong>Nuovo post</strong> per creare il tuo primo carosello.</p>
              <button className="btn-primary" onClick={() => apriEditor(null)}><Plus size={14} /> Crea il primo post</button>
            </div>
          ) : (
            <div className={styles.postList}>
              {postFiltrati.map(post => (
                <PostCard key={post.id} post={post}
                  onEdit={apriEditor}
                  onElimina={handleElimina}
                  onPubblica={handlePubblicaPost}
                />
              ))}
            </div>
          )}

          <div className={styles.infoBox}>
            <strong>Cron:</strong> <code>pubblica-social-schedulato</code> gira ogni ora. ·{' '}
            <strong>Env:</strong> <code>AIRTABLE_SOCIAL_POSTS</code> ·{' '}
            <strong>Dipendenza:</strong> <code>npm install html-to-image</code>
          </div>
        </>
      )}

      {/* ── Tab: Calendario ── */}
      {tab === 'calendario' && (
        <SocialCalendario posts={posts} onApriEditor={apriEditor} onApriEditorDaGhost={apriEditorDaGhost} />
      )}

    </div>
  )
}
