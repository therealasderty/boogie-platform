import { useState, useMemo } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMenu } from '../../hooks/useMenu'
import {
  IconForkKnife, IconPlus, IconTrash, IconDrag, IconEdit,
  IconEye, IconEyeSlash, IconRefresh, IconClose, IconLock,
} from '../../icons/index.jsx'
import styles from './MenuPanel.module.css'

const CATEGORIE = ['Specialità alla Carta', 'Pizza', 'Birre', 'Vini', 'Cocktails']

const SOTTOCATEGORIE = {
  'Specialità alla Carta': ['Antipasti', 'Primi', 'Secondi', 'Dolci'],
  'Pizza':      [],
  'Birre':      ['Artigianali', 'In Bottiglia'],
  'Vini':       ['Bollicine', 'Vini Bianchi', 'Vini Rossi', 'Vini Rosati', 'Vini della Casa'],
  'Cocktails':  ['Alcolici', 'Gin Special', 'Analcolici'],
}

const ETICHETTE = ['', 'Novità', 'Chef consiglia', 'Stagionale']

const REGIONI_VINO = [
  '', 'Lombardia', 'Piemonte', 'Veneto', 'Toscana', 'Sicilia',
  'Campania', 'Puglia', 'Trentino-Alto Adige', 'Friuli-Venezia Giulia',
  'Emilia-Romagna', 'Sardegna', 'Abruzzo', 'Marche', 'Umbria',
  'Lazio', 'Calabria', 'Basilicata', 'Molise', 'Valle d\'Aosta', 'Liguria',
]

const EMPTY_FORM = {
  nome: '', descrizione: '', prezzo: '', formato: '',
  prezzo2: '', formato2: '', categoria: 'Specialità alla Carta',
  sottocategoria: 'Antipasti', attivo: true, ordine: 0,
  note: '', etichetta: '', produttore: '', regione: '',
  senzaGlutine: false, senzaLattosio: false,
}

