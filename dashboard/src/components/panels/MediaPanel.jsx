import { useState, useEffect, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMedia } from '../../hooks/useMedia'
import { IconImages, IconPlus, IconTrash, IconEdit, IconRefresh, IconClose, IconCheck } from '../../icons/index.jsx'

const AIRTABLE_TOKEN   = import.meta.env.VITE_AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const CL_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CL_PRESET        = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function useCloudinaryUpload(onUpload, onError) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const onUploadRef = useRef(onUpload)
  const onErrorRef  = useRef(onError)
  useEffect(() => { onUploadRef.current = onUpload }, [onUpload])
  useEffect(() => { onErrorRef.current  = onError  }, [onError])

  function open() { inputRef.current?.click() }

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (!CL_CLOUD_NAME || !CL_PRESET) throw new Error('Env VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET non configurate')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', CL_PRESET)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CL_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.secure_url) {
        onUploadRef.current(data.secure_url)
      } else {
        const msg = data.error?.message || JSON.stringify(data)
        onErrorRef.current?.(msg)
        console.error('Cloudinary error:', data)
      }
    } catch (err) {
      onErrorRef.current?.(err.message)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const input = <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
  return { open, input, uploading }
}
const BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`
const AT_HEADERS = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' }

const inputStyle = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '8px 10px', fontSize: '0.88rem', color: 'var(--text)',
  fontFamily: 'var(--font-body)', background: 'var(--bg-input)', outline: 'none',
  boxSizing: 'border-box',
}

const EMPTY_FORM = { nome: '', url: '', alt: '', tag: '', soloMobile: false }

// ─── Modale aggiunta / modifica ──────────────────────────────────────────────
function MediaModal({ item, onClose, onSave, tagEsistenti = [] }) {
  const isNew = !item?.id
  const [form, setForm] = useState(
    isNew ? EMPTY_FORM : { nome: item.nome, url: item.url, alt: item.alt, tag: item.tag.join(', '), soloMobile: item.soloMobile ?? false }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const { open: openWidget, input: cloudinaryInput, uploading } = useCloudinaryUpload(
    url => { setForm(f => ({ ...f, url })); setError(null) },
    msg => setError(`Upload fallito: ${msg}`)
  )

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function toggleTag(t) {
    const attuali = form.tag ? form.tag.split(',').map(x => x.trim()).filter(Boolean) : []
    const nuovi = attuali.includes(t) ? attuali.filter(x => x !== t) : [...attuali, t]
    set('tag', nuovi.join(', '))
  }

  const tagAttivi = form.tag ? form.tag.split(',').map(x => x.trim()).filter(Boolean) : []

  async function salva() {
    if (!form.url.trim()) { setError('URL obbligatorio'); return }
    setSaving(true)
    setError(null)
    const fields = {
      'Nome':        form.nome.trim(),
      'URL':         form.url.trim(),
      'Alt text':    form.alt.trim(),
      'Tag':         form.tag.trim(),
      'Solo Mobile': form.soloMobile,
    }
    try {
      const res = await fetch(
        isNew ? `${BASE}/Media` : `${BASE}/Media/${item.id}`,
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
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '90%', maxWidth: 480, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
            {isNew ? 'Aggiungi immagine' : 'Modifica immagine'}
          </span>
          <button type="button" className="btn-icon" onClick={onClose} style={{ padding: '4px 8px' }}><IconClose size={14} /></button>
        </div>

        {/* Form */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {form.url && (
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <img src={form.url} alt={form.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Immagine *</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://res.cloudinary.com/boogie-bistrot/..." />
              {cloudinaryInput}
              <button type="button" className="btn-secondary" onClick={openWidget} disabled={uploading} style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Caricamento…' : '↑ Carica'}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Nome</label>
            <input style={inputStyle} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="es. hero-interno" />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Alt text (SEO)</label>
            <input style={inputStyle} value={form.alt} onChange={e => set('alt', e.target.value)} placeholder="es. Interno del Boogie Bistrot di sera" />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Tag</label>
            {tagEsistenti.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {tagEsistenti.map(t => {
                  const attivo = tagAttivi.includes(t)
                  return (
                    <button
                      key={t} type="button" onClick={() => toggleTag(t)}
                      style={{
                        fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999, cursor: 'pointer',
                        border: `1px solid ${attivo ? 'var(--accent)' : 'var(--border)'}`,
                        background: attivo ? 'var(--accent)' : 'var(--bg2)',
                        color: attivo ? '#fff' : 'var(--text2)',
                        fontWeight: attivo ? 700 : 400,
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            )}
            <input style={inputStyle} value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="Oppure scrivi un nuovo tag…" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: form.soloMobile ? 'rgba(180,145,80,0.08)' : 'var(--bg2)' }}>
            <input
              type="checkbox"
              checked={form.soloMobile}
              onChange={e => set('soloMobile', e.target.checked)}
              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Solo mobile</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text3)' }}>Nascosta su desktop — utile per foto verticali</p>
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

// ─── Card sortable ────────────────────────────────────────────────────────────
function SortableMediaCard({ item, onEdit, onDelete, sortable }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <MediaCard item={item} onEdit={onEdit} onDelete={onDelete} sortable={sortable} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// ─── Card singola immagine ────────────────────────────────────────────────────
function MediaCard({ item, onEdit, onDelete, sortable, dragHandleProps }) {
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm]   = useState(false)

  async function elimina() {
    setDeleting(true)
    try {
      await fetch(`${BASE}/Media/${item.id}`, { method: 'DELETE', headers: AT_HEADERS })
      onDelete()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg3)' }}>
        <img src={item.url} alt={item.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '8px 10px', flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.nome || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Senza nome</span>}
        </p>
        {item.alt && (
          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.alt}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {item.soloMobile && (
            <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              solo mobile
            </span>
          )}
          {item.tag.map(t => (
            <span key={t} style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 999, background: 'var(--accent-muted, rgba(180,145,80,0.15))', color: 'var(--accent)', border: '1px solid var(--accent-border, rgba(180,145,80,0.25))' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
        {!confirm && sortable && (
          <div {...dragHandleProps} title="Trascina per riordinare"
            style={{ cursor: 'grab', padding: '4px 6px', color: 'var(--text3)', display: 'flex', alignItems: 'center', height: 28 }}>
            ⠿
          </div>
        )}
        {!confirm && (
          <button type="button" className="btn-icon" onClick={() => onEdit(item)} title="Modifica"
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, height: 28 }}>
            <IconEdit size={13} /> Modifica
          </button>
        )}
        <div style={{ flex: 1 }} />
        {confirm ? (
          <>
            <button type="button" className="btn-icon danger" onClick={elimina} disabled={deleting}
              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, height: 28 }}>
              <IconCheck size={13} /> {deleting ? '…' : 'Conferma'}
            </button>
            <button type="button" className="btn-icon" onClick={() => setConfirm(false)}
              style={{ padding: '4px 8px', height: 28, display: 'flex', alignItems: 'center' }}>
              <IconClose size={13} />
            </button>
          </>
        ) : (
          <button type="button" className="btn-icon danger" onClick={() => setConfirm(true)} title="Elimina"
            style={{ padding: '4px 8px', height: 28, display: 'flex', alignItems: 'center' }}>
            <IconTrash size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pannello principale ──────────────────────────────────────────────────────
export default function MediaPanel() {
  const { items, loading, refetch } = useMedia()
  const [cerca, setCerca]           = useState('')
  const [tagAttivo, setTagAttivo]   = useState(null)
  const [modale, setModale]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [rinominaTag, setRinominaTag] = useState(null) // { vecchio, nuovo }
  const [eliminaTagNome, setEliminaTagNome] = useState(null)

  async function handleRinominaTag() {
    if (!rinominaTag?.vecchio || !rinominaTag?.nuovo?.trim()) return
    const { vecchio, nuovo } = rinominaTag
    const nuovoTrimmed = nuovo.trim()
    if (vecchio === nuovoTrimmed) { setRinominaTag(null); return }

    const daAggiornare = items.filter(m => m.tag.includes(vecchio))
    if (daAggiornare.length === 0) { setRinominaTag(null); return }

    setSaving(true)
    try {
      const chunks = []
      for (let i = 0; i < daAggiornare.length; i += 10)
        chunks.push(daAggiornare.slice(i, i + 10))
      for (const chunk of chunks) {
        await fetch(`${BASE}/Media`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({
            records: chunk.map(m => ({
              id: m.id,
              fields: { 'Tag': m.tag.map(t => t === vecchio ? nuovoTrimmed : t).join(', ') },
            })),
          }),
        })
      }
      if (tagAttivo === vecchio) setTagAttivo(nuovoTrimmed)
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      setRinominaTag(null)
    }
  }

  async function handleEliminaTag() {
    if (!eliminaTagNome) return
    const daAggiornare = items.filter(m => m.tag.includes(eliminaTagNome))
    setSaving(true)
    try {
      const chunks = []
      for (let i = 0; i < daAggiornare.length; i += 10)
        chunks.push(daAggiornare.slice(i, i + 10))
      for (const chunk of chunks) {
        await fetch(`${BASE}/Media`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({
            records: chunk.map(m => ({
              id: m.id,
              fields: { 'Tag': m.tag.filter(t => t !== eliminaTagNome).join(', ') },
            })),
          }),
        })
      }
      if (tagAttivo === eliminaTagNome) setTagAttivo(null)
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      setEliminaTagNome(null)
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const tuttiTag = [...new Set(items.flatMap(m => m.tag))].sort()

  const filtrati = items.filter(m => {
    const matchTag   = !tagAttivo || m.tag.includes(tagAttivo)
    const matchCerca = !cerca || m.nome.toLowerCase().includes(cerca.toLowerCase()) || m.alt.toLowerCase().includes(cerca.toLowerCase())
    return matchTag && matchCerca
  })

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filtrati.findIndex(m => m.id === active.id)
    const newIndex = filtrati.findIndex(m => m.id === over.id)
    const riordinati = arrayMove(filtrati, oldIndex, newIndex)

    setSaving(true)
    try {
      // Salva il nuovo ordine su Airtable (massimo 10 record per chiamata)
      const chunks = []
      for (let i = 0; i < riordinati.length; i += 10)
        chunks.push(riordinati.slice(i, i + 10))
      for (const chunk of chunks) {
        await fetch(`${BASE}/Media`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({
            records: chunk.map((m, idx) => ({
              id: m.id,
              fields: { 'Ordine': filtrati.indexOf(m) === -1 ? m.ordine : (riordinati.indexOf(m) + 1) },
            })),
          }),
        })
      }
      // Patch più preciso: assegna ordine 1,2,3... ai riordinati
      await fetch(`${BASE}/Media`, {
        method: 'PATCH',
        headers: AT_HEADERS,
        body: JSON.stringify({
          records: riordinati.map((m, idx) => ({ id: m.id, fields: { 'Ordine': idx + 1 } })),
        }),
      })
      await refetch()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  function onSave() { refetch(); setModale(null) }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <IconImages size={20} />
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1 }}>Libreria Media</h2>
        <button type="button" className="btn-icon" onClick={refetch} title="Aggiorna" style={{ padding: '6px 10px' }}>
          <IconRefresh size={15} />
        </button>
        <button type="button" className="btn-primary" onClick={() => setModale('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <IconPlus size={14} /> Aggiungi
        </button>
      </div>

      {/* Ricerca + filtri tag */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <input
          style={{ ...inputStyle, maxWidth: 320 }}
          value={cerca}
          onChange={e => setCerca(e.target.value)}
          placeholder="Cerca per nome o alt text…"
        />
        {tagAttivo && saving && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text3)', margin: 0 }}>Salvataggio ordine…</p>
        )}
        {tuttiTag.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => setTagAttivo(null)}
              style={{
                fontSize: '0.75rem', padding: '3px 10px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--border)',
                background: tagAttivo === null ? 'var(--accent)' : 'var(--bg2)',
                color: tagAttivo === null ? '#fff' : 'var(--text2)',
                fontWeight: tagAttivo === null ? 700 : 400,
              }}
            >
              Tutti ({items.length})
            </button>
            {tuttiTag.map(t => {
              const count = items.filter(m => m.tag.includes(t)).length
              const attivo = tagAttivo === t
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => setTagAttivo(attivo ? null : t)}
                    style={{
                      fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px 0 0 999px', cursor: 'pointer',
                      border: '1px solid var(--border)', borderRight: 'none',
                      background: attivo ? 'var(--accent)' : 'var(--bg2)',
                      color: attivo ? '#000' : 'var(--text2)',
                      fontWeight: attivo ? 600 : 400,
                    }}
                  >
                    {t} ({count})
                  </button>
                  <button
                    type="button"
                    title="Rinomina tag"
                    onClick={() => setRinominaTag({ vecchio: t, nuovo: t })}
                    style={{
                      fontSize: '0.68rem', padding: '3px 7px', borderRadius: '0 999px 999px 0', cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: attivo ? 'var(--accent)' : 'var(--bg2)',
                      color: attivo ? '#000' : 'var(--text3)',
                    }}
                  >
                    ✎
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stato */}
      {loading && <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Caricamento…</p>}
      {!loading && items.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
          Nessuna immagine nella libreria. Clicca <strong>Aggiungi</strong> per iniziare.
        </p>
      )}
      {!loading && items.length > 0 && filtrati.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Nessun risultato per "{cerca}".</p>
      )}

      {/* Griglia */}
      {tagAttivo ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtrati.map(m => m.id)} strategy={rectSortingStrategy}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtrati.map(m => (
                <SortableMediaCard key={m.id} item={m} onEdit={item => setModale(item)} onDelete={refetch} sortable />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtrati.map(m => (
            <MediaCard key={m.id} item={m} onEdit={item => setModale(item)} onDelete={refetch} />
          ))}
        </div>
      )}

      {/* Modale */}
      {modale && (
        <MediaModal
          item={modale === 'new' ? null : modale}
          onClose={() => setModale(null)}
          onSave={onSave}
          tagEsistenti={tuttiTag}
        />
      )}

      {/* Modale elimina tag */}
      {eliminaTagNome && (
        <div
          onClick={() => setEliminaTagNome(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '90%', maxWidth: 360, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Elimina tag</span>
              <button type="button" className="btn-icon" onClick={() => setEliminaTagNome(null)} style={{ padding: '4px 8px' }}><IconClose size={14} /></button>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text2)' }}>
                Rimuovi il tag <strong style={{ color: 'var(--text)' }}>{eliminaTagNome}</strong> da tutti i{' '}
                <strong>{items.filter(m => m.tag.includes(eliminaTagNome)).length}</strong> media che ce l'hanno?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--text3)' }}>
                Le foto non vengono eliminate, solo il tag viene rimosso.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-secondary" onClick={() => setEliminaTagNome(null)}>Annulla</button>
              <button type="button" className="btn-primary danger" onClick={handleEliminaTag} disabled={saving}
                style={{ background: 'var(--danger, #f87171)', color: '#fff', border: 'none' }}>
                {saving ? 'Rimozione…' : 'Elimina tag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale rinomina tag */}
      {rinominaTag && (
        <div
          onClick={() => setRinominaTag(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '90%', maxWidth: 360, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Rinomina tag</span>
              <button type="button" className="btn-icon" onClick={() => setRinominaTag(null)} style={{ padding: '4px 8px' }}><IconClose size={14} /></button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
                  Nuovo nome — verrà aggiornato su tutti i {items.filter(m => m.tag.includes(rinominaTag.vecchio)).length} media con questo tag
                </label>
                <input
                  style={inputStyle}
                  value={rinominaTag.nuovo}
                  onChange={e => setRinominaTag(r => ({ ...r, nuovo: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleRinominaTag() }}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <button type="button" className="btn-icon danger" onClick={() => setEliminaTagNome(rinominaTag.vecchio)}
                style={{ padding: '4px 8px' }} title="Elimina tag">
                <IconTrash size={14} />
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-secondary" onClick={() => setRinominaTag(null)}>Annulla</button>
              <button type="button" className="btn-primary" onClick={handleRinominaTag} disabled={saving}>
                {saving ? 'Salvataggio…' : 'Rinomina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
