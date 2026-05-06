/**
 * PostBuilderPanel.jsx
 * Social Post Builder — crea caroselli multi-slide da Agenda, Menu, Recensioni.
 * Cattura ogni slide come PNG 1080×1080 via html-to-image, carica su Cloudinary,
 * salva il post su Airtable (SocialPosts) e pubblica tramite Netlify Functions.
 *
 * Dipendenza: npm install html-to-image  (nella cartella dashboard/)
 */

import { useState, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import {
  Slideshow, Plus, Trash, ArrowLeft, Sparkle, CalendarDots,
  ForkKnife, Star, PaperPlaneTilt, FloppyDisk, Clock, X,
  DotsSixVertical, InstagramLogo, FacebookLogo,
} from '@phosphor-icons/react'
import { authFetch } from '../../lib/authFetch'
import { useSocialPosts } from '../../hooks/useSocialPosts'
import { useAppuntamenti }  from '../../hooks/useAppuntamenti'
import { useMenu }          from '../../hooks/useMenu'
import { useRecensioniSito } from '../../hooks/useRecensioniSito'
import { IconRefresh, IconTrash, IconEdit } from '../../icons/index.jsx'
import { TemplateEvento, TemplateMenu, TemplateRecensione, TEMPLATES } from './social/SlideTemplates.jsx'
import styles from './PostBuilderPanel.module.css'

import { uploadToImageKit, imagekitThumb } from '../../lib/imagekit.js'

// ─── Dimensioni per template ────────────────────────────────────────────────
const TEMPLATE_SIZES = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
}

// ─── Scala per l'anteprima: 1080 → 270 ──────────────────────────────────────
const PREVIEW_W = 270

// ─── Utility ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function cloudinaryThumb(url, w = 120) { return imagekitThumb(url, w) }

