import { useState } from 'react'
import { useRecensioniSito } from '../../hooks/useRecensioniSito'
import {
  IconStar, IconEdit, IconTrash, IconPlus,
  IconClose, IconCheck, IconRefresh, IconEye, IconEyeSlash,
} from '../../icons/index.jsx'

const AIRTABLE_TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`
const AT_HEADERS = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const inputStyle = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '8px 10px', fontSize: '0.88rem', color: 'var(--text)',
  fontFamily: 'var(--font-body)', background: 'var(--bg-input)', outline: 'none',
  boxSizing: 'border-box',
}

const EMPTY_FORM = { nome: '', piattaforma: 'Google', stelle: 5, testo: '', data: '', attivo: true }

// ─── Stelle cliccabili ────────────────────────────────────────────────────────
function StelleEditor({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= (hover || value)
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: filled ? 'var(--accent)' : 'var(--border)',
            }}
          >
            <IconStar size={20} weight={filled ? 'fill' : 'light'} />
          </button>
        )
      })}
    </div>
  )
}

// ─── Stelle display ───────────────────────────────────────────────────────────
function StelleDisplay({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <IconStar key={i} size={12} weight={i <= n ? 'fill' : 'light'} style={{ color: i <= n ? 'var(--accent)' : 'var(--border)' }} />
      ))}
    </div>
  )
}

// ─── Icona piattaforma ────────────────────────────────────────────────────────
function BadgePiattaforma({ piattaforma }) {
  const isGoogle = piattaforma === 'Google'
  return (
    <span style={{
      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600,
      background: isGoogle ? 'rgba(66,133,244,0.12)' : 'rgba(0,175,135,0.12)',
      color: isGoogle ? '#4285F4' : '#00AF87',
      border: `1px solid ${isGoogle ? 'rgba(66,133,244,0.25)' : 'rgba(0,175,135,0.25)'}`,
    }}>
      {piattaforma}
    </span>
  )
}

// ─── Modale aggiunta / modifica ───────────────────────────────────────────────
function RecensioneModal({ item, onClose, onSave }) {
  const isNew = !item?.id
  const [form, setForm] = useState(
    isNew ? EMPTY_FORM : {
      nome:        item.nome,
      piattaforma: item.piattaforma,
      stelle:      item.stelle,
      testo:       item.testo,
      data:        item.data,
      attivo:      item.attivo,
    }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function salva() {
    if (!form.nome.trim()) { setError('Il nome è obbligatorio'); return }
    if (!form.testo.trim()) { setError('Il testo è obbligatorio'); return }
    setSaving(true)
    setError(null)
    const fields = {
      'Nome':        form.nome.trim(),
      'Piattaforma': form.piattaforma,
      'Stelle':      form.stelle,
      'Testo':       form.testo.trim(),
      'Data':        form.data.trim(),
      'Attivo':      form.attivo,
    }
    try {
      const res = await fetch(
        isNew ? `${BASE}/RecensioniSito` : `${BASE}/RecensioniSito/${item.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({ fields }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      onSave()
    } catch (e) {
      setError('Errore durante il salvataggio')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '90%', maxWidth: 500, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
            {isNew ? 'Aggiungi recensione' : 'Modifica recensione'}
          </span>
          <button type="button" className="btn-icon" onClick={onClose} style={{ padding: '4px 8px' }}>
            <IconClose size={14} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Nome *</label>
            <input
              style={inputStyle}
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="es. Mario R."
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Piattaforma</label>
            <select
              style={{ ...inputStyle }}
              value={form.piattaforma}
              onChange={e => set('piattaforma', e.target.value)}
            >
              <option value="Google">Google</option>
              <option value="TripAdvisor">TripAdvisor</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Stelle</label>
            <StelleEditor value={form.stelle} onChange={v => set('stelle', v)} />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Testo *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={form.testo}
              onChange={e => set('testo', e.target.value)}
              placeholder="Testo della recensione…"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Data</label>
            <input
              style={inputStyle}
              value={form.data}
              onChange={e => set('data', e.target.value)}
              placeholder="es. Marzo 2025"
            />
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: form.attivo ? 'rgba(180,145,80,0.08)' : 'var(--bg2)',
          }}>
            <input
              type="checkbox"
              checked={form.attivo}
              onChange={e => set('attivo', e.target.checked)}
              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Visibile sul sito</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text3)' }}>Se disattivato la recensione non compare sul sito</p>
            </div>
          </label>

          {error && <p style={{ fontSize: '0.82rem', color: 'var(--danger, #f87171)', margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
          <button type="button" className="btn-primary" onClick={salva} disabled={saving}>
            {saving ? 'Salvataggio…' : isNew ? 'Aggiungi' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card singola recensione ──────────────────────────────────────────────────
function RecensioneCard({ item, onEdit, onDelete, onToggle }) {
  const [confirm, setConfirm]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function elimina() {
    setDeleting(true)
    try {
      await fetch(`${BASE}/RecensioniSito/${item.id}`, { method: 'DELETE', headers: AT_HEADERS })
      onDelete()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }

  async function toggleAttivo() {
    setToggling(true)
    try {
      await fetch(`${BASE}/RecensioniSito/${item.id}`, {
        method: 'PATCH',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields: { 'Attivo': !item.attivo } }),
      })
      onToggle()
    } catch (e) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  const testoTroncato = item.testo.length > 120 ? item.testo.slice(0, 120) + '…' : item.testo

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      background: 'var(--bg2)', display: 'flex', flexDirection: 'column',
      opacity: item.attivo ? 1 : 0.6,
    }}>
      {/* Body */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{item.nome}</span>
          <BadgePiattaforma piattaforma={item.piattaforma} />
          <StelleDisplay n={item.stelle} />
          {item.data && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 'auto' }}>{item.data}</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          {testoTroncato}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
        <button
          type="button"
          className="btn-icon"
          onClick={toggleAttivo}
          disabled={toggling}
          title={item.attivo ? 'Visibile — clicca per nascondere' : 'Nascosta — clicca per mostrare'}
          style={item.attivo ? { color: '#2E7D32', background: 'rgba(46,125,50,0.1)', borderColor: 'rgba(46,125,50,0.25)' } : {}}
        >
          {item.attivo ? <IconEye size={15} /> : <IconEyeSlash size={15} />}
        </button>

        {!confirm && (
          <button type="button" className="btn-icon" onClick={() => onEdit(item)} title="Modifica">
            <IconEdit size={15} />
          </button>
        )}

        <div style={{ flex: 1 }} />

        {confirm ? (
          <>
            <button type="button" className="btn-icon danger" onClick={elimina} disabled={deleting}>
              <IconCheck size={15} />
            </button>
            <button type="button" className="btn-icon" onClick={() => setConfirm(false)}>
              <IconClose size={15} />
            </button>
          </>
        ) : (
          <button type="button" className="btn-icon danger" onClick={() => setConfirm(true)} title="Elimina">
            <IconTrash size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pannello principale ──────────────────────────────────────────────────────
export default function RecensioniSitoPanel() {
  const { items, loading, refetch } = useRecensioniSito()
  const [modale, setModale] = useState(null)

  function onSave() { refetch(); setModale(null) }

  const attive   = items.filter(r => r.attivo).length
  const inattive = items.filter(r => !r.attivo).length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <IconStar size={20} />
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1 }}>Recensioni</h2>
        {!loading && items.length > 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
            {attive} attive{inattive > 0 ? `, ${inattive} nascoste` : ''}
          </span>
        )}
        <button type="button" className="btn-icon" onClick={refetch} title="Aggiorna" style={{ padding: '6px 10px' }}>
          <IconRefresh size={15} />
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setModale('new')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <IconPlus size={14} /> Aggiungi
        </button>
      </div>

      {/* Stato */}
      {loading && <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Caricamento…</p>}
      {!loading && items.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
          Nessuna recensione ancora. Clicca <strong>Aggiungi</strong> per iniziare.
        </p>
      )}

      {/* Lista */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <RecensioneCard
              key={item.id}
              item={item}
              onEdit={i => setModale(i)}
              onDelete={refetch}
              onToggle={refetch}
            />
          ))}
        </div>
      )}

      {/* Modale */}
      {modale && (
        <RecensioneModal
          item={modale === 'new' ? null : modale}
          onClose={() => setModale(null)}
          onSave={onSave}
        />
      )}
    </div>
  )
}
