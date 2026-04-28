import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFaq } from '../../hooks/useFaq'
import { IconEdit, IconTrash, IconClose, IconPlus, IconDrag, IconEye, IconEyeSlash, IconFaq } from '../../icons/index.jsx'
import RichTextEditor from './RichTextEditor'
import styles from './FaqPanel.module.css'

// ─── Modal add/edit ───────────────────────────────────────────────────────────
function Modal({ item, salva, onClose, onSaved }) {
  const [form, setForm] = useState(item
    ? { domanda: item.domanda, risposta: item.risposta, attivo: item.attivo }
    : { domanda: '', risposta: '', attivo: true }
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.domanda.trim()) { setErr('La domanda è obbligatoria.'); return }
    setSaving(true)
    const payload = { ...form, ordine: item?.ordine ?? 0 }
    const res = await salva(payload, item?.id || null)
    setSaving(false)
    if (res.success) { onSaved() } else { setErr('Errore nel salvataggio.') }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitolo}>{item ? 'Modifica domanda' : 'Nuova domanda'}</span>
          <button className="btn-icon" onClick={onClose}><IconClose size={16} weight="regular" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.field}>
              <label>Domanda *</label>
              <textarea
                value={form.domanda}
                onChange={e => setForm(p => ({ ...p, domanda: e.target.value }))}
                placeholder="Es. È necessario prenotare?"
                rows={2}
              />
            </div>
            <div className={styles.field}>
              <label>Risposta</label>
              <RichTextEditor
                value={form.risposta}
                onChange={val => setForm(p => ({ ...p, risposta: val }))}
              />
            </div>
            {err && <div className={`${styles.msg} ${styles.err}`} style={{ margin: 0 }}>{err}</div>}
            <div className={styles.modalActions}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Riga sortable ────────────────────────────────────────────────────────────
function SortableRow({ item, onEdit, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        <IconDrag size={16} />
      </span>

      <div className={styles.itemBody}>
        <div className={styles.itemDomanda}>{item.domanda}</div>
        {item.risposta && <div className={styles.itemRisposta}>{item.risposta}</div>}
      </div>

      <div className={styles.itemActions}>
        <button
          className={`${styles.toggleBtn} ${item.attivo ? styles.toggleOn : styles.toggleOff}`}
          onClick={() => onToggle(item)}
          title={item.attivo ? 'Visibile — clicca per nascondere' : 'Nascosta — clicca per mostrare'}
        >
          {item.attivo ? <IconEye size={15} /> : <IconEyeSlash size={15} />}
        </button>
        <button className="btn-icon" onClick={() => onEdit(item)} title="Modifica">
          <IconEdit size={15} />
        </button>
        <button className="btn-icon btn-icon-danger" onClick={() => onDelete(item)} title="Elimina">
          <IconTrash size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Panel principale ─────────────────────────────────────────────────────────
export default function FaqPanel() {
  const { faq, loading, ricarica, salva, elimina, aggiornaOrdine, toggleAttivo } = useFaq()
  const [modal, setModal] = useState(null) // null | 'new' | item
  const [msg, setMsg] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  }))

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = faq.findIndex(f => f.id === active.id)
    const newIndex  = faq.findIndex(f => f.id === over.id)
    const riordinati = arrayMove(faq, oldIndex, newIndex)
    await aggiornaOrdine(riordinati)
    ricarica()
  }

  async function handleToggle(item) {
    await toggleAttivo(item)
    ricarica()
  }

  async function handleElimina(item) {
    if (!confirm(`Eliminare "${item.domanda}"?`)) return
    const res = await elimina(item.id)
    if (res.success) {
      ricarica()
      flash({ ok: true, text: 'Domanda eliminata.' })
    } else {
      flash({ ok: false, text: "Errore nell'eliminazione." })
    }
  }

  function flash(m) {
    setMsg(m)
    setTimeout(() => setMsg(null), 3000)
  }

  function handleSaved() {
    setModal(null)
    ricarica()
    flash({ ok: true, text: 'Salvato con successo.' })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}><IconFaq size={18} /> Domande frequenti (FAQ)</div>
        <button
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setModal('new')}
        >
          <IconPlus size={15} /> Nuova domanda
        </button>
      </div>

      {msg && <div className={`${styles.msg} ${msg.ok ? styles.ok : styles.err}`}>{msg.text}</div>}

      {loading ? (
        <div className={styles.empty}>Caricamento…</div>
      ) : faq.length === 0 ? (
        <div className={styles.empty}>Nessuna domanda ancora. Aggiungine una con il pulsante qui sopra.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={faq.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.lista}>
              {faq.map(item => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onEdit={setModal}
                  onToggle={handleToggle}
                  onDelete={handleElimina}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal && (
        <Modal
          item={modal === 'new' ? null : modal}
          salva={salva}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
