import { useState, useEffect } from 'react'
import { useLocalita } from '../../hooks/useLocalita'
import { authFetch } from '../../lib/authFetch'
import { API_BASE } from '../../lib/config'
import { IconEdit, IconTrash, IconClose, IconPlus, IconEye, IconEyeSlash, IconLocalSeo } from '../../icons/index.jsx'
import RichTextEditor from './RichTextEditor'
import styles from './LocalSeoPanel.module.css'

function toSlug(str) {
  return str.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Modal editor ─────────────────────────────────────────────────────────────
function Modal({ item, slugDisponibili, salva, onClose, onSaved, onElimina }) {
  const isEdit = !!item
  const [form, setForm] = useState(item
    ? { ...item }
    : { citta: '', slug: '', serviziAttivi: [], introText: '', metaTitle: '', metaDescription: '', attiva: true, tempoGuida: '' }
  )
  const [slugModificato, setSlugModificato] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleCitta(e) {
    const v = e.target.value
    set('citta', v)
    if (!slugModificato) set('slug', toSlug(v))
  }

  function toggleServizio(slug) {
    setForm(p => ({
      ...p,
      serviziAttivi: p.serviziAttivi.includes(slug)
        ? p.serviziAttivi.filter(s => s !== slug)
        : [...p.serviziAttivi, slug],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.citta.trim()) { setErr('La città è obbligatoria.'); return }
    if (!form.slug.trim()) { setErr('Lo slug è obbligatorio.'); return }
    setSaving(true)
    const res = await salva({ ...form }, item?.id || null)
    setSaving(false)
    if (res.success) { onSaved() } else { setErr('Errore nel salvataggio.') }
  }

  async function handleElimina() {
    if (!window.confirm(`Eliminare "${form.citta}"?`)) return
    setSaving(true)
    await onElimina(item.id)
    onSaved()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitolo}>{isEdit ? `Modifica — ${item.citta}` : 'Nuova città'}</span>
          <button className="btn-icon" onClick={onClose}><IconClose size={16} weight="regular" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {err && <div className={`${styles.msg} ${styles.err}`}>{err}</div>}

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Città *</label>
                <input value={form.citta} onChange={handleCitta} placeholder="Es. Merate" autoFocus />
              </div>
              <div className={styles.field}>
                <label>Slug URL *</label>
                <input
                  value={form.slug}
                  onChange={e => { set('slug', toSlug(e.target.value)); setSlugModificato(true) }}
                  placeholder="es. merate"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <div className={styles.urlPreview}>boogiebistrot.it/vicino-a/{form.slug || '…'}</div>
              </div>
              <div className={styles.field}>
                <label>Tempo di guida <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(minuti)</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.tempoGuida}
                  onChange={e => set('tempoGuida', e.target.value)}
                  placeholder="Es. 15"
                />
              </div>
            </div>

            {/* Servizi attivi */}
            <div className={styles.field}>
              <label>
                Servizi attivi
                <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>
                  — slug degli eventi Agenda che appaiono per questa città
                </span>
              </label>
              {slugDisponibili.length > 0 ? (
                <div className={styles.serviziGrid}>
                  {slugDisponibili.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.servizioBtn} ${form.serviziAttivi.includes(s) ? styles.servizioBtnActive : ''}`}
                      onClick={() => toggleServizio(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                  Nessun evento con slug trovato in Agenda.
                </p>
              )}
              {form.serviziAttivi.length > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text3)' }}>
                  URL generati: {form.serviziAttivi.map(s => `/vicino-a/${form.slug || '…'}/${s}`).join(', ')}
                </div>
              )}
            </div>

            {/* Intro testo */}
            <div className={styles.field}>
              <label>
                Testo intro
                <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>— specifico per questa città</span>
              </label>
              <RichTextEditor value={form.introText} onChange={v => set('introText', v)} />
            </div>

            {/* SEO */}
            <div className={styles.seoSection}>
              <div className={styles.seoTitle}>SEO — opzionale (se vuoto genera automaticamente)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className={styles.field}>
                  <label>Meta Title ({form.metaTitle.length}/60)</label>
                  <input
                    value={form.metaTitle}
                    onChange={e => set('metaTitle', e.target.value)}
                    placeholder={`Ristorante vicino a ${form.citta || '…'} | Boogie Bistrot`}
                    maxLength={80}
                  />
                </div>
                <div className={styles.field}>
                  <label>Meta Description ({form.metaDescription.length}/160)</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={e => set('metaDescription', e.target.value)}
                    rows={2}
                    placeholder={`Boogie Bistrot, il ristorante con giardino più vicino a ${form.citta || '…'}...`}
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.attiva}
                  onChange={e => set('attiva', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                Pagina attiva (indicizzata e visibile sul sito)
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
              <button type="submit" className="btn-primary" disabled={saving || !form.citta.trim()}>
                {saving ? '...' : isEdit ? 'Salva modifiche' : 'Crea pagina'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Panel principale ─────────────────────────────────────────────────────────
export default function LocalSeoPanel() {
  const { localita, loading, carica, salva, elimina, toggleAttiva } = useLocalita()
  const [slugDisponibili, setSlugDisponibili] = useState([])
  const [modalItem, setModalItem] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [msg, setMsg] = useState(null)

  // Carica slug disponibili da Agenda
  useEffect(() => {
    authFetch(API_BASE + '/gestisci-appuntamenti')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const slugs = (json.appuntamenti || [])
            .filter(a => a.slug)
            .map(a => a.slug)
            .sort()
          setSlugDisponibili(slugs)
        }
      })
      .catch(() => {})
  }, [])

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
    showMsg('ok', 'Località eliminata.')
  }

  async function handleToggle(item) {
    await toggleAttiva(item.id, !item.attiva)
    await carica()
  }

  async function handleSync() {
    showMsg('info', 'Sincronizzazione in corso…')
    try {
      const res = await authFetch(API_BASE + '/gestisci-localita-servizi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })
      const json = await res.json()
      if (json.success) {
        showMsg('ok', json.creati > 0
          ? `Sincronizzati ${json.creati} nuovi record in LocalitaServizi.`
          : 'Tutto già sincronizzato, nessun record mancante.')
      } else {
        showMsg('err', 'Errore durante la sincronizzazione.')
      }
    } catch {
      showMsg('err', 'Errore di rete.')
    }
  }

  function showMsg(tipo, testo) {
    setMsg({ tipo, testo })
    if (tipo !== 'info') setTimeout(() => setMsg(null), 4000)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <IconLocalSeo size={18} /> Local SEO
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleSync} title="Crea i record mancanti in LocalitaServizi">
            ↻ Sincronizza servizi
          </button>
          <button className="btn-primary" onClick={apriNuovo}>
            <IconPlus size={14} /> Nuova città
          </button>
        </div>
      </div>

      {msg && (
        <div className={`${styles.msg} ${msg.tipo === 'ok' ? styles.ok : styles.err}`}>
          {msg.testo}
        </div>
      )}

      <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
        Ogni città genera la rotta <code style={{ fontFamily: 'monospace', background: 'var(--bg2)', padding: '1px 6px', borderRadius: 4 }}>/vicino-a/[slug]</code> e le relative pagine servizio.
      </div>

      {loading ? (
        <div className={styles.empty}>Caricamento...</div>
      ) : localita.length === 0 ? (
        <div className={styles.empty}>Nessuna città configurata.</div>
      ) : (
        <div className={styles.lista}>
          {localita.map(item => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemBody}>
                <div className={styles.itemCitta}>
                  {item.citta}
                  <span
                    className={`${styles.badge} ${item.attiva ? styles.badgeOn : styles.badgeOff}`}
                    style={{ marginLeft: 10 }}
                  >
                    {item.attiva ? 'attiva' : 'disattiva'}
                  </span>
                </div>
                <div className={styles.itemMeta}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                    /vicino-a/{item.slug}
                  </span>
                  {item.serviziAttivi.length > 0 && (
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {item.serviziAttivi.map(s => (
                        <span key={s} className={styles.servizioTag}>{s}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className="btn-icon"
                  style={item.attiva ? { color: '#2E7D32', background: 'rgba(46,125,50,0.1)', borderColor: 'rgba(46,125,50,0.25)' } : {}}
                  onClick={() => handleToggle(item)}
                  title={item.attiva ? 'Disattiva' : 'Attiva'}
                >
                  {item.attiva ? <IconEye size={15} /> : <IconEyeSlash size={15} />}
                </button>
                <button type="button" className="btn-icon" onClick={() => apriEdit(item)} title="Modifica">
                  <IconEdit size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          item={modalItem}
          slugDisponibili={slugDisponibili}
          salva={salva}
          onClose={chiudiModal}
          onSaved={handleSaved}
          onElimina={handleElimina}
        />
      )}
    </div>
  )
}