// ─── Riga singola con drag ────────────────────────────────────────────────────
function SortableRow({ piatto, onEdit, onToggle, onDelete, modificheAbilitate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: piatto.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={`${styles.row} ${!piatto.attivo ? styles.rowDisabled : ''}`}>
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        <IconDrag size={16} />
      </span>

      <div className={styles.rowMain}>
        <span className={styles.rowNome}>{piatto.nome}</span>
        {piatto.etichetta && <span className={styles.badge}>{piatto.etichetta}</span>}
        {piatto.descrizione && <span className={styles.rowDesc}>{piatto.descrizione}</span>}
        {piatto.note && <span className={styles.rowNote}>{piatto.note}</span>}
      </div>

      <div className={styles.rowPrezzi}>
        {piatto.prezzo != null && piatto.prezzo !== '' && (
          <span className={styles.prezzo}>
            {piatto.formato && <span className={styles.formato}>{piatto.formato} </span>}
            {Number(piatto.prezzo).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </span>
        )}
        {piatto.prezzo2 != null && piatto.prezzo2 !== '' && (
          <span className={styles.prezzo}>
            {piatto.formato2 && <span className={styles.formato}>{piatto.formato2} </span>}
            {Number(piatto.prezzo2).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </span>
        )}
      </div>

      {modificheAbilitate && (
        <div className={styles.rowActions}>
          <button type="button" className="btn-icon" onClick={() => onToggle(piatto)} title={piatto.attivo ? 'Nascondi' : 'Mostra'}>
            {piatto.attivo ? <IconEye size={15} /> : <IconEyeSlash size={15} />}
          </button>
          <button type="button" className="btn-icon" onClick={() => onEdit(piatto)} title="Modifica">
            <IconEdit size={15} />
          </button>
          <button type="button" className="btn-icon danger" onClick={() => onDelete(piatto.id)} title="Elimina">
            <IconTrash size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Modal aggiungi / modifica ────────────────────────────────────────────────
function ModalPiatto({ piatto, onClose, onSave, defaultCategoria, defaultSottocategoria }) {
  const [form, setForm] = useState(piatto || { ...EMPTY_FORM, categoria: defaultCategoria, sottocategoria: defaultSottocategoria || SOTTOCATEGORIE[defaultCategoria]?.[0] || '' })
  const [saving, setSaving] = useState(false)

  const sotto = SOTTOCATEGORIE[form.categoria] || []

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'categoria') next.sottocategoria = SOTTOCATEGORIE[v]?.[0] || ''
      return next
    })
  }

  async function handleSave() {
    if (!form.nome.trim()) return
    setSaving(true)
    const result = await onSave(form)
    setSaving(false)
    if (result && result.success === false) {
      console.error('[MenuPanel] Errore Airtable:', JSON.stringify(result, null, 2))
      alert('Errore nel salvataggio. Controlla la console per i dettagli.')
      return
    }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitolo}>{piatto ? 'Modifica piatto' : 'Nuovo piatto'}</span>
          <button type="button" className="btn-icon" onClick={onClose}><IconClose size={16} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {CATEGORIE.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {sotto.length > 0 && (
              <div className={styles.field}>
                <label>Sottocategoria</label>
                <select value={form.sottocategoria} onChange={e => set('sottocategoria', e.target.value)}>
                  {sotto.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Nome — sempre */}
          <div className={styles.field}>
            <label>Nome *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Es. Risotto alla parmigiana" />
          </div>

          {/* Descrizione — sempre */}
          <div className={styles.field}>
            <label>Descrizione (ingredienti)</label>
            <input value={form.descrizione} onChange={e => set('descrizione', e.target.value)} placeholder="Ingredienti o descrizione breve" />
          </div>

          {/* Prezzo */}
          {form.categoria === 'Specialità alla Carta' || form.categoria === 'Pizza' ? (
            <div className={styles.field} style={{ maxWidth: '160px' }}>
              <label>Prezzo (€)</label>
              <input type="number" step="0.5" value={form.prezzo} onChange={e => set('prezzo', e.target.value)} placeholder="12.50" />
            </div>
          ) : (
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Prezzo (€)</label>
                <input type="number" step="0.5" value={form.prezzo} onChange={e => set('prezzo', e.target.value)} placeholder="12.50" />
              </div>
              <div className={styles.field}>
                <label>Formato</label>
                <input value={form.formato} onChange={e => set('formato', e.target.value)} placeholder="Es. Bottiglia 33cl" />
              </div>
            </div>
          )}

          {/* Secondo prezzo — solo Birre e Vini */}
          {(form.categoria === 'Birre' || form.categoria === 'Vini') && (
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Prezzo 2 (€)</label>
                <input type="number" step="0.5" value={form.prezzo2} onChange={e => set('prezzo2', e.target.value)} placeholder="14.00" />
              </div>
              <div className={styles.field}>
                <label>Formato 2</label>
                <input value={form.formato2} onChange={e => set('formato2', e.target.value)} placeholder="Es. Bottiglia 75cl" />
              </div>
            </div>
          )}

          {/* Etichetta — solo Vini e Cocktails */}
          {(form.categoria === 'Vini' || form.categoria === 'Cocktails') && (
            <div className={styles.field} style={{ maxWidth: '200px' }}>
              <label>Etichetta</label>
              <select value={form.etichetta} onChange={e => set('etichetta', e.target.value)}>
                {ETICHETTE.map(e => <option key={e} value={e}>{e || '—'}</option>)}
              </select>
            </div>
          )}

          {/* Produttore + Regione — solo Birre e Vini */}
          {(form.categoria === 'Birre' || form.categoria === 'Vini') && (
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Produttore</label>
                <input value={form.produttore} onChange={e => set('produttore', e.target.value)} placeholder="Es. Birrificio Dulac" />
              </div>
              {form.categoria === 'Vini' && (
                <div className={styles.field}>
                  <label>Regione</label>
                  <select value={form.regione} onChange={e => set('regione', e.target.value)}>
                    {REGIONI_VINO.map(r => <option key={r} value={r}>{r || '—'}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Intolleranze — Specialità, Pizza, Birre */}
          {(form.categoria === 'Specialità alla Carta' || form.categoria === 'Pizza' || form.categoria === 'Birre') && (
            <div className={styles.fieldGroup}>
              <span className={styles.fieldGroupLabel}>Intolleranze</span>
              <div className={styles.checkGroup}>
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={form.senzaGlutine} onChange={e => set('senzaGlutine', e.target.checked)} />
                  Senza glutine
                </label>
                {form.categoria !== 'Birre' && (
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={form.senzaLattosio} onChange={e => set('senzaLattosio', e.target.checked)} />
                    Senza lattosio
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Visibilità — sempre */}
          <div className={styles.dividerLine} />
          <div className={styles.toggleRow}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldGroupLabel}>Visibilità sul sito</span>
              <span className={styles.toggleLabel}>{form.attivo ? 'Visibile' : 'Nascosto'}</span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${form.attivo ? styles.toggleOn : ''}`}
              onClick={() => set('attivo', !form.attivo)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !form.nome.trim()}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Panel principale ─────────────────────────────────────────────────────────
export default function MenuPanel() {
  const { piatti, loading, carica, salva, elimina, aggiornaOrdine } = useMenu()
  const [categoria, setCategoria] = useState('Specialità')
  const [sottocategoria, setSottocategoria] = useState('Antipasti')
  const [modal, setModal] = useState(null) // null | 'nuovo' | piatto
  const [modificheAbilitate, setModificheAbilitate] = useState(false)
  const [nascostiAperti, setNascostiAperti] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const sotto = SOTTOCATEGORIE[categoria] || []

  const filtrati = useMemo(() => {
    return piatti
      .filter(p => p.categoria === categoria && (sotto.length === 0 || p.sottocategoria === sottocategoria))
      .sort((a, b) => a.ordine - b.ordine)
  }, [piatti, categoria, sottocategoria, sotto])

  const visibili = useMemo(() => filtrati.filter(p => p.attivo), [filtrati])
  const nascosti = useMemo(() => filtrati.filter(p => !p.attivo), [filtrati])

  async function handleToggle(piatto) {
    await salva({ id: piatto.id, ...piatto, attivo: !piatto.attivo })
    carica()
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo piatto?')) return
    await elimina(id)
    carica()
  }

  async function handleSave(form) {
    const result = await salva(form)
    carica()
    return result
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filtrati.findIndex(p => p.id === active.id)
    const newIndex  = filtrati.findIndex(p => p.id === over.id)
    const riordinati = arrayMove(filtrati, oldIndex, newIndex)
    await aggiornaOrdine(riordinati)
    carica()
  }

  function handleCategoriaChange(cat) {
    setCategoria(cat)
    setSottocategoria(SOTTOCATEGORIE[cat]?.[0] || '')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <IconForkKnife size={20} />
          Menu
        </div>
        <div className={styles.headerRight}>
          <button type="button" className="btn-icon" onClick={carica} title="Ricarica"><IconRefresh size={15} /></button>
          <button
            className={modificheAbilitate ? styles.btnAbilitaOn : styles.btnAbilita}
            onClick={() => setModificheAbilitate(v => !v)}
          >
            <IconLock size={15} />
            {modificheAbilitate ? 'Modifiche attive' : 'Abilita modifiche'}
          </button>
          {modificheAbilitate && (
            <button type="button" className="btn-accent btn-sm" onClick={() => setModal('nuovo')}>
              <IconPlus size={15} /> Aggiungi piatto
            </button>
          )}
        </div>
      </div>

      {modificheAbilitate && (
        <div className={styles.avviso}>
          Le modifiche vengono pubblicate sul sito entro 5 minuti.
        </div>
      )}

      {/* Tab categorie */}
      <div className={styles.tabs}>
        {CATEGORIE.map(cat => (
          <button key={cat} className={`${styles.tab} ${categoria === cat ? styles.tabActive : ''}`} onClick={() => handleCategoriaChange(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Sub-tab */}
      {sotto.length > 0 && (
        <div className={styles.subTabs}>
          {sotto.map(s => (
            <button key={s} className={`${styles.subTab} ${sottocategoria === s ? styles.subTabActive : ''}`} onClick={() => setSottocategoria(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className={styles.loading}>Caricamento…</div>
      ) : filtrati.length === 0 ? (
        <div className={styles.empty}>Nessun piatto in questa sezione.</div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibili.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className={styles.list}>
                {visibili.length === 0 && (
                  <div className={styles.empty} style={{ padding: '24px' }}>Nessun piatto visibile.</div>
                )}
                {visibili.map(p => (
                  <SortableRow
                    key={p.id}
                    piatto={p}
                    onEdit={p => setModal(p)}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    modificheAbilitate={modificheAbilitate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {nascosti.length > 0 && (
            <div className={styles.nascostiWrap}>
              <button className={styles.nascostiToggle} onClick={() => setNascostiAperti(v => !v)}>
                <span>{nascosti.length} nascost{nascosti.length === 1 ? 'o' : 'i'} <span style={{ fontWeight: 400, opacity: 0.6 }}>(Non visibili sul sito)</span></span>
                <span className={`${styles.nascostiArrow} ${nascostiAperti ? styles.nascostiArrowOpen : ''}`}>▾</span>
              </button>
              {nascostiAperti && (
                <div className={styles.list}>
                  {nascosti.map(p => (
                    <SortableRow
                      key={p.id}
                      piatto={p}
                      onEdit={p => setModal(p)}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      modificheAbilitate={modificheAbilitate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modal && (
        <ModalPiatto
          piatto={modal === 'nuovo' ? null : modal}
          defaultCategoria={categoria}
          defaultSottocategoria={sottocategoria}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
