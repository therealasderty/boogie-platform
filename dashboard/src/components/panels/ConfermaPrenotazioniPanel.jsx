import { useState, useEffect } from 'react'
import { useConfigurazione } from '../../hooks/useConfigurazione'
import { IconCheck, IconClose, IconInfo, IconPlus } from '../../icons/index.jsx'
import styles from './ConfermaPrenotazioniPanel.module.css'

const EMPTY_FORM = { descrizione: '', dataInizio: '', dataFine: '' }

function InfoModal({ onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitolo}><IconInfo size={16} /> Come funziona</div>
          <button className="btn-icon" onClick={onClose}><IconClose size={16} weight="regular" /></button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.infoText}>
            Quando una prenotazione ricade in una data configurata qui, il cliente non riceve la conferma automatica: riceve un'email "richiesta ricevuta" e tu ricevi un link per confermare manualmente.
          </p>
          <div className={styles.infoSection}>
            <div className={styles.infoSectionTitle}>Come si usa</div>
            <p className={styles.infoText}>
              Aggiungi la data quando sai di avere gruppi o impegni che richiedono attenzione — anche con poco preavviso. Puoi inserire una data singola o un intervallo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDateRange(entry) {
  if (!entry.dataFine || entry.dataFine === entry.dataInizio) return entry.dataInizio
  return `${entry.dataInizio} → ${entry.dataFine}`
}

export default function ConfermaPrenotazioniPanel() {
  const { config: cfg, loading: cfgLoading, salva: salvaCfg } = useConfigurazione()
  const [infoOpen, setInfoOpen] = useState(false)
  const [dateList, setDateList] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!cfgLoading) {
      try {
        setDateList(JSON.parse(cfg['conferma_manuale_date'] ?? '[]') || [])
      } catch {
        setDateList([])
      }
    }
  }, [cfg, cfgLoading])

  async function aggiungiData(e) {
    e.preventDefault()
    if (!form.dataInizio) { setMsg({ type: 'err', text: 'Seleziona almeno la data di inizio' }); return }
    setSubmitting(true)
    setMsg(null)
    const entry = {
      id: Date.now().toString(),
      descrizione: form.descrizione.trim(),
      dataInizio: form.dataInizio,
      dataFine: form.dataFine || form.dataInizio,
    }
    const newList = [...dateList, entry]
    try {
      const res = await salvaCfg('conferma_manuale_date', JSON.stringify(newList))
      if (res.success) {
        setDateList(newList)
        setForm(EMPTY_FORM)
        setMsg({ type: 'ok', text: 'Data aggiunta' })
      } else {
        setMsg({ type: 'err', text: 'Errore — riprova' })
      }
    } catch {
      setMsg({ type: 'err', text: 'Errore — riprova' })
    }
    setSubmitting(false)
  }

  async function rimuoviData(id) {
    const newList = dateList.filter(d => d.id !== id)
    try {
      await salvaCfg('conferma_manuale_date', JSON.stringify(newList))
      setDateList(newList)
    } catch {}
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          <IconCheck size={20} />
          Conferma prenotazioni
        </h1>
        <button className="btn-icon" onClick={() => setInfoOpen(true)} title="Come funziona">
          <IconInfo size={18} />
        </button>
      </div>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={aggiungiData}>
          <div className={styles.formTitle}><IconPlus size={13} /> Nuova data in conferma manuale</div>
          <div className={styles.dateRow}>
            <div className={styles.field}>
              <label>Data inizio</label>
              <input type="date" value={form.dataInizio}
                onChange={e => setForm(p => ({ ...p, dataInizio: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Data fine <span className={styles.optional}>(opzionale — per range)</span></label>
              <input type="date" value={form.dataFine} min={form.dataInizio}
                onChange={e => setForm(p => ({ ...p, dataFine: e.target.value }))} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Nota <span className={styles.optional}>(opzionale)</span></label>
            <input value={form.descrizione} placeholder="Aggiungi una nota"
              onChange={e => setForm(p => ({ ...p, descrizione: e.target.value }))} />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className="btn-primary" disabled={submitting || cfgLoading}>
              {submitting ? 'Salvataggio...' : 'Aggiungi data'}
            </button>
          </div>
          {msg && <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>}
        </form>

        <div className={styles.sectionLabel}>Date attive</div>
        {cfgLoading && <div className={styles.empty}>Caricamento...</div>}
        {!cfgLoading && dateList.length === 0 && (
          <div className={styles.empty}>Nessuna data configurata</div>
        )}
        {!cfgLoading && dateList.length > 0 && (
          <div className={styles.lista}>
            {dateList.map(entry => (
              <div key={entry.id} className={styles.item}>
                <div className={styles.itemLeft}>
                  <span className={styles.itemDot} />
                  <div>
                    {entry.descrizione && <div className={styles.itemDesc}>{entry.descrizione}</div>}
                    <div className={entry.descrizione ? styles.itemMeta : styles.itemDesc}>
                      {formatDateRange(entry)}
                    </div>
                  </div>
                </div>
                <button className="btn-icon danger" onClick={() => rimuoviData(entry.id)}>
                  <IconClose size={14} weight="regular" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </div>
  )
}