function formatData(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

// ─── Crea una slide default dalla sorgente selezionata ────────────────────────

function buildSlide(template, sorgente, record) {
  const id = uid()
  if (template === 'evento' && record) {
    return {
      id, template,
      data: {
        titolo:   record.title || record.titolo || '',
        data:     record.data  || '',
        ora:      record.ora   || '',
        imageUrl: record.fotoHero || '',
      },
    }
  }
  if (template === 'menu') {
    const piatti = (record || []).slice(0, 4).map(p => ({
      nome:        p.nome,
      descrizione: p.descrizione || '',
      prezzo:      p.prezzo ? `${p.prezzo}€` : '',
    }))
    return { id, template, data: { piatti, titoloPagina: 'Dal nostro menu' } }
  }
  if (template === 'recensione' && record) {
    return {
      id, template,
      data: {
        nome:        record.nome        || 'Cliente',
        stelle:      record.stelle      ?? 5,
        testo:       record.testo       || '',
        piattaforma: record.piattaforma || 'Google',
      },
    }
  }
  if (template === 'serata' && record) {
    return {
      id, template,
      data: {
        titolo:          record.title || record.titolo || '',
        data:            record.data  || '',
        messaggio:       '',
        imageUrl:        record.fotoHero || '',
        indirizzo:       'Via Europa, 2 — Colle Brianza (LC)',
        mostraIndirizzo: false,
      },
    }
  }

  if (/^prezzo\d*$/.test(template) && record) {
    // Cerca blocco prezzo nei blocchi dell'appuntamento
    let blocchi = []
    try { blocchi = JSON.parse(record.blocchi || '[]') } catch {}
    const bloccoPrezzo = blocchi.find(b => b.tipo === 'prezzo')
    return {
      id, template,
      data: {
        titoloEvento: record.title || record.titolo || '',
        titoloPagina:  bloccoPrezzo?.titolo || "L'esperienza",
        importo:       bloccoPrezzo?.importo || '',
        voci:          bloccoPrezzo?.voci || [],
        imageUrl:      record.fotoHero || '',
        indirizzo:     '',
      },
    }
  }

  // fallback libero
  return { id, template: template || 'evento', data: {} }
}

// ─── Anteprima CSS-scale template (leggera, zero canvas) ─────────────────────

const THUMB_H = 80 // altezza fissa dell'anteprima in px

function TemplateThumbnailPreview({ templateKey }) {
  const T = TEMPLATES[templateKey]
  if (!T) return null
  const { Component, size } = T
  const { w, h } = TEMPLATE_SIZES[size || '1:1']
  const scale  = THUMB_H / h
  const prevW  = Math.round(w * scale)
  return (
    <div style={{ width: prevW, height: THUMB_H, overflow: 'hidden', flexShrink: 0, borderRadius: 4 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <Component />
      </div>
    </div>
  )
}

// ─── Miniatura slide ──────────────────────────────────────────────────────────

function SlideThumbnail({ slide, selected, onClick, onRemove, index }) {
  const T = TEMPLATES[slide.template]
  return (
    <div
      className={`${styles.thumb} ${selected ? styles.thumbSelected : ''}`}
      onClick={onClick}
    >
      <div className={styles.thumbIndex}>{index + 1}</div>
      <div className={styles.thumbLabel}>{T?.label || slide.template}</div>
      {slide.data?.titolo && (
        <div className={styles.thumbSub}>{slide.data.titolo.slice(0, 22)}</div>
      )}
      {slide.cloudinaryUrl && <div className={styles.thumbUploaded}>✓</div>}
      <button
        className={styles.thumbRemove}
        onClick={e => { e.stopPropagation(); onRemove(slide.id) }}
        title="Rimuovi slide"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Anteprima slide scalata ──────────────────────────────────────────────────

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
      <div
        style={{
          width:           w,
          height:          h,
          transform:       `scale(${scale})`,
          transformOrigin: 'top left',
          flexShrink:      0,
        }}
      >
        <Component {...(slide.data || {})} />
      </div>
    </div>
  )
}

// ─── Editor slide (pannello destro) ─────────────────────────────────────────

function SlideEditor({ slide, onChange }) {
  if (!slide) return null
  const { template, data = {} } = slide

  function update(key, val) {
    onChange({ ...slide, data: { ...data, [key]: val } })
  }

  if (template === 'evento') return (
    <div className={styles.slideEditor}>
      <label className={styles.edLabel}>Titolo</label>
      <input className={styles.edInput} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} />
      <label className={styles.edLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.edLabel}>Ora</label>
      <input className={styles.edInput} value={data.ora || ''} placeholder="es. 20:00" onChange={e => update('ora', e.target.value)} />
      <label className={styles.edLabel}>URL immagine sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} placeholder="https://res.cloudinary.com/..." onChange={e => update('imageUrl', e.target.value)} />
    </div>
  )

  if (template === 'menu') return (
    <div className={styles.slideEditor}>
      <label className={styles.edLabel}>Titolo sezione</label>
      <input className={styles.edInput} value={data.titoloPagina || ''} onChange={e => update('titoloPagina', e.target.value)} />
      <label className={styles.edLabel}>Piatti (max 6)</label>
      {(data.piatti || []).map((piatto, i) => (
        <div key={i} className={styles.edPiattoRow}>
          <input
            className={styles.edInput}
            style={{ flex: 2 }}
            placeholder="Nome piatto"
            value={piatto.nome || ''}
            onChange={e => {
              const nuovi = [...(data.piatti || [])]
              nuovi[i] = { ...nuovi[i], nome: e.target.value }
              update('piatti', nuovi)
            }}
          />
          <input
            className={styles.edInput}
            style={{ flex: 1, maxWidth: 80 }}
            placeholder="Prezzo"
            value={piatto.prezzo || ''}
            onChange={e => {
              const nuovi = [...(data.piatti || [])]
              nuovi[i] = { ...nuovi[i], prezzo: e.target.value }
              update('piatti', nuovi)
            }}
          />
          <button
            className={styles.edRemovePiatto}
            onClick={() => {
              const nuovi = (data.piatti || []).filter((_, j) => j !== i)
              update('piatti', nuovi)
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {(data.piatti || []).length < 6 && (
        <button
          className={styles.edAddPiatto}
          onClick={() => update('piatti', [...(data.piatti || []), { nome: '', prezzo: '' }])}
        >
          <Plus size={13} /> Aggiungi piatto
        </button>
      )}
    </div>
  )

  if (template === 'recensione') return (
    <div className={styles.slideEditor}>
      <label className={styles.edLabel}>Nome cliente</label>
      <input className={styles.edInput} value={data.nome || ''} onChange={e => update('nome', e.target.value)} />
      <label className={styles.edLabel}>Stelle</label>
      <input className={styles.edInput} type="number" min={1} max={5} value={data.stelle ?? 5} onChange={e => update('stelle', Number(e.target.value))} />
      <label className={styles.edLabel}>Testo recensione</label>
      <textarea className={styles.edTextarea} rows={5} value={data.testo || ''} onChange={e => update('testo', e.target.value)} />
      <label className={styles.edLabel}>Piattaforma</label>
      <select className={styles.edInput} value={data.piattaforma || 'Google'} onChange={e => update('piattaforma', e.target.value)}>
        <option>Google</option>
        <option>TripAdvisor</option>
      </select>
    </div>
  )

  if (template === 'serata') return (
    <div className={styles.slideEditor}>
      <label className={styles.edLabel}>Nome serata (Phosphate)</label>
      <textarea className={styles.edTextarea} rows={2} value={data.titolo || ''} onChange={e => update('titolo', e.target.value)} placeholder={"SERATA\nLATINA"} />
      <label className={styles.edLabel}>Data</label>
      <input className={styles.edInput} type="date" value={data.data || ''} onChange={e => update('data', e.target.value)} />
      <label className={styles.edLabel}>Messaggio (Vibur, sotto il titolo)</label>
      <textarea className={styles.edTextarea} rows={3} value={data.messaggio || ''} onChange={e => update('messaggio', e.target.value)} placeholder={"Con Apericena"} />
      <label className={styles.edLabel}>URL immagine sfondo</label>
      <input className={styles.edInput} value={data.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} placeholder="https://res.cloudinary.com/..." />
      <label className={styles.edLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={!!data.mostraIndirizzo}
          onChange={e => update('mostraIndirizzo', e.target.checked)}
        />
        Mostra indirizzo
      </label>
      {data.mostraIndirizzo && (
        <input className={styles.edInput} value={data.indirizzo || ''} onChange={e => update('indirizzo', e.target.value)} />
      )}
    </div>
  )

  if (/^prezzo\d*$/.test(template)) return (
    <div className={styles.slideEditor}>
      <label className={styles.edLabel}>Nome evento</label>
      <input className={styles.edInput} value={data.titoloEvento || ''} onChange={e => update('titoloEvento', e.target.value)} placeholder="Degustazione Dulac" />
      <label className={styles.edLabel}>Titolo sezione</label>
      <input className={styles.edInput} value={data.titoloPagina || ''} onChange={e => update('titoloPagina', e.target.value)} placeholder="L'esperienza" />
      <label className={styles.edLabel}>Importo (es. €45)</label>
      <input className={styles.edInput} value={data.importo || ''} onChange={e => update('importo', e.target.value)} placeholder="€45" />
      <label className={styles.edLabel}>Voci incluse (una per riga)</label>
      <textarea
        className={styles.edTextarea}
        rows={6}
        value={(data.voci || []).join('\n')}
        onChange={e => update('voci', e.target.value.split('\n').filter(v => v.trim()))}
        placeholder={"Aperitivo di benvenuto\nTre portate\nVini selezionati\nDessert"}
      />
      <label className={styles.edLabel}>URL immagine sfondo (opzionale)</label>
      <input className={styles.edInput} value={data.imageUrl || ''} onChange={e => update('imageUrl', e.target.value)} placeholder="https://res.cloudinary.com/..." />
      <label className={styles.edLabel}>Indirizzo (opzionale)</label>
      <input className={styles.edInput} value={data.indirizzo || ''} onChange={e => update('indirizzo', e.target.value)} placeholder="Via Colle Brianza, Lecco" />
    </div>
  )

  if (template === 'panoramica_sx' || template === 'panoramica_dx') return (
    <div className={styles.slideEditor}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', lineHeight: 1.5, padding: '4px 0' }}>
        {template === 'panoramica_sx' ? '← Metà sinistra' : 'Metà destra →'} — l'immagine è condivisa con l'altra metà.
      </div>
      <label className={styles.edLabel}>URL immagine (panoramica larga)</label>
      <input
        className={styles.edInput}
        value={data.imageUrl || ''}
        onChange={e => update('imageUrl', e.target.value)}
        placeholder="https://res.cloudinary.com/... (ideale: 2160×1350)"
      />
      {template === 'panoramica_sx' && (
        <>
          <label className={styles.edLabel}>Testo sovrapposto (opzionale)</label>
          <textarea
            className={styles.edTextarea}
            rows={3}
            value={data.testo || ''}
            onChange={e => update('testo', e.target.value)}
            placeholder="Una serata indimenticabile"
          />
        </>
      )}
    </div>
  )

  return null
}

// ─── Card post salvato ────────────────────────────────────────────────────────

function PostCard({ post, onEdit, onElimina, onPubblica }) {
  const STATO_COLOR = {
    Bozza:       '#7A6448',
    Programmato: '#1565C0',
    Pubblicato:  '#2E7D32',
    Errore:      '#C0392B',
  }
  const slides = (() => { try { return JSON.parse(post.slides || '[]') } catch { return [] } })()

  return (
    <div className={styles.postCard}>
      <div className={styles.postCardTop}>
        <div className={styles.postCardInfo}>
          <div className={styles.postCardTitolo}>{post.titolo}</div>
          <div className={styles.postCardMeta}>
            <span className={styles.postCardStato} style={{ color: STATO_COLOR[post.stato] || '#7A6448' }}>
              ● {post.stato}
            </span>
            <span className={styles.postCardDate}>{formatData(post.dataProgrammata || post.dataCreazione)}</span>
            <span className={styles.postCardSlides}>{slides.length} slide</span>
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

// ─── Capture container (estratto per evitare IIFE in JSX) ────────────────────

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

// ─── Editor principale ────────────────────────────────────────────────────────

function PostEditor({ postIniziale, onSalva, onAnnulla }) {
  const { appuntamenti, loading: loadingEventi } = useAppuntamenti()
  const { piatti,       loading: loadingMenu }   = useMenu()
  const { items: recensioni, loading: loadingRec } = useRecensioniSito()

  // Stato editor
  const [slides,          setSlides]          = useState(() => {
    if (!postIniziale?.slides) return []
    try { return JSON.parse(postIniziale.slides) } catch { return [] }
  })
  const [selectedSlideId, setSelectedSlideId] = useState(null)
  const dragIndex = useRef(null)
  const [caption,         setCaption]         = useState(postIniziale?.caption || '')
  const [piattaforme,     setPiattaforme]     = useState(() => {
    const p = (postIniziale?.piattaforme || 'instagram,facebook').split(',').filter(Boolean)
    return { instagram: p.includes('instagram'), facebook: p.includes('facebook') }
  })
  const [dataProgrammata, setDataProgrammata] = useState(postIniziale?.dataProgrammata || '')
  const [titolo,          setTitolo]          = useState(postIniziale?.titolo || '')

  // Sorgente per nuova slide
  const [sorgente,        setSorgente]        = useState('evento')
  const [recordSelId,     setRecordSelId]     = useState('')
  const [templateSel,     setTemplateSel]     = useState('evento')

  // Stato operazioni
  const [generando,       setGenerando]       = useState(false)
  const [catturando,      setCatturando]      = useState(false)
  const [salvando,        setSalvando]        = useState(false)
  const [msg,             setMsg]             = useState(null) // { tipo: 'ok'|'err', testo }

  // Ref per cattura immagini (div nascosto 1080×1080)
  const captureRef = useRef(null)
  const [captureSlide, setCaptureSlide] = useState(null)

  // ── Slide selezionata
  const selectedSlide = slides.find(s => s.id === selectedSlideId) || null

  function updateSelectedSlide(updated) {
    setSlides(prev => {
      const next = prev.map(s => s.id === updated.id ? updated : s)
      // Panoramica: sincronizza imageUrl sull'altra metà della coppia
      if (updated.template === 'panoramica_sx' || updated.template === 'panoramica_dx') {
        const altroLato = updated.template === 'panoramica_sx' ? 'panoramica_dx' : 'panoramica_sx'
        return next.map(s => s.template === altroLato
          ? { ...s, data: { ...s.data, imageUrl: updated.data.imageUrl } }
          : s
        )
      }
      return next
    })
  }

  // ── Aggiungi slide
  function handleAggiungiSlide() {
    const sources = { evento: appuntamenti, menu: piatti, recensione: recensioni }
    const record  = recordSelId
      ? sources[sorgente]?.find(r => r.id === recordSelId)
      : sorgente === 'menu' ? piatti : null

    // Panoramica: aggiunge sempre la coppia sx+dx
    if (templateSel === 'panoramica_sx' || templateSel === 'panoramica_dx') {
      const sharedUrl = record?.fotoHero || ''
      const sx = { id: crypto.randomUUID(), template: 'panoramica_sx', data: { lato: 'sx', imageUrl: sharedUrl, testo: '' } }
      const dx = { id: crypto.randomUUID(), template: 'panoramica_dx', data: { lato: 'dx', imageUrl: sharedUrl, testo: '' } }
      setSlides(prev => [...prev, sx, dx])
      setSelectedSlideId(sx.id)
      setMsg(null)
      return
    }

    const nuova = buildSlide(templateSel, sorgente, record)
    setSlides(prev => [...prev, nuova])
    setSelectedSlideId(nuova.id)
    setMsg(null)
  }

  // ── Rimuovi slide
  function handleRimuoviSlide(id) {
    setSlides(prev => prev.filter(s => s.id !== id))
    if (selectedSlideId === id) setSelectedSlideId(null)
  }

  // ── Genera caption AI
  async function handleGeneraCaption() {
    setGenerando(true)
    setMsg(null)
    try {
      const evento = sorgente === 'evento' && recordSelId
        ? appuntamenti.find(a => a.id === recordSelId)
        : null
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          titolo:      evento?.title || evento?.titolo || titolo || 'Post Boogie Bistrot',
          descrizione: evento?.descrizioneBreve || '',
          data:        evento?.data  || '',
          ora:         evento?.ora   || '',
          tipo:        sorgente === 'evento' ? 'evento' : 'post_libero',
        }),
      })
      const json = await res.json()
      if (json.success) setCaption(json.caption)
      else setMsg({ tipo: 'err', testo: json.error || 'Errore generazione AI' })
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
    } finally {
      setGenerando(false)
    }
  }

  // ── Cattura slide e upload Cloudinary ─────────────────────────────────────
  // Renderizza ogni slide nel div nascosto, cattura con html-to-image, carica su Cloudinary.

  async function uploadBlob(blob) {
    const file = new File([blob], `slide-${Date.now()}.png`, { type: 'image/png' })
    return uploadToImageKit(file, 'social_posts')
  }

  async function catturaTutteLeSlide(slidesInput) {
    const aggiornate = [...slidesInput]
    for (let i = 0; i < aggiornate.length; i++) {
      const slide = aggiornate[i]
      if (slide.cloudinaryUrl) continue // già caricata

      // Metti la slide nel div di cattura e aspetta un frame di render
      setCaptureSlide(slide)
      await new Promise(r => setTimeout(r, 600)) // attendi font e immagini

      if (!captureRef.current) continue
      try {
        await document.fonts.ready
        const T = TEMPLATES[slide.template]
        const { w, h } = TEMPLATE_SIZES[(T?.size) || '1:1']
        const dataUrl = await toPng(captureRef.current, {
          width:  w,
          height: h,
          pixelRatio: 1,
          cacheBust: true,
        })
        // Converti data URL → Blob
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

  // ── Salva bozza / programma ────────────────────────────────────────────────

  async function handleSalva(stato = 'Bozza') {
    if (slides.length === 0) { setMsg({ tipo: 'err', testo: 'Aggiungi almeno una slide.' }); return }
    if (!titolo.trim()) { setMsg({ tipo: 'err', testo: 'Inserisci un titolo per il post.' }); return }
    if (stato === 'Programmato' && !dataProgrammata) {
      setMsg({ tipo: 'err', testo: 'Seleziona data e ora di programmazione.' })
      return
    }

    setSalvando(true)
    setMsg(null)
    try {
      let slidesPayload = slides
      if (stato === 'Programmato') {
        setCatturando(true)
        try {
          slidesPayload = await catturaTutteLeSlide(slides)
        } finally {
          setCatturando(false)
        }
      }
      const piattaformeStr = Object.entries(piattaforme)
        .filter(([, v]) => v).map(([k]) => k).join(',')

      const dataIso = stato === 'Programmato' && dataProgrammata
        ? (() => { try { return new Date(dataProgrammata).toISOString() } catch { return '' } })()
        : ''

      const dati = {
        id:              postIniziale?.id,
        titolo:          titolo.trim(),
        stato,
        caption,
        slides:          JSON.stringify(slidesPayload),
        piattaforme:     piattaformeStr,
        dataProgrammata: dataIso,
      }

      const res  = await authFetch(
        `/.netlify/functions/gestisci-social-posts`,
        {
          method:  postIniziale?.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(dati),
        }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Salvataggio fallito')

      setMsg({
        tipo: 'ok',
        testo: stato === 'Programmato'
          ? 'Post programmato: immagini salvate. Pubblicazione automatica quando la data è passata (Netlify).'
          : 'Bozza salvata.',
      })
      setTimeout(() => onSalva(), 1000)
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
    } finally {
      setSalvando(false)
    }
  }

  // ── Cattura + Pubblica ora ─────────────────────────────────────────────────

  async function handlePubblica() {
    if (slides.length === 0) { setMsg({ tipo: 'err', testo: 'Aggiungi almeno una slide.' }); return }
    const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)
    if (piattaformeAttive.length === 0) { setMsg({ tipo: 'err', testo: 'Seleziona almeno una piattaforma.' }); return }
    if (!window.confirm('Catturare le slide e pubblicare ora?')) return

    setCatturando(true)
    setMsg(null)
    try {
      // 1. Cattura + upload
      const slidesConUrl = await catturaTutteLeSlide(slides)
      const imageUrls    = slidesConUrl.map(s => s.cloudinaryUrl).filter(Boolean)

      if (imageUrls.length === 0) throw new Error('Nessuna immagine catturata — verifica le slide.')

      // 2. Salva il post su Airtable (stato Pubblicato dopo OK)
      const piattaformeStr = piattaformeAttive.join(',')
      const saveRes  = await authFetch(`/.netlify/functions/gestisci-social-posts`, {
        method:  postIniziale?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:          postIniziale?.id,
          titolo:      titolo || 'Post carosello',
          stato:       'Bozza',
          caption,
          slides:      JSON.stringify(slidesConUrl),
          piattaforme: piattaformeStr,
        }),
      })
      const saveJson = await saveRes.json()
      const postId   = saveJson.post?.id

      // 3. Pubblica
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica-carosello', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ caption, imageUrls, piattaforme: piattaformeAttive, postId }),
      })
      const json = await res.json()

      if (json.success) {
        setMsg({ tipo: 'ok', testo: `Pubblicato su ${piattaformeAttive.join(', ')}!` })
        setTimeout(() => onSalva(), 1500)
      } else {
        const errs = Object.entries(json.errori || {}).map(([p, e]) => `${p}: ${e}`).join(' | ')
        setMsg({ tipo: 'parziale', testo: errs || 'Pubblicazione parziale.' })
      }
    } catch (e) {
      setMsg({ tipo: 'err', testo: e.message })
    } finally {
      setCatturando(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)

  return (
    <div className={styles.editor}>

      {/* ── Header editor ── */}
      <div className={styles.editorHeader}>
        <button className="btn-secondary" onClick={onAnnulla} style={{ gap: 6 }}>
          <ArrowLeft size={14} /> Torna alla lista
        </button>
        <div className={styles.editorHeaderRight}>
          <button
            className="btn-secondary"
            onClick={() => handleSalva('Bozza')}
            disabled={salvando || catturando}
          >
            <FloppyDisk size={14} /> Salva bozza
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleSalva('Programmato')}
            disabled={salvando || catturando || !dataProgrammata}
            title={!dataProgrammata ? 'Imposta prima la data di pubblicazione' : ''}
          >
            <Clock size={14} /> Programma
          </button>
          <button
            type="button"
            className="btn-accent"
            onClick={handlePubblica}
            disabled={salvando || catturando || piattaformeAttive.length === 0}
          >
            {catturando ? 'Cattura in corso…' : <><PaperPlaneTilt size={14} weight="fill" /> Pubblica ora</>}
          </button>
        </div>
      </div>

      {msg && (
        <div className={msg.tipo === 'ok' ? styles.msgOk : msg.tipo === 'parziale' ? styles.msgParz : styles.msgErr}>
          {msg.testo}
        </div>
      )}

      <div className={styles.editorBody}>

        {/* ══ COLONNA SINISTRA — configurazione ══ */}
        <div className={styles.colLeft}>

          {/* Titolo post */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Titolo post</div>
            <input
              className={styles.input}
              value={titolo}
              onChange={e => setTitolo(e.target.value)}
              placeholder="Es. Serata Jazz — Carosello"
            />
          </div>

          {/* Sorgente dati */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Aggiungi slide</div>

            <div className={styles.sorgenteRow}>
              {[
                { key: 'evento',     Icon: CalendarDots, label: 'Evento'    },
                { key: 'menu',       Icon: ForkKnife,    label: 'Menu'      },
                { key: 'recensione', Icon: Star,          label: 'Recens.'  },
              ].map(({ key, Icon, label }) => (
                <button
                  key={key}
                  className={`${styles.sorgenteBtn} ${sorgente === key ? styles.sorgenteBtnActive : ''}`}
                  onClick={() => { setSorgente(key); setRecordSelId(''); setTemplateSel(key) }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Record picker */}
            {sorgente === 'evento' && (
              <select
                className={styles.select}
                value={recordSelId}
                onChange={e => setRecordSelId(e.target.value)}
              >
                <option value="">— Seleziona evento —</option>
                {loadingEventi
                  ? <option disabled>Caricamento…</option>
                  : appuntamenti.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title || a.titolo}{a.data ? ` (${formatData(a.data)})` : ''}
                      </option>
                    ))
                }
              </select>
            )}

            {sorgente === 'recensione' && (
              <select
                className={styles.select}
                value={recordSelId}
                onChange={e => setRecordSelId(e.target.value)}
              >
                <option value="">— Seleziona recensione —</option>
                {loadingRec
                  ? <option disabled>Caricamento…</option>
                  : recensioni.filter(r => r.attivo).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nome} — {'★'.repeat(r.stelle)}
                      </option>
                    ))
                }
              </select>
            )}

            {/* Template picker */}
            <div className={styles.sectionLabel} style={{ marginTop: 10 }}>Template grafico</div>
            <div className={styles.templateGrid}>
              {Object.entries(TEMPLATES).map(([key, { label, size }]) => (
                <button
                  key={key}
                  className={`${styles.templateBtn} ${templateSel === key ? styles.templateBtnActive : ''}`}
                  onClick={() => setTemplateSel(key)}
                >
                  <TemplateThumbnailPreview templateKey={key} />
                  <span>{label}</span>
                  {size === '4:5' && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 400 }}>4:5</span>
                  )}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={handleAggiungiSlide}
            >
              <Plus size={14} /> Aggiungi slide
            </button>
          </div>

          {/* Caption */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Caption</div>
            <div className={styles.captionRow}>
              <textarea
                className={styles.captionTextarea}
                rows={5}
                value={caption}
                onChange={e => { setCaption(e.target.value); setMsg(null) }}
                placeholder="Scrivi la caption oppure generala con AI…"
              />
            </div>
            <div className={styles.captionFooter}>
              <button
                className={styles.btnAi}
                onClick={handleGeneraCaption}
                disabled={generando}
              >
                <Sparkle size={13} weight="fill" />
                {generando ? 'Generando…' : 'Genera AI'}
              </button>
              <span className={styles.charCount}>{caption.length} / 2200</span>
            </div>
          </div>

          {/* Piattaforme */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pubblica su</div>
            <div className={styles.piattaformeRow}>
              {[
                { key: 'instagram', Icon: InstagramLogo, label: 'Instagram', color: '#E1306C' },
                { key: 'facebook',  Icon: FacebookLogo,  label: 'Facebook',  color: '#1877F2' },
              ].map(({ key, Icon, label, color }) => (
                <button
                  key={key}
                  className={`${styles.piattBtn} ${piattaforme[key] ? styles.piattBtnActive : ''}`}
                  style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
                  onClick={() => setPiattaforme(p => ({ ...p, [key]: !p[key] }))}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pubblica il (opzionale)</div>
            <input
              className={styles.input}
              type="datetime-local"
              value={dataProgrammata}
              onChange={e => setDataProgrammata(e.target.value)}
            />
            {dataProgrammata && (
              <div className={styles.scheduleInfo}>
                <Clock size={12} /> Cron ogni ora — tolleranza massima 60 minuti
              </div>
            )}
          </div>

        </div>

        {/* ══ COLONNA DESTRA — slide builder ══ */}
        <div className={styles.colRight}>

          {/* ── Carosello preview ── */}
          {slides.length > 0 && (
            <div className={styles.carouselPreview}>
              {slides.map((slide, i) => {
                const T = TEMPLATES[slide.template]
                if (!T) return null
                const { Component } = T
                const { w, h } = TEMPLATE_SIZES[T.size || '1:1']
                const CAROUSEL_H = 220
                const scale = CAROUSEL_H / h
                const prevW  = Math.round(w * scale)
                return (
                  <div
                    key={slide.id}
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
                    <button
                      className={styles.carouselRemove}
                      onClick={e => { e.stopPropagation(); handleRimuoviSlide(slide.id) }}
                      title="Rimuovi"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state quando non ci sono slide */}
          {slides.length === 0 && (
            <div className={styles.slideStrip}>
              <div className={styles.stripEmpty}>
                <Slideshow size={28} weight="thin" style={{ opacity: 0.3 }} />
                <span>Nessuna slide</span>
              </div>
            </div>
          )}

          {/* Anteprima grande + editor dati */}
          <div className={styles.previewArea}>
            <SlidePreview slide={selectedSlide} />
            {selectedSlide && (
              <div className={styles.slideEditorWrap}>
                <div className={styles.sectionLabel}>Modifica dati slide</div>
                <SlideEditor
                  slide={selectedSlide}
                  onChange={updateSelectedSlide}
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Div nascosto per cattura ── */}
      {catturando && captureSlide && TEMPLATES[captureSlide.template] && (
        <CaptureContainer captureRef={captureRef} slide={captureSlide} />
      )}
    </div>
  )
}

// ─── Pannello principale ──────────────────────────────────────────────────────

export default function PostBuilderPanel() {
  const { posts, loading, carica, elimina } = useSocialPosts()
  const [editorAperto, setEditorAperto]     = useState(false)
  const [postInEdit,   setPostInEdit]       = useState(null)
  const [filtroStato,  setFiltroStato]      = useState('tutti')
  const [pubblicando,  setPubblicando]      = useState(null) // id del post in pubblicazione

  function apriNuovoPost() {
    setPostInEdit(null)
    setEditorAperto(true)
  }

  function apriModificaPost(post) {
    setPostInEdit(post)
    setEditorAperto(true)
  }

  function chiudiEditor() {
    setEditorAperto(false)
    setPostInEdit(null)
    carica()
  }

  async function handleElimina(id) {
    if (!window.confirm('Eliminare questo post?')) return
    await elimina(id)
  }

  async function handlePubblicaPost(post) {
    const slides = (() => { try { return JSON.parse(post.slides || '[]') } catch { return [] } })()
    const imageUrls = slides.map(s => s.cloudinaryUrl).filter(Boolean)
    const piattaforme = (post.piattaforme || 'instagram,facebook').split(',').filter(Boolean)

    if (imageUrls.length === 0) {
      alert('Questo post non ha immagini caricate. Aprilo e usa "Pubblica ora" per catturare le slide.')
      return
    }
    if (!window.confirm(`Pubblicare su ${piattaforme.join(', ')}?`)) return

    setPubblicando(post.id)
    try {
      const res  = await authFetch('/.netlify/functions/pubblica-social?action=pubblica-carosello', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ caption: post.caption, imageUrls, piattaforme, postId: post.id }),
      })
      const json = await res.json()
      if (json.success) {
        alert(`Pubblicato con successo su ${piattaforme.join(', ')}!`)
        carica()
      } else {
        const errs = Object.entries(json.errori || {}).map(([p, e]) => `${p}: ${e}`).join('\n')
        alert('Pubblicazione parziale:\n' + errs)
        carica()
      }
    } catch (e) {
      alert('Errore: ' + e.message)
    } finally {
      setPubblicando(null)
    }
  }

  const postFiltrati = filtroStato === 'tutti'
    ? posts
    : posts.filter(p => p.stato === filtroStato)

  // Mostra editor
  if (editorAperto) {
    return (
      <PostEditor
        postIniziale={postInEdit}
        onSalva={chiudiEditor}
        onAnnulla={chiudiEditor}
      />
    )
  }

  // Mostra lista
  return (
    <div className={styles.panel}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titolo}>
            <Slideshow size={20} weight="light" />
            Post Builder
          </div>
          {posts.filter(p => p.stato === 'Programmato').length > 0 && (
            <span className={styles.badgeProgrammati}>
              {posts.filter(p => p.stato === 'Programmato').length} programmati
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button type="button" className="btn-outline-accent" onClick={apriNuovoPost}>
            <Plus size={15} /> Nuovo post
          </button>
          <button className="btn-icon" onClick={carica} title="Ricarica">
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className={styles.filtriRow}>
        {[
          ['tutti',       'Tutti'],
          ['Bozza',       'Bozze'],
          ['Programmato', 'Programmati'],
          ['Pubblicato',  'Pubblicati'],
          ['Errore',      'Errori'],
        ].map(([v, l]) => (
          <button
            key={v}
            className={`${styles.tab} ${filtroStato === v ? styles.tabActive : ''}`}
            onClick={() => setFiltroStato(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Lista post */}
      {loading ? (
        <div className={styles.empty}>Caricamento post…</div>
      ) : postFiltrati.length === 0 ? (
        <div className={styles.emptyState}>
          <Slideshow size={48} weight="thin" style={{ opacity: 0.25 }} />
          <p className={styles.emptyTitolo}>Nessun post trovato</p>
          <p className={styles.emptySub}>
            Clicca <strong>Nuovo post</strong> per creare il tuo primo carosello.
          </p>
          <button className="btn-primary" onClick={apriNuovoPost}>
            <Plus size={14} /> Crea il primo post
          </button>
        </div>
      ) : (
        <div className={styles.postList}>
          {postFiltrati.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={apriModificaPost}
              onElimina={handleElimina}
              onPubblica={handlePubblicaPost}
            />
          ))}
        </div>
      )}

      {/* Info tecnica */}
      <div className={styles.infoBox}>
        <strong>Cron:</strong> <code>pubblica-social-schedulato</code> gira ogni ora e pubblica automaticamente i post programmati. ·{' '}
        <strong>Env:</strong> <code>AIRTABLE_SOCIAL_POSTS</code> (nome tabella, default "SocialPosts") ·{' '}
        <strong>Dipendenza:</strong> <code>npm install html-to-image</code> nella cartella dashboard.
      </div>
    </div>
  )
}
