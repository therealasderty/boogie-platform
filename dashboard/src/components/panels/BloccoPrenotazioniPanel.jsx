import { useState } from 'react'
import { useBloccoPrenotazioni } from '../../hooks/useBloccoPrenotazioni'
import { IconEdit, IconClose, IconCalendarX } from '../../icons/index.jsx'
import styles from './BloccoPrenotazioniPanel.module.css'

const FASCE = ['Pranzo', 'Cena']
const EMPTY_FORM = { descrizione: '', dataInizio: '', dataFine: '', fasce: [] }

function FormFields({ form, setForm, toggleFascia }) {
  return (
    <>
      <div className={styles.field}>
        <label>Descrizione (nota interna)</label>
        <input
          value={form.descrizione}
          onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))}
          placeholder="Es. Cena di Natale prenotata interamente"
        />
      </div>
      <div className={styles.field}>
        <label>Data inizio</label>
        <input type="date" value={form.dataInizio} onChange={e => setForm(p => ({ ...p, dataInizio: e.target.value }))} />
        <label style={{ marginTop: '10px' }}>Data fine</label>
        <input type="date" value={form.dataFine} onChange={e => setForm(p => ({ ...p, dataFine: e.target.value }))} />
      </div>
      <div className={styles.field}>
        <label>Fasce bloccate (vuoto = tutto il giorno)</label>
        <div className={styles.toggleGroup}>
          {FASCE.map(f => (
            <button key={f} type="button"
              className={`btn-toggle ${form.fasce.includes(f) ? 'active' : ''}`}
              onClick={() => toggleFascia(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function EditModal({ form, setForm, toggleFascia, onSubmit, onClose, submitting, msg }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitolo}><IconEdit size={16} /> Modifica blocco</div>
          <button className="btn-icon" onClick={onClose}><IconClose size={16} weight="regular" /></button>
        </div>
        <div className={styles.modalBody}>
          <FormFields form={form} setForm={setForm} toggleFascia={toggleFascia} />
          <div className={styles.formActions}>
            <button type="button" className="btn-primary" disabled={submitting} onClick={onSubmit}>
              {submitting ? 'Salvataggio...' : 'Aggiorna blocco'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
          </div>
          {msg && <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>}
        </div>
      </div>
    </div>
  )
}

function BloccoItem({ blocco, onEdit, onElimina }) {
  const fasceTesto = blocco.fasce?.length > 0 ? blocco.fasce.join(', ') : 'Tutto il giorno'
  const dataTesto = blocco.dataInizio
    ? `${blocco.dataInizio}${blocco.dataFine && blocco.dataFine !== blocco.dataInizio ? ` → ${blocco.dataFine}` : ''}`
    : '—'

  return (
    <div className={styles.item}>
      <div className={styles.itemLeft}>
        <div>
          <div className={styles.itemDesc}>{blocco.descrizione || '—'}</div>
          <div className={styles.itemMeta}>{dataTesto} · {fasceTesto}</div>
        </div>
      </div>
      <div className={styles.itemActions}>
        <button className="btn-icon" onClick={() => onEdit(blocco)}>
          <IconEdit size={14} />
        </button>
        <button className="btn-icon danger" onClick={() => onElimina(blocco.id)}>
          <IconClose size={14} weight="regular" />
        </button>
      </div>
    </div>
  )
}

export default function BloccoPrenotazioniPanel() {
  const { blocchi, loading, ricarica, salva, elimina } = useBloccoPrenotazioni()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [editMsg, setEditMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleFascia(f) {
    setForm(prev => ({ ...prev, fasce: prev.fasce.includes(f) ? prev.fasce.filter(x => x !== f) : [...prev.fasce, f] }))
  }
  function toggleEditFascia(f) {
    setEditForm(prev => ({ ...prev, fasce: prev.fasce.includes(f) ? prev.fasce.filter(x => x !== f) : [...prev.fasce, f] }))
  }
  function startEdit(blocco) {
    setEditId(blocco.id)
    setEditForm({ descrizione: blocco.descrizione || '', dataInizio: blocco.dataInizio || '', dataFine: blocco.dataFine || '', fasce: blocco.fasce || [] })
    setEditMsg(null)
  }
  function closeEdit() { setEditId(null); setEditForm(EMPTY_FORM); setEditMsg(null) }

  async function handleSubmitNew(e) {
    e.preventDefault()
    if (!form.descrizione) { setMsg({ type: 'err', text: 'Inserisci una descrizione' }); return }
    if (!form.dataInizio)  { setMsg({ type: 'err', text: 'Inserisci una data inizio' }); return }
    if (form.dataFine && form.dataFine < form.dataInizio) {
      setMsg({ type: 'err', text: 'La data fine non può essere prima della data inizio' }); return
    }
    setSubmitting(true)
    const res = await salva({ descrizione: form.descrizione, dataInizio: form.dataInizio, dataFine: form.dataFine || form.dataInizio, fasce: form.fasce }, null)
    setSubmitting(false)
    if (res.success) { setMsg({ type: 'ok', text: 'Blocco aggiunto' }); setForm(EMPTY_FORM); ricarica() }
    else { setMsg({ type: 'err', text: `Errore: ${JSON.stringify(res.airtableError || res)}` }) }
  }

  async function handleSubmitEdit() {
    if (!editForm.descrizione) { setEditMsg({ type: 'err', text: 'Inserisci una descrizione' }); return }
    if (!editForm.dataInizio)  { setEditMsg({ type: 'err', text: 'Inserisci una data inizio' }); return }
    if (editForm.dataFine && editForm.dataFine < editForm.dataInizio) {
      setEditMsg({ type: 'err', text: 'La data fine non può essere prima della data inizio' }); return
    }
    setSubmitting(true)
    const res = await salva({ descrizione: editForm.descrizione, dataInizio: editForm.dataInizio, dataFine: editForm.dataFine || editForm.dataInizio, fasce: editForm.fasce }, editId)
    setSubmitting(false)
    if (res.success) { closeEdit(); ricarica() }
    else { setEditMsg({ type: 'err', text: 'Errore — riprova' }) }
  }

  async function handleElimina(id) {
    if (!confirm('Eliminare questo blocco?')) return
    await elimina(id); ricarica()
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          <IconCalendarX size={20} />
          Blocco Prenotazioni
        </h1>
      </div>
      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmitNew}>
          <div className={styles.formTitle}>+ Nuovo blocco</div>
          <FormFields form={form} setForm={setForm} toggleFascia={toggleFascia} />
          <div className={styles.formActions}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvataggio...' : 'Aggiungi blocco'}
            </button>
          </div>
          {msg && <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>}
        </form>

        {loading && <div className={styles.empty}>Caricamento...</div>}
        {!loading && blocchi.length === 0 && <div className={styles.empty}>Nessun blocco attivo</div>}

        {!loading && blocchi.length > 0 && (
          <>
            <div className={styles.listaTitle}>Blocchi attivi</div>
            <div className={styles.lista}>
              {blocchi.map(b => (
                <BloccoItem key={b.id} blocco={b} onEdit={startEdit} onElimina={handleElimina} />
              ))}
            </div>
          </>
        )}
      </div>

      {editId && (
        <EditModal form={editForm} setForm={setEditForm} toggleFascia={toggleEditFascia}
          onSubmit={handleSubmitEdit} onClose={closeEdit} submitting={submitting} msg={editMsg} />
      )}
    </div>
  )
}
