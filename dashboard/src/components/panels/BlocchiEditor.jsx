import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import { useMedia } from '../../hooks/useMedia'
import {
  IconNote, IconImages, IconForkKnife, IconMusicNote, IconTag,
  IconClose, IconEdit, IconTrash, IconArrowUp, IconArrowDown,
} from '../../icons/index.jsx'

const TIPI = [
  { tipo: 'testo',         label: 'Testo',           Icon: IconNote },
  { tipo: 'immagine',      label: 'Immagine',         Icon: IconImages },
  { tipo: 'menu',          label: 'Menù',             Icon: IconForkKnife },
  { tipo: 'artista',       label: 'Artista / Ospite', Icon: IconMusicNote },
  { tipo: 'card-offerte',  label: 'Offerte serata',   Icon: IconForkKnife },
  { tipo: 'prezzo',        label: 'Prezzo',           Icon: IconTag },
]

function nuovoBlocco(tipo) {
  const id = Math.random().toString(36).slice(2, 9)
  switch (tipo) {
    case 'testo':    return { id, tipo, titolo: '', contenuto: '' }
    case 'immagine': return { id, tipo, url: '', alt: '' }
    case 'menu':     return { id, tipo, titolo: '', sezioni: [] }
    case 'artista':       return { id, tipo, nome: '', bio: '', foto: '' }
    case 'card-offerte':  return { id, tipo, titolo: '', voci: [] }
    case 'prezzo':        return { id, tipo, titolo: '', importo: '', voci: [] }
    default:              return { id, tipo }
  }
}

function sommario(b) {
  switch (b.tipo) {
    case 'testo':    return b.contenuto ? b.contenuto.slice(0, 55) + (b.contenuto.length > 55 ? '…' : '') : '(vuoto)'
    case 'immagine': return b.url || '(nessuna URL)'
    case 'menu': {
      if (b.sezioni?.length) {
        const n = b.sezioni.reduce((acc, s) => acc + (s.voci?.length || 0), 0)
        return `${b.sezioni.length} sezioni, ${n} piatti${b.titolo ? ` — "${b.titolo}"` : ''}`
      }
      return `${b.voci?.length || 0} voci${b.titolo ? ` — "${b.titolo}"` : ''}`
    }
    case 'artista':      return b.nome || '(nessun nome)'
    case 'card-offerte': return b.voci?.length ? b.voci.join(' · ') : '(nessuna selezione)'
    case 'prezzo':       return b.importo ? `${b.importo}${b.titolo ? ` — ${b.titolo}` : ''}` : b.titolo || '(nessun prezzo)'
    default:             return ''
  }
}

// ─── Form per tipo ───────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '8px 10px', fontSize: '0.88rem', color: 'var(--text)',
  fontFamily: 'var(--font-body)', background: 'var(--bg-input)', outline: 'none',
}
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 80 }

function FormTesto({ b, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        style={inputStyle}
        value={b.titolo || ''}
        onChange={e => onChange({ ...b, titolo: e.target.value })}
        placeholder="Titolo sezione h2 (opzionale)"
      />
      <RichTextEditor
        value={b.contenuto}
        onChange={html => onChange({ ...b, contenuto: html })}
      />
    </div>
  )
}

