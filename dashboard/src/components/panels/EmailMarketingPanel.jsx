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
  UploadSimple, Eye, FloppyDisk, ListBullets, Quotes, Users,
} from '@phosphor-icons/react'
import { authFetch } from '../../lib/authFetch'
import { MediaLibraryModal } from './BlocchiEditor'
import styles from './EmailMarketingPanel.module.css'

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
  { type: 'intestazione',        label: 'Titolo',        Icon: TextT },
  { type: 'intestazione-piccola',label: 'Sottotitolo',   Icon: TextT },
  { type: 'testo',               label: 'Testo',         Icon: TextT },
  { type: 'immagine',            label: 'Immagine',      Icon: Image },
  { type: 'evidenza',            label: 'Evidenza',      Icon: Quotes },
  { type: 'lista',               label: 'Lista',         Icon: ListBullets },
  { type: 'pulsante',            label: 'Pulsante CTA',  Icon: CursorClick },
  { type: 'separatore',          label: 'Separatore',    Icon: Minus },
]

const DEFAULT_BLOCKS = {
  intestazione:         { type: 'intestazione',         testo: 'Ciao {nome},' },
  'intestazione-piccola':{ type: 'intestazione-piccola', testo: 'Sottotitolo sezione' },
  testo:                { type: 'testo',                contenuto: 'Scrivi il tuo messaggio qui...' },
  immagine:             { type: 'immagine',             url: '', alt: '', link: '' },
  evidenza:             { type: 'evidenza',             contenuto: 'Testo in evidenza, offerta speciale o informazione importante.' },
  lista:                { type: 'lista',                voci: 'Prima voce\nSeconda voce\nTerza voce' },
  pulsante:             { type: 'pulsante',             testo: 'Scopri di più', href: 'https://boogiebistrot.com', stile: 'brand' },
  separatore:           { type: 'separatore' },
}

function uid() { return Math.random().toString(36).slice(2, 9) }

// ─── Preview HTML email ───────────────────────────────────────────────────────

const FONT_STACK = "'Raleway',Arial,sans-serif"
const CG = '#C4913A', CD = '#1A1610', CB = '#4A4030', CMUTED = '#8B6F47'
const CBG = '#F5F0E8', CLINE = '#D4C9B0', CFOOT = '#B0A898'
const LOGO_URL = 'https://boogiebistrot.com/logo-email.png'

function renderBlockHtml(b, nome = 'Mario') {
  const sub = s => (s || '').replace(/\{nome\}/gi, nome)
  switch (b.type) {
    case 'intestazione':
      return `<h2 style="font-family:${FONT_STACK};font-size:22px;font-weight:600;color:${CD};margin:0 0 20px;text-align:center;">${sub(b.testo)}</h2>`
    case 'intestazione-piccola':
      return `<h3 style="font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${CD};margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">${sub(b.testo)}</h3>`
    case 'testo':
      return `<p style="font-family:${FONT_STACK};font-size:15px;line-height:1.8;color:${CB};margin:0 0 20px;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p>`
    case 'immagine': {
      if (!b.url) return `<p style="font-size:12px;color:${CMUTED};font-style:italic;text-align:center;margin-bottom:20px;">[Immagine: inserisci URL]</p>`
      const img = `<img src="${b.url}" alt="${b.alt || ''}" width="440" style="display:block;width:100%;max-width:440px;border:0;margin:0 auto 20px;">`
      return b.link ? `<a href="${b.link}" style="display:block;text-decoration:none;">${img}</a>` : img
    }
    case 'evidenza':
      return `<table cellpadding="0" cellspacing="0" width="100%" style="background:${CBG};border-left:3px solid ${CG};margin-bottom:24px;"><tr><td style="padding:16px 20px;"><p style="font-family:${FONT_STACK};font-size:15px;line-height:1.7;color:${CB};margin:0;">${sub(b.contenuto || '').replace(/\n/g, '<br>')}</p></td></tr></table>`
    case 'lista': {
      const voci = (b.voci || '').split('\n').filter(v => v.trim())
      const items = voci.map(v => `<li style="font-family:${FONT_STACK};font-size:15px;line-height:1.8;color:${CB};margin-bottom:6px;">${sub(v.trim())}</li>`).join('')
      return `<ul style="margin:0 0 20px;padding-left:20px;">${items}</ul>`
    }
    case 'pulsante': {
      let bg = CG, color = CD, border = ''
      if (b.stile === 'dark')  { bg = CD;   color = 'white' }
      if (b.stile === 'light') { bg = CBG;  border = ';border:1px solid ' + CLINE }
      return `<p style="text-align:center;margin:0 0 24px;"><a href="${b.href || '#'}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;padding:12px 28px;font-family:${FONT_STACK};font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px${border};">${b.testo || 'Clicca qui'}</a></p>`
    }
    case 'separatore':
      return `<hr style="border:none;border-top:1px solid ${CLINE};margin:24px 0;">`
    default: return ''
  }
}

