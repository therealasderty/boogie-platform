import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBlog } from '../../hooks/useBlog'
import { IconEdit, IconTrash, IconClose, IconPlus, IconDrag, IconEye, IconEyeSlash } from '../../icons/index.jsx'
import RichTextEditor from './RichTextEditor'
import { MediaLibraryModal } from './BlocchiEditor'
import { useMedia } from '../../hooks/useMedia'
import styles from './BlogPanel.module.css'

const CATEGORIE = ['Cucina', 'Pizza', 'Vini', 'Birre', 'Serate', 'Location', 'Stagioni', 'Altro']

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Modal editor ────────────────────────────────────────────────────────────
function Modal({ item, salva, onClose, onSaved, onElimina }) {
  const isEdit = !!item
  const [form, setForm] = useState(item
    ? { ...item }
    : { titolo: '', slug: '', autore: '', dataPubblicazione: '', categoria: '', descrizioneBreve: '', fotoHero: '', contenuto: '', metaTitle: '', metaDescription: '', pubblicato: false }
  )
  const [slugModificato, setSlugModificato] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const [mostraMedia, setMostraMedia] = useState(false)
  const { items: mediaItems } = useMedia()

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleTitolo(e) {
    const v = e.target.value
    set('titolo', v)
    if (!slugModificato) set('slug', toSlug(v))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titolo.trim()) { setErr('Il titolo è obbligatorio.'); return }
    if (!form.slug.trim()) { setErr('Lo slug è obbligatorio.'); return }
    setSaving(true)
    const res = await salva({ ...form, ordine: item?.ordine ?? 0 }, item?.id || null)
    setSaving(false)
    if (res.success) { onSaved() } else { setErr('Errore nel salvataggio.') }
  }

  async function handleElimina() {
    if (!window.confirm(`Eliminare "${form.titolo}"?`)) return
    setSaving(true)
    await onElimina(item.id)
    onSaved()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitolo}>{isEdit ? 'Modifica articolo' : 'Nuovo articolo'}</span>
          <button className="btn-icon" onClick={onClose}><IconClose size={16} weight="regular" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {err && <div className={`${styles.msg} ${styles.err}`}>{err}</div>}

            <div className={styles.field}>
              <label>Titolo *</label>
              <input value={form.titolo} onChange={handleTitolo} placeholder="Es. I segreti del risotto brianzolo" autoFocus />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Slug URL *</label>
                <input
                  value={form.slug}
                  onChange={e => { set('slug', toSlug(e.target.value)); setSlugModificato(true) }}
                  placeholder="es. risotto-brianzolo"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <div className={styles.field}>
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  <option value="">— Scegli —</option>
                  {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Autore</label>
                <input value={form.autore} onChange={e => set('autore', e.target.value)} placeholder="Es. Staff Boogie" />
              </div>
              <div className={styles.field}>
                <label>Data di pubblicazione</label>
                <input type="date" value={form.dataPubblicazione} onChange={e => set('dataPubblicazione', e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Descrizione breve <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(per le card in homepage)</span></label>
              <textarea
                value={form.descrizioneBreve}
                onChange={e => set('descrizioneBreve', e.target.value)}
                rows={2}
                placeholder="Una frase che invoglia a leggere..."
              />
            </div>

            <div className={styles.field}>
              <label>Foto Hero</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <input
                  value={form.fotoHero}
                  onChange={e => set('fotoHero', e.target.value)}
                  placeholder="URL immagine (oppure scegli dalla libreria)"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button type="button" className="btn-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => setMostraMedia(true)}>
                  🖼 Libreria
                </button>
              </div>
              {form.fotoHero && (
                <div style={{ marginTop: 8, position: 'relative', width: '100%', height: 100, borderRadius: 6, overflow: 'hidden', background: 'var(--border)' }}>
                  <img src={form.fotoHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => set('fotoHero', '')}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Contenuto</label>
              <RichTextEditor value={form.contenuto} onChange={v => set('contenuto', v)} />
            </div>

            {/* SEO */}
            <div className={styles.seoSection}>
              <div className={styles.seoTitle}>
                🔍 SEO
                <span style={{ fontWeight: 400, color: 'var(--text3)' }}>— opzionale, se vuoto usa titolo e descrizione breve</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className={styles.field}>
                  <label>Meta Title ({form.metaTitle.length}/60)</label>
                  <input
                    value={form.metaTitle}
                    onChange={e => set('metaTitle', e.target.value)}
                    placeholder={`${form.titolo || 'Titolo articolo'} | Boogie Bistrot`}
                    maxLength={80}
                  />
                </div>
                <div className={styles.field}>
                  <label>Meta Description ({form.metaDescription.length}/160)</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={e => set('metaDescription', e.target.value)}
                    rows={2}
                    placeholder="Breve descrizione per i motori di ricerca..."
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.pubblicato}
                  onChange={e => set('pubblicato', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                Pubblica sul sito
              </label>
            </div>

          </div>

          <div className={styles.modalFooter}>
            <div>
              {isEdit && (
                <button type="button" className="btn-danger" onClick={handleElimina} disabled={saving}>
                  <IconTrash size={14} /> Elimina
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
              <button type="submit" className="btn-primary" disabled={saving || !form.titolo.trim()}>
                {saving ? '...' : isEdit ? 'Salva modifiche' : 'Crea articolo'}
              </button>
            </div>
          </div>
        </form>

        {mostraMedia && (
          <MediaLibraryModal
            onSelect={m => { set('fotoHero', m.url); setMostraMedia(false) }}
            onClose={() => setMostraMedia(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Riga sortable ────────────────────────────────────────────────────────────
function SortableRow({ articolo, onEdit, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: articolo.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <IconDrag size={16} />
      </div>
      <div className={styles.itemBody}>
        <div className={styles.itemTitolo}>{articolo.titolo}</div>
        <div className={styles.itemMeta}>
          {articolo.categoria && (
            <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>{articolo.categoria}</span>
          )}
          {articolo.dataPubblicazione && (
            <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
              {new Date(articolo.dataPubblicazione + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className={`${styles.badge} ${articolo.pubblicato ? styles.badgePubblicato : styles.badgeBozza}`}>
            {articolo.pubblicato ? 'pubblicato' : 'bozza'}
          </span>
        </div>
      </div>
      <div className={styles.itemActions}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${articolo.pubblicato ? styles.toggleOn : styles.toggleOff}`}
          onClick={() => onToggle(articolo)}
          title={articolo.pubblicato ? 'Nascondi' : 'Pubblica'}
        >
          {articolo.pubblicato ? <IconEye size={15} /> : <IconEyeSlash size={15} />}
        </button>
        <button type="button" className="btn-icon" onClick={() => onEdit(articolo)} title="Modifica">
          <IconEdit size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Panel principale ─────────────────────────────────────────────────────────
export default function BlogPanel() {
  const { articoli, loading, carica, salva, elimina, togglePubblicato, aggiornaOrdine } = useBlog()
  const [modalItem, setModalItem] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [msg, setMsg] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function apriNuovo() { setModalItem(null); setModalOpen(true) }
  function apriEdit(item) { setModalItem(item); setModalOpen(true) }
  function chiudiModal() { setModalOpen(false); setModalItem(null) }

  async function handleSaved() {
    chiudiModal()
    await carica()
    showMsg('ok', 'Salvato!')
  }

  async function handleElimina(id) {
    await elimina(id)
    await carica()
    showMsg('ok', 'Articolo eliminato.')
  }

  async function handleToggle(articolo) {
    await togglePubblicato(articolo.id, !articolo.pubblicato)
    await carica()
  }

  async function handleDragEnd(e) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = articoli.findIndex(a => a.id === active.id)
    const newIdx = articoli.findIndex(a => a.id === over.id)
    const nuovo = arrayMove(articoli, oldIdx, newIdx)
    await aggiornaOrdine(nuovo)
    await carica()
  }

  function showMsg(tipo, testo) {
    setMsg({ tipo, testo })
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          ✍️ Blog
        </div>
        <button className="btn-primary" onClick={apriNuovo}>
          <IconPlus size={14} /> Nuovo articolo
        </button>
      </div>

      {msg && (
        <div className={`${styles.msg} ${msg.tipo === 'ok' ? styles.ok : styles.err}`}>
          {msg.testo}
        </div>
      )}

      {loading ? (
        <div className={styles.empty}>Caricamento...</div>
      ) : articoli.length === 0 ? (
        <div className={styles.empty}>Nessun articolo. Crea il primo!</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={articoli.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.lista}>
              {articoli.map(a => (
                <SortableRow key={a.id} articolo={a} onEdit={apriEdit} onToggle={handleToggle} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modalOpen && (
        <Modal
          item={modalItem}
          salva={salva}
          onClose={chiudiModal}
          onSaved={handleSaved}
          onElimina={handleElimina}
        />
      )}
    </div>
  )
}