export function MediaLibraryModal({ onSelect, onClose }) {
  const { items, loading } = useMedia()
  const [cerca, setCerca] = useState('')

  const filtrati = items.filter(m =>
    m.nome.toLowerCase().includes(cerca.toLowerCase()) ||
    m.tag.some(t => t.toLowerCase().includes(cerca.toLowerCase()))
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', width: '90%', maxWidth: 720,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Libreria immagini</span>
          <input
            style={{ ...inputStyle, width: 220 }}
            value={cerca}
            onChange={e => setCerca(e.target.value)}
            placeholder="Cerca per nome o tag…"
            autoFocus
          />
          <button type="button" className="btn-icon" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {/* Griglia */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Caricamento…</p>}
          {!loading && filtrati.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Nessuna immagine trovata.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {filtrati.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg2)', padding: 0, cursor: 'pointer',
                  overflow: 'hidden', textAlign: 'left', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg3)' }}>
                  <img src={m.url} alt={m.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.nome}
                  </p>
                  {m.tag.length > 0 && (
                    <p style={{ fontSize: '0.68rem', color: 'var(--text3)', margin: '2px 0 0' }}>
                      {m.tag.join(', ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FormImmagine({ b, onChange }) {
  const [mostraModale, setMostraModale] = useState(false)

  function seleziona(m) {
    onChange({ ...b, url: m.url, alt: m.alt })
    setMostraModale(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={b.url}
          onChange={e => onChange({ ...b, url: e.target.value })}
          placeholder="URL immagine"
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setMostraModale(true)}
          style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <IconImages size={14} /> Libreria
        </button>
      </div>
      {b.url && (
        <img src={b.url} alt={b.alt || ''} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
      )}
      <input
        style={inputStyle}
        value={b.alt}
        onChange={e => onChange({ ...b, alt: e.target.value })}
        placeholder="Descrizione immagine (alt text)"
      />
      {mostraModale && <MediaLibraryModal onSelect={seleziona} onClose={() => setMostraModale(false)} />}
    </div>
  )
}

const MACRO_CAT_MENU = ['Antipasti', 'Primi', 'Secondi', 'Dolci']

function FormMenu({ b, onChange }) {
  // Normalizza: sezioni (nuovo) ha priorità su voci flat (legacy)
  const sezioni = b.sezioni !== undefined
    ? b.sezioni
    : (b.voci?.length ? [{ titolo: '', voci: b.voci }] : [])

  function updateSezioni(newSezioni) {
    onChange({ ...b, sezioni: newSezioni })
  }
  function aggiungiSezione(titolo = '') {
    updateSezioni([...sezioni, { titolo, voci: [] }])
  }
  function aggiornaSezione(si, titolo) {
    const s = [...sezioni]; s[si] = { ...s[si], titolo }; updateSezioni(s)
  }
  function rimuoviSezione(si) {
    const s = [...sezioni]; s.splice(si, 1); updateSezioni(s)
  }
  function aggiungiVoce(si) {
    const s = [...sezioni]
    s[si] = { ...s[si], voci: [...(s[si].voci || []), { nome: '', descrizione: '', prezzo: '' }] }
    updateSezioni(s)
  }
  function aggiornaVoce(si, vi, field, val) {
    const s = [...sezioni]
    const voci = [...(s[si].voci || [])]; voci[vi] = { ...voci[vi], [field]: val }
    s[si] = { ...s[si], voci }; updateSezioni(s)
  }
  function rimuoviVoce(si, vi) {
    const s = [...sezioni]
    const voci = [...(s[si].voci || [])]; voci.splice(vi, 1)
    s[si] = { ...s[si], voci }; updateSezioni(s)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input style={inputStyle} value={b.titolo || ''} onChange={e => onChange({ ...b, titolo: e.target.value })} placeholder="Titolo menù (es. Menù della serata)" />
      {sezioni.map((s, si) => (
        <div key={si} style={{ border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={s.titolo || ''}
              onChange={e => aggiornaSezione(si, e.target.value)}
              placeholder="Nome sezione (es. Antipasti)"
            />
            <button type="button" className="btn-icon danger" onClick={() => rimuoviSezione(si)} style={{ padding: '4px 8px' }}>✕</button>
          </div>
          {(s.voci || []).map((v, vi) => (
            <div key={vi} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, alignItems: 'start' }}>
              <input style={{ ...inputStyle, gridColumn: '1 / 2' }} value={v.nome || ''} onChange={e => aggiornaVoce(si, vi, 'nome', e.target.value)} placeholder="Nome piatto" />
              <input style={{ ...inputStyle, width: 90 }} value={v.prezzo || ''} onChange={e => aggiornaVoce(si, vi, 'prezzo', e.target.value)} placeholder="Prezzo" />
              <button type="button" className="btn-icon danger" onClick={() => rimuoviVoce(si, vi)} style={{ padding: '4px 8px' }}>✕</button>
              <input style={{ ...inputStyle, gridColumn: '1 / -1' }} value={v.descrizione || ''} onChange={e => aggiornaVoce(si, vi, 'descrizione', e.target.value)} placeholder="Descrizione (opzionale)" />
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => aggiungiVoce(si)} style={{ alignSelf: 'flex-start', fontSize: '0.82rem' }}>
            + Piatto
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MACRO_CAT_MENU.map(cat => (
          <button key={cat} type="button" className="btn-secondary" onClick={() => aggiungiSezione(cat)} style={{ fontSize: '0.8rem', padding: '5px 11px' }}>
            + {cat}
          </button>
        ))}
        <button type="button" className="btn-secondary" onClick={() => aggiungiSezione()} style={{ fontSize: '0.8rem', padding: '5px 11px' }}>
          + Sezione…
        </button>
      </div>
    </div>
  )
}

function FormArtista({ b, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input style={inputStyle} value={b.nome || ''} onChange={e => onChange({ ...b, nome: e.target.value })} placeholder="Nome artista / ospite" />
      <input style={inputStyle} value={b.foto || ''} onChange={e => onChange({ ...b, foto: e.target.value })} placeholder="URL foto (opzionale)" />
      <textarea style={textareaStyle} value={b.bio || ''} onChange={e => onChange({ ...b, bio: e.target.value })} placeholder="Breve bio..." />
    </div>
  )
}

const OFFERTE_OPZIONI = [
  { key: 'carta',     label: 'Specialità alla carta' },
  { key: 'pizza',     label: 'Pizza' },
  { key: 'aperitivo', label: 'Apericena del Boogie' },
  { key: 'birre',     label: 'Birre' },
  { key: 'vini',      label: 'Carta dei Vini' },
  { key: 'cocktails', label: 'Cocktail' },
]

function FormCardOfferte({ b, onChange }) {
  const selezionate = b.voci || []
  function toggle(key) {
    const nuove = selezionate.includes(key)
      ? selezionate.filter(k => k !== key)
      : [...selezionate, key]
    onChange({ ...b, voci: nuove })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        style={inputStyle}
        value={b.titolo || ''}
        onChange={e => onChange({ ...b, titolo: e.target.value })}
        placeholder="Titolo sezione (opzionale, es. Cosa trovi questa sera)"
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {OFFERTE_OPZIONI.map(o => {
          const attivo = selezionate.includes(o.key)
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle(o.key)}
              style={{
                fontSize: '0.8rem', padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${attivo ? 'var(--accent)' : 'var(--border)'}`,
                background: attivo ? 'var(--accent)' : 'var(--bg)',
                color: attivo ? '#fff' : 'var(--text2)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {selezionate.length === 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', margin: 0 }}>Seleziona almeno una card.</p>
      )}
    </div>
  )
}

function FormPrezzo({ b, onChange }) {
  function aggiungiVoce() {
    onChange({ ...b, voci: [...(b.voci || []), ''] })
  }
  function aggiornaVoce(i, val) {
    const voci = [...(b.voci || [])]
    voci[i] = val
    onChange({ ...b, voci })
  }
  function rimuoviVoce(i) {
    const voci = [...(b.voci || [])]
    voci.splice(i, 1)
    onChange({ ...b, voci })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input
          style={inputStyle}
          value={b.importo || ''}
          onChange={e => onChange({ ...b, importo: e.target.value })}
          placeholder="Prezzo (es. 26€)"
        />
        <input
          style={inputStyle}
          value={b.titolo || ''}
          onChange={e => onChange({ ...b, titolo: e.target.value })}
          placeholder="Etichetta (es. Apericena)"
        />
      </div>
      {(b.voci || []).map((v, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
          <input
            style={inputStyle}
            value={v}
            onChange={e => aggiornaVoce(i, e.target.value)}
            placeholder="Cosa è incluso…"
          />
          <button type="button" className="btn-icon danger" onClick={() => rimuoviVoce(i)} style={{ padding: '4px 8px' }}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={aggiungiVoce} style={{ alignSelf: 'flex-start', fontSize: '0.82rem' }}>
        + Aggiungi voce
      </button>
    </div>
  )
}

function FormBlocco({ b, onChange }) {
  switch (b.tipo) {
    case 'testo':    return <FormTesto b={b} onChange={onChange} />
    case 'immagine': return <FormImmagine b={b} onChange={onChange} />
    case 'menu':     return <FormMenu b={b} onChange={onChange} />
    case 'artista':      return <FormArtista b={b} onChange={onChange} />
    case 'card-offerte': return <FormCardOfferte b={b} onChange={onChange} />
    case 'prezzo':       return <FormPrezzo b={b} onChange={onChange} />
    default:             return null
  }
}

// ─── Editor principale ───────────────────────────────────────────────────────

export default function BlocchiEditor({ blocchi = [], onChange }) {
  const [aperto, setAperto] = useState(null)

  function aggiungi(tipo) {
    const b = nuovoBlocco(tipo)
    onChange([...blocchi, b])
    setAperto(b.id)
  }

  function aggiorna(blocco) {
    onChange(blocchi.map(b => b.id === blocco.id ? blocco : b))
  }

  function rimuovi(id) {
    onChange(blocchi.filter(b => b.id !== id))
    if (aperto === id) setAperto(null)
  }

  function sposta(i, dir) {
    const arr = [...blocchi]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    onChange(arr)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {blocchi.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '0.82rem', fontStyle: 'italic', padding: '4px 0' }}>
          Nessuna sezione — usa i pulsanti sotto per aggiungere contenuti alla pagina pubblica.
        </p>
      )}

      {blocchi.map((b, i) => {
        const info = TIPI.find(t => t.tipo === b.tipo)
        const isOpen = aperto === b.id
        return (
          <div key={b.id} style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: isOpen ? 'var(--bg2)' : 'var(--bg3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap',
              }}>
                {info?.Icon && <info.Icon size={13} />} {info?.label?.toUpperCase()}
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sommario(b)}
              </span>
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                <button type="button" className="btn-icon" onClick={() => sposta(i, -1)} disabled={i === 0} title="Sposta su"><IconArrowUp size={13} /></button>
                <button type="button" className="btn-icon" onClick={() => sposta(i, 1)} disabled={i === blocchi.length - 1} title="Sposta giù"><IconArrowDown size={13} /></button>
                <button type="button" className="btn-icon" onClick={() => setAperto(isOpen ? null : b.id)} title={isOpen ? 'Chiudi' : 'Modifica'}>
                  {isOpen ? <IconClose size={13} /> : <IconEdit size={13} />}
                </button>
                <button type="button" className="btn-icon danger" onClick={() => rimuovi(b.id)} title="Elimina blocco"><IconTrash size={13} /></button>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
                <FormBlocco b={b} onChange={aggiorna} />
              </div>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: blocchi.length > 0 ? 4 : 0 }}>
        {TIPI.map(t => (
          <button key={t.tipo} type="button" className="btn-secondary" onClick={() => aggiungi(t.tipo)} style={{ fontSize: '0.8rem', padding: '5px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