function buildPreviewHtml(blocks) {
  const body = blocks.map(b => renderBlockHtml(b)).join('\n')
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
  function set(key, val) { onChange({ ...block, [key]: val }) }

  switch (block.type) {
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
            <button className="btn-secondary btn-sm" type="button" onClick={() => setMostraMedia(true)}>
              <Images size={14} /> Libreria
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
          <label className={styles.fieldLabel}>Voci <span className={styles.hint}>(una per riga)</span></label>
          <textarea className={styles.fieldTextarea} value={block.voci || ''} onChange={e => set('voci', e.target.value)} rows={5} placeholder={'Prima voce\nSeconda voce\nTerza voce'} />
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
    case 'separatore':
      return <p className={styles.separatorNote}>Linea di separazione orizzontale.</p>
    default:
      return null
  }
}

// ─── Tab Template ─────────────────────────────────────────────────────────────

function TemplateTab({ campagna, onSaved }) {
  const [blocks, setBlocks]       = useState(() => {
    try { return JSON.parse(campagna.template || '[]').map(b => ({ ...b, _id: uid() })) }
    catch { return [] }
  })
  const [saving, setSaving]       = useState(false)
  const [preview, setPreview]     = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  function addBlock(type) {
    const b = { ...DEFAULT_BLOCKS[type], _id: uid() }
    setBlocks(prev => [...prev, b])
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

  async function salvaTemplate() {
    setSaving(true)
    try {
      const clean = blocks.map(({ _id, ...b }) => b)
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'campagna', id: campagna.id, template: clean }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSaved(data.campagna)
    } catch (e) {
      alert('Errore salvataggio template: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const cleanBlocks = blocks.map(({ _id, ...b }) => b)

  return (
    <div className={styles.templateTab}>
      {/* Toolbar blocchi */}
      <div className={styles.blockToolbar}>
        <span className={styles.toolbarLabel}>Aggiungi blocco:</span>
        {BLOCK_TYPES.map(({ type, label, Icon }) => (
          <button key={type} className="btn-secondary btn-sm" onClick={() => addBlock(type)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Lista blocchi */}
      <div className={styles.blockList}>
        {blocks.length === 0 && (
          <p className={styles.emptyBlocks}>
            Nessun blocco ancora. Aggiungi un'intestazione per iniziare.
          </p>
        )}
        {blocks.map((b, idx) => {
          const cfg = BLOCK_TYPES.find(t => t.type === b.type)
          const isOpen = expandedId === b._id
          return (
            <div key={b._id} className={`${styles.blockCard} ${isOpen ? styles.blockCardOpen : ''}`}>
              <div className={styles.blockHeader} onClick={() => setExpandedId(isOpen ? null : b._id)}>
                <span className={styles.blockType}>{cfg?.label || b.type}</span>
                <div className={styles.blockActions}>
                  <button className="btn-icon btn-sm" title="Su" onClick={e => { e.stopPropagation(); moveBlock(b._id, -1) }} disabled={idx === 0}>
                    <ArrowUp size={13} />
                  </button>
                  <button className="btn-icon btn-sm" title="Giù" onClick={e => { e.stopPropagation(); moveBlock(b._id, 1) }} disabled={idx === blocks.length - 1}>
                    <ArrowDown size={13} />
                  </button>
                  <button className="btn-icon btn-sm danger" title="Rimuovi" onClick={e => { e.stopPropagation(); removeBlock(b._id) }}>
                    <Trash size={13} />
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

      {/* Azioni */}
      <div className={styles.templateActions}>
        <button className="btn-secondary" onClick={() => setPreview(p => !p)}>
          <Eye size={15} /> {preview ? 'Chiudi anteprima' : 'Anteprima email'}
        </button>
        <button className="btn-primary" onClick={salvaTemplate} disabled={saving}>
          <FloppyDisk size={15} /> {saving ? 'Salvataggio...' : 'Salva template'}
        </button>
      </div>

      {/* Preview iframe */}
      {preview && (
        <div className={styles.previewWrap}>
          <p className={styles.previewLabel}>Anteprima — come appare nella inbox</p>
          <iframe
            className={styles.previewIframe}
            title="Anteprima email"
            srcDoc={buildPreviewHtml(cleanBlocks)}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  )
}

// ─── Tab Contatti ─────────────────────────────────────────────────────────────

function ContattiTab({ campagna }) {
  const [contatti, setContatti]         = useState([])
  const [stats, setStats]               = useState(null)
  const [nextCursor, setNextCursor]     = useState(null)
  const [loadingList, setLoadingList]   = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [csvText, setCsvText]           = useState('')
  const [maxPerGiorno, setMaxPerGiorno] = useState(200)
  const [importing, setImporting]       = useState(false)
  const [importMsg, setImportMsg]       = useState(null)

  const loadContatti = useCallback(async (cursor = null, replace = true) => {
    if (replace) setLoadingList(true); else setLoadingMore(true)
    try {
      const url = `/.netlify/functions/gestisci-campagne-mail?tipo=contatti&campagnaId=${campagna.id}${cursor ? '&cursor=' + cursor : ''}`
      const res  = await authFetch(url)
      const data = await res.json()
      if (data.success) {
        setContatti(prev => replace ? data.contatti : [...prev, ...data.contatti])
        setNextCursor(data.nextCursor || null)
      }
    } finally {
      setLoadingList(false); setLoadingMore(false)
    }
  }, [campagna.id])

  const loadStats = useCallback(async () => {
    const res  = await authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=${campagna.id}`)
    const data = await res.json()
    if (data.success) setStats(data.stats)
  }, [campagna.id])

  useEffect(() => {
    loadContatti()
    loadStats()
  }, [loadContatti, loadStats])

  async function handleImport() {
    const lines = csvText.trim().split('\n').filter(Boolean)
    if (!lines.length) return

    const contatti = lines.map(line => {
      const [email, nome, azienda] = line.split(',').map(s => s.trim())
      return { email, nome: nome || '', azienda: azienda || '' }
    }).filter(c => c.email && c.email.includes('@'))

    if (!contatti.length) {
      setImportMsg({ tipo: 'errore', testo: 'Nessun email valida trovata. Formato: email,nome,azienda (uno per riga)' })
      return
    }

    setImporting(true)
    setImportMsg(null)
    try {
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'importa-contatti', campagnaId: campagna.id, contatti, maxPerGiorno }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setImportMsg({ tipo: 'ok', testo: `${data.importati} contatti importati. Prima email domani mattina.` })
      setCsvText('')
      await loadContatti()
      await loadStats()
    } catch (e) {
      setImportMsg({ tipo: 'errore', testo: e.message })
    } finally {
      setImporting(false)
    }
  }

  async function eliminaContatto(id) {
    if (!confirm('Eliminare questo contatto?')) return
    await authFetch(`/.netlify/functions/gestisci-campagne-mail?tipo=contatto&id=${id}`, { method: 'DELETE' })
    setContatti(prev => prev.filter(c => c.id !== id))
    await loadStats()
  }

  const STATO_COLOR = { DaInviare: 'var(--text3)', Inviato: 'var(--success)', Errore: 'var(--danger)' }

  return (
    <div className={styles.contattiTab}>
      {/* Importa da lista globale */}
      <AggiungiDaGlobaliBox campagnaId={campagna.id} onAdded={() => { loadContatti(); loadStats() }} />

      {/* Stats */}
      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{stats.totale}</span>
            <span className={styles.statLabel}>Totale</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: 'var(--success)' }}>{stats.Inviato}</span>
            <span className={styles.statLabel}>Inviati</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: 'var(--accent)' }}>{stats.DaInviare}</span>
            <span className={styles.statLabel}>In coda</span>
          </div>
          {stats.Errore > 0 && (
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: 'var(--danger)' }}>{stats.Errore}</span>
              <span className={styles.statLabel}>Errori</span>
            </div>
          )}
          {stats.oggiDaInviare > 0 && (
            <div className={`${styles.statCard} ${styles.statCardOggi}`}>
              <span className={styles.statNum} style={{ color: 'var(--accent)' }}>{stats.oggiDaInviare}</span>
              <span className={styles.statLabel}>Da inviare oggi</span>
            </div>
          )}
        </div>
      )}

      {/* Import */}
      <div className={styles.importBox}>
        <h3 className={styles.importTitle}>
          <UploadSimple size={16} /> Importa contatti
        </h3>
        <p className={styles.importHint}>
          Un contatto per riga, formato: <code>email,nome,azienda</code><br />
          Es: <code>mario@esempio.it,Mario Rossi,Rossi &amp; Co.</code>
        </p>
        <textarea
          className={styles.csvTextarea}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={6}
          placeholder={'mario@esempio.it,Mario Rossi,Rossi & Co.\nluisa@esempio.it,Luisa Bianchi,Studio Bianchi\n...'}
        />
        <div className={styles.importRow}>
          <label className={styles.maxLabel}>
            Max per giorno:
            <input
              type="number" min={1} max={200}
              className={styles.maxInput}
              value={maxPerGiorno}
              onChange={e => setMaxPerGiorno(Math.min(200, Math.max(1, Number(e.target.value))))}
            />
          </label>
          <button className="btn-accent" onClick={handleImport} disabled={importing || !csvText.trim()}>
            <UploadSimple size={14} /> {importing ? 'Importazione...' : 'Importa'}
          </button>
        </div>
        {importMsg && (
          <p className={importMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
            {importMsg.testo}
          </p>
        )}
      </div>

      {/* Lista */}
      <div className={styles.contattiList}>
        <h3 className={styles.listTitle}>Contatti ({stats?.totale ?? contatti.length})</h3>
        {loadingList ? (
          <p className={styles.loading}>Caricamento...</p>
        ) : contatti.length === 0 ? (
          <p className={styles.emptyList}>Nessun contatto ancora. Importa il primo lotto.</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome / Azienda</th>
                  <th>Email</th>
                  <th>Stato</th>
                  <th>Data programm.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contatti.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.contattoNome}>{c.nome || '—'}</div>
                      {c.azienda && <div className={styles.contattoAzienda}>{c.azienda}</div>}
                    </td>
                    <td>{c.email}</td>
                    <td>
                      <span className={styles.contattoStato} style={{ color: STATO_COLOR[c.stato] }}>
                        {c.stato === 'DaInviare' ? 'In coda' : c.stato}
                      </span>
                    </td>
                    <td>{c.dataProgrammata || '—'}</td>
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
              <button className="btn-secondary btn-sm" onClick={() => loadContatti(nextCursor, false)} disabled={loadingMore}>
                {loadingMore ? 'Caricamento...' : 'Carica altri'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Aggiungi contatti da lista globale (dentro ContattiTab) ─────────────────

function AggiungiDaGlobaliBox({ campagnaId, onAdded }) {
  const [expanded, setExpanded]       = useState(false)
  const [countGlobali, setCountGlobali] = useState(null)
  const [maxPerGiorno, setMaxPerGiorno] = useState(200)
  const [copying, setCopying]         = useState(false)
  const [msg, setMsg]                 = useState(null)

  useEffect(() => {
    authFetch('/.netlify/functions/gestisci-campagne-mail?tipo=statistiche&campagnaId=global')
      .then(r => r.json())
      .then(d => { if (d.success) setCountGlobali(d.stats.totale) })
  }, [])

  async function handleCopia() {
    setCopying(true); setMsg(null)
    try {
      const res  = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'copia-globali-in-campagna', campagnaId, maxPerGiorno }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      if (data.copiati === 0) {
        setMsg({ tipo: 'errore', testo: 'Lista globale vuota. Vai nella scheda Contatti dalla home per aggiungerne.' })
      } else {
        setMsg({ tipo: 'ok', testo: `${data.copiati} contatti copiati con scheduling automatico.` })
        onAdded()
      }
    } catch (e) {
      setMsg({ tipo: 'errore', testo: e.message })
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className={styles.globaliBox}>
      <div className={styles.globaliBoxTitle}>
        <span className={styles.globaliLabel}>
          <Users size={15} /> Lista globale
          {countGlobali !== null && (
            <span className={styles.countBadge}>{countGlobali} contatti</span>
          )}
        </span>
        <button className="btn-secondary btn-sm" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Chiudi' : 'Importa da lista globale'}
        </button>
      </div>
      {expanded && (
        <div className={styles.globaliBoxExpanded}>
          {countGlobali === 0 ? (
            <p className={styles.importHint}>
              La lista globale è vuota. Vai nella scheda <strong>Contatti</strong> dalla home per aggiungere contatti.
            </p>
          ) : (
            <>
              <p className={styles.importHint}>
                Copia tutti i {countGlobali} contatti dalla lista globale in questa campagna con scheduling automatico.
              </p>
              <div className={styles.importRow}>
                <label className={styles.maxLabel}>
                  Max per giorno:
                  <input
                    type="number" min={1} max={200}
                    className={styles.maxInput}
                    value={maxPerGiorno}
                    onChange={e => setMaxPerGiorno(Math.min(200, Math.max(1, Number(e.target.value))))}
                  />
                </label>
                <button className="btn-accent" onClick={handleCopia} disabled={copying}>
                  <Users size={14} /> {copying ? 'Copia in corso...' : 'Copia in questa campagna'}
                </button>
              </div>
            </>
          )}
          {msg && (
            <p className={msg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>{msg.testo}</p>
          )}
        </div>
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
    const lines = csvText.trim().split('\n').filter(Boolean)
    if (!lines.length) return
    const parsed = lines.map(line => {
      const [email, nome, azienda] = line.split(',').map(s => s.trim())
      return { email, nome: nome || '', azienda: azienda || '' }
    }).filter(c => c.email && c.email.includes('@'))
    if (!parsed.length) {
      setImportMsg({ tipo: 'errore', testo: 'Nessun email valida trovata.' })
      return
    }
    setImporting(true); setImportMsg(null)
    try {
      const res  = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'importa-contatti', campagnaId: 'global', contatti: parsed, maxPerGiorno: 99999 }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setImportMsg({ tipo: 'ok', testo: `${data.importati} contatti aggiunti alla lista.` })
      setCsvText('')
      await loadAll()
    } catch (e) {
      setImportMsg({ tipo: 'errore', testo: e.message })
    } finally {
      setImporting(false)
    }
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
          Un contatto per riga: <code>email,nome,azienda</code>
        </p>
        <textarea
          className={styles.csvTextarea}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={5}
          placeholder={'mario@esempio.it,Mario Rossi\nluisa@esempio.it,Luisa Bianchi,Studio Bianchi'}
        />
        <div className={styles.importRow}>
          <span />
          <button className="btn-accent" onClick={handleImport} disabled={importing || !csvText.trim()}>
            <UploadSimple size={14} /> {importing ? 'Aggiunta...' : 'Aggiungi alla lista'}
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
                  <th>Nome / Azienda</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contatti.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.contattoNome}>{c.nome || '—'}</div>
                      {c.azienda && <div className={styles.contattoAzienda}>{c.azienda}</div>}
                    </td>
                    <td>{c.email}</td>
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

// ─── Tab Info / Riepilogo ─────────────────────────────────────────────────────

function InfoTab({ campagna, onSaved }) {
  const [form, setForm] = useState({
    titolo:      campagna.titolo,
    oggettoMail: campagna.oggettoMail,
    stato:       campagna.stato,
  })
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function salva() {
    setSaving(true)
    try {
      const res = await authFetch('/.netlify/functions/gestisci-campagne-mail', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'campagna', id: campagna.id, ...form }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSaved(data.campagna)
    } catch (e) {
      alert('Errore: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.infoTab}>
      <ProgressoCampagna campagnaId={campagna.id} />

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.fieldLabel}>Nome campagna</label>
          <input className={styles.fieldInput} value={form.titolo} onChange={e => set('titolo', e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.fieldLabel}>Oggetto email</label>
          <input className={styles.fieldInput} value={form.oggettoMail} onChange={e => set('oggettoMail', e.target.value)} placeholder="Es: Ti aspettiamo al Boogie!" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.fieldLabel}>Stato</label>
          <select className={styles.fieldSelect} value={form.stato} onChange={e => set('stato', e.target.value)}>
            {STATI_CAMPAGNA.map(s => <option key={s} value={s}>{STATI_BADGE[s]?.label || s}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.infoNote}>
        <p><strong>Invio automatico:</strong> ogni mattina alle 10:00 vengono inviati fino a 200 email ai contatti in coda.</p>
        <p>Per avviare la campagna imposta lo stato su <strong>In corso</strong> e assicurati di aver importato i contatti.</p>
      </div>

      <button className="btn-primary" onClick={salva} disabled={saving}>
        <FloppyDisk size={15} /> {saving ? 'Salvataggio...' : 'Salva'}
      </button>
    </div>
  )
}

// ─── Dettaglio campagna ───────────────────────────────────────────────────────

function DettaglioCampagna({ campagna: initialCampagna, onBack, onDeleted }) {
  const [campagna, setCampagna] = useState(initialCampagna)
  const [tab, setTab] = useState('info')
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
      {/* Header */}
      <div className={styles.dettaglioHeader}>
        <button className="btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Campagne
        </button>
        <div className={styles.dettaglioTitolo}>
          <h2 className={styles.pageTitle}>{campagna.titolo}</h2>
          <StatoBadge stato={campagna.stato} />
        </div>
        <button className="btn-icon danger" onClick={elimina} disabled={deleting} title="Elimina campagna">
          <Trash size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'info',      label: 'Info & Stato' },
          { key: 'template',  label: 'Template Email' },
          { key: 'contatti',  label: 'Contatti' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn-toggle ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenuto tab */}
      {tab === 'info'     && <InfoTab      campagna={campagna} onSaved={setCampagna} />}
      {tab === 'template' && <TemplateTab  campagna={campagna} onSaved={setCampagna} />}
      {tab === 'contatti' && <ContattiTab  campagna={campagna} />}
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
          <p className={styles.pageSubtitle}>Crea campagne, costruisci template e invia fino a 200 email al giorno.</p>
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
