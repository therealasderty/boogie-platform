import { useState, useRef, useEffect, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import { useAppuntamenti } from '../../hooks/useAppuntamenti'
import { useMeteo } from '../../hooks/useMeteo'
import { useOrari } from '../../hooks/useOrari'
import { useChiusure } from '../../hooks/useChiusure'
import { IconClose } from '../../icons/index.jsx'
import { CalendarDots, Sparkle } from '@phosphor-icons/react'
import { authFetch } from '../../lib/authFetch'
import styles from './AgendaPanel.module.css'
import BlocchiEditor, { MediaLibraryModal } from './BlocchiEditor'
import RichTextEditor from './RichTextEditor'
import { useMedia } from '../../hooks/useMedia'

// ─── Festività italiane 2024-2028 ───────────────────────────────────────────
const FESTIVITA = [
  // Fisse
  ...['2024','2025','2026','2027','2028'].flatMap(y => [
    { title: '🎆 Capodanno',           date: `${y}-01-01` },
    { title: '👑 Epifania',            date: `${y}-01-06` },
    { title: '🌸 Festa della Liberazione', date: `${y}-04-25` },
    { title: '⚒️ Festa del Lavoro',    date: `${y}-05-01` },
    { title: '🇮🇹 Festa della Repubblica', date: `${y}-06-02` },
    { title: '☀️ Ferragosto',          date: `${y}-08-15` },
    { title: '🕯️ Ognissanti',         date: `${y}-11-01` },
    { title: '✨ Immacolata',          date: `${y}-12-08` },
    { title: '🎄 Natale',              date: `${y}-12-25` },
    { title: '🎁 Santo Stefano',       date: `${y}-12-26` },
  ]),
  // Pasqua (mobile)
  { title: '🐣 Pasqua',     date: '2024-03-31' },
  { title: '🐣 Pasquetta',  date: '2024-04-01' },
  { title: '🐣 Pasqua',     date: '2025-04-20' },
  { title: '🐣 Pasquetta',  date: '2025-04-21' },
  { title: '🐣 Pasqua',     date: '2026-04-05' },
  { title: '🐣 Pasquetta',  date: '2026-04-06' },
  { title: '🐣 Pasqua',     date: '2027-03-28' },
  { title: '🐣 Pasquetta',  date: '2027-03-29' },
  { title: '🐣 Pasqua',     date: '2028-04-16' },
  { title: '🐣 Pasquetta',  date: '2028-04-17' },
]

const VISIBILITA_COLORI = {
  'promozione': '#E67E22',
  'pagina':     'var(--accent)',
}

const VISIBILITA_COLORI_RICORRENTE = {
  'promozione': '#7B5EA7',
  'pagina':     '#1565C0',
}

const RICORRENZE = ['nessuna', 'giornaliera', 'settimanale', 'mensile']
const GIORNI_SETT = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mer', value: 3 },
  { label: 'Gio', value: 4 },
  { label: 'Ven', value: 5 },
  { label: 'Sab', value: 6 },
  { label: 'Dom', value: 0 },
]

function toSlug(str, { trim = true } = {}) {
  let s = str.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  if (trim) s = s.replace(/^-|-$/g, '')
  return s
}

// ─── Editor evento (inline, sotto il calendario) ─────────────────────────────
function EditorAppuntamento({ data, appuntamento, prefill, onSalva, onElimina, onClose }) {
  const isEdit = !!appuntamento
  const [title, setTitle] = useState(appuntamento?.title || prefill?.title || '')
  const [dataVal, setDataVal] = useState(appuntamento?.data || prefill?.data || data || '')
  const [ora, setOra] = useState(appuntamento?.ora || '')
  const [oraFine, setOraFine] = useState(appuntamento?.oraFine || '')
  const [note, setNote] = useState(appuntamento?.note || '')
  const [ricorrenza, setRicorrenza] = useState(appuntamento?.ricorrenza || 'nessuna')
  const [giorniSett, setGiorniSett] = useState(() => {
    if (appuntamento?.giorniSettimana) return appuntamento.giorniSettimana.split(',').map(Number)
    if (appuntamento?.data) return [new Date(appuntamento.data + 'T12:00:00').getDay()]
    return []
  })
  const [giorniEsclusione, setGiorniEsclusione] = useState(() => {
    if (appuntamento?.giorniEsclusione) return appuntamento.giorniEsclusione.split(',').map(Number)
    return []
  })
  const [bloccaGiorno, setBloccaGiorno] = useState(appuntamento?.bloccaGiorno || false)
  const [dataFine, setDataFine] = useState(appuntamento?.dataFineRicorrenza || '')
  const [stato, setStato] = useState(appuntamento?.stato || 'attivo')
  const [descrizioneBreve, setDescrizioneBreve] = useState(appuntamento?.descrizioneBreve || '')
  const [titoloIntro, setTitoloIntro] = useState(appuntamento?.titoloIntro || '')
  const [testoIntro, setTestoIntro] = useState(appuntamento?.testoIntro || '')
  const [fotoHero, setFotoHero] = useState(appuntamento?.fotoHero || '')
  const [tagFotoIntro, setTagFotoIntro] = useState(appuntamento?.tagFotoIntro || '')
  const [mostraMediaHero, setMostraMediaHero] = useState(false)
  const { items: mediaItems } = useMedia()
  const tagEsistenti = [...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean))].sort()
  const [slug, setSlug] = useState(appuntamento?.slug || '')
  const [slugModificato, setSlugModificato] = useState(!!appuntamento?.slug)
  const [blocchi, setBlocchi] = useState(() => {
    try { return JSON.parse(appuntamento?.blocchi || '[]') } catch { return [] }
  })
  const [inPrimoPiano, setInPrimoPiano] = useState(appuntamento?.inPrimoPiano || false)
  const [mostraInNews, setMostraInNews] = useState(appuntamento?.mostraInNews || false)
  const [metaTitle, setMetaTitle] = useState(appuntamento?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(appuntamento?.metaDescription || '')
  const [socialCopy, setSocialCopy] = useState(appuntamento?.socialCopy || '')
  const [statoSocial, setStatoSocial] = useState(appuntamento?.statoSocial || 'nessuno')
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)

  // Sezioni collassabili
  const [sezioneInfo, setSezioneInfo] = useState(true)
  const [sezionePagina, setSezionePagina] = useState(!!appuntamento?.slug)
  const [sezioneSeo, setSezioneSeo] = useState(false)
  const [sezioneSocial, setSezioneSocial] = useState(false)
  const [generandoCaption, setGenerandoCaption] = useState(false)

  // Conferma eliminazione
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')

  function toggleGiorno(v) {
    setGiorniSett(prev => prev.includes(v) ? prev.filter(g => g !== v) : [...prev, v])
  }

  function handleRicorrenza(r) {
    setRicorrenza(r)
    if (r === 'settimanale' && giorniSett.length === 0 && dataVal) {
      setGiorniSett([new Date(dataVal + 'T12:00:00').getDay()])
    }
  }

  function handleTitleChange(e) {
    const val = e.target.value
    setTitle(val)
    if (!slugModificato) setSlug(toSlug(val))
  }

  function handleSlugChange(e) {
    setSlug(toSlug(e.target.value, { trim: false }))
    setSlugModificato(true)
  }

  async function handleSalva() {
    if (!title.trim()) return
    setLoading(true)
    setErrore(null)
    try {
      await onSalva({
        id: appuntamento?.id,
        title: title.trim(),
        data: dataVal,
        ora,
        oraFine,
        visibilita: 'pagina',
        stato,
        note,
        descrizioneBreve: descrizioneBreve.trim(),
        ricorrenza,
        giorniSettimana: ricorrenza === 'settimanale' ? giorniSett.sort((a,b)=>a-b).join(',') : '',
        giorniEsclusione: ricorrenza === 'giornaliera' ? giorniEsclusione.sort((a,b)=>a-b).join(',') : '',
        bloccaGiorno,
        dataFineRicorrenza: ricorrenza !== 'nessuna' ? dataFine : '',
        slug: slug.trim(),
        titoloIntro: titoloIntro.trim(),
        testoIntro,
        fotoHero: fotoHero.trim(),
        tagFotoIntro: tagFotoIntro.trim(),
        blocchi: JSON.stringify(blocchi),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        inPrimoPiano,
        mostraInNews,
        socialCopy: socialCopy.trim(),
        statoSocial,
      })
    } catch (e) {
      setErrore(e.message || 'Errore durante il salvataggio')
      setLoading(false)
    }
  }

  async function handleGeneraCaption() {
    setGenerandoCaption(true)
    try {
      const res = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titolo: title,
          descrizione: descrizioneBreve,
          data: dataVal,
          ora,
          tipo: 'evento',
        }),
      })
      const data = await res.json()
      if (data.success && data.caption) setSocialCopy(data.caption)
      else alert('Errore generazione: ' + (data.error || 'risposta non valida'))
    } catch (e) {
      alert('Errore generazione caption: ' + e.message)
    } finally {
      setGenerandoCaption(false)
    }
  }

  const statoBadge = stato === 'bozza' ? 'Bozza' : stato === 'dormiente' ? 'Dormiente' : null

  return (
    <div className={styles.editorPanel}>
      <div className={styles.editorHeader}>
        <div className={styles.editorTitolo}>{isEdit ? 'Modifica evento' : 'Nuovo evento'}</div>
        <button className="btn-icon" onClick={onClose}><IconClose size={16} /></button>
      </div>

      <div className={styles.editorBody}>

        {/* ── SEZIONE 1: Info evento ── */}
        <div className={styles.sezione}>
          <button type="button" className={styles.sezioneHeader} onClick={() => setSezioneInfo(v => !v)}>
            <span className={styles.sezioneTitolo}>Info evento</span>
            {statoBadge && <span className={styles.sezioneBadge}>{statoBadge}</span>}
            <span className={`${styles.sezioneArrow} ${sezioneInfo ? styles.sezioneArrowOpen : ''}`}>›</span>
          </button>
          {sezioneInfo && (
            <div className={styles.sezioneBody}>

              <div className={styles.field}>
                <label>Titolo</label>
                <input value={title} onChange={handleTitleChange} placeholder="Es. Serata Jazz Live" autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div className={styles.field}>
                  <label>{ricorrenza !== 'nessuna' ? 'Data inizio' : 'Data'}</label>
                  <input type="date" value={dataVal} onChange={e => setDataVal(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Ora inizio</label>
                  <input type="time" value={ora} onChange={e => setOra(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Ora fine</label>
                  <input type="time" value={oraFine} onChange={e => setOraFine(e.target.value)} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Ricorrenza</label>
                <div className={styles.tipoGroup}>
                  {RICORRENZE.map(r => (
                    <button key={r} type="button"
                      className={`${styles.tipoBtn} ${ricorrenza === r ? styles.tipoBtnActive : ''}`}
                      style={ricorrenza === r ? { background: 'var(--text2)', borderColor: 'var(--text2)' } : {}}
                      onClick={() => handleRicorrenza(r)}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {ricorrenza === 'giornaliera' && (
                <div className={styles.field}>
                  <label>Giorni di esclusione (opzionale)</label>
                  <div className={styles.giorniGroup}>
                    {GIORNI_SETT.map(g => (
                      <button key={g.value} type="button"
                        className={`${styles.giornoBtn} ${giorniEsclusione.includes(g.value) ? styles.giornoBtnActive : ''}`}
                        style={giorniEsclusione.includes(g.value) ? { background: '#64748b', borderColor: '#64748b' } : {}}
                        onClick={() => setGiorniEsclusione(prev =>
                          prev.includes(g.value) ? prev.filter(d => d !== g.value) : [...prev, g.value]
                        )}
                      >{g.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {ricorrenza === 'settimanale' && (
                <div className={styles.field}>
                  <label>Giorni</label>
                  <div className={styles.giorniGroup}>
                    {GIORNI_SETT.map(g => (
                      <button key={g.value} type="button"
                        className={`${styles.giornoBtn} ${giorniSett.includes(g.value) ? styles.giornoBtnActive : ''}`}
                        onClick={() => toggleGiorno(g.value)}
                      >{g.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {ricorrenza !== 'nessuna' && (
                <div className={styles.field}>
                  <label>Fino a (opzionale)</label>
                  <input type="date" value={dataFine} onChange={e => setDataFine(e.target.value)} />
                </div>
              )}

              <div className={styles.field}>
                <label>Stato</label>
                <div className={styles.tipoGroup}>
                  <button type="button"
                    className={`${styles.tipoBtn} ${stato === 'attivo' ? styles.tipoBtnActive : ''}`}
                    style={stato === 'attivo' ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
                    onClick={() => setStato('attivo')}
                  >✓ Attivo</button>
                  <button type="button"
                    className={`${styles.tipoBtn} ${stato === 'bozza' ? styles.tipoBtnActive : ''}`}
                    style={stato === 'bozza' ? { background: '#ca8a04', borderColor: '#ca8a04' } : {}}
                    onClick={() => setStato('bozza')}
                  >✎ Bozza</button>
                  <button type="button"
                    className={`${styles.tipoBtn} ${stato === 'dormiente' ? styles.tipoBtnActive : ''}`}
                    style={stato === 'dormiente' ? { background: '#64748b', borderColor: '#64748b' } : {}}
                    onClick={() => setStato('dormiente')}
                  >⏸ Dormiente</button>
                </div>
                {stato === 'bozza' && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text3)' }}>
                    L'evento è salvato ma non appare sul sito.
                  </p>
                )}
                {stato === 'dormiente' && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text3)' }}>
                    La pagina rimane online per la SEO ma mostrerà un avviso ai visitatori.
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label>Descrizione breve <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(homepage)</span></label>
                <textarea value={descrizioneBreve} onChange={e => setDescrizioneBreve(e.target.value)} rows={2} placeholder="Una riga che racconta l'evento nella homepage..." />
              </div>

              <div className={styles.field}>
                <label>Note interne <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(non visibili sul sito)</span></label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Dettagli organizzativi, contatti artisti..." />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={bloccaGiorno} onChange={e => setBloccaGiorno(e.target.checked)} />
                  Blocca prenotazioni generali in questo giorno
                </label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={inPrimoPiano} onChange={e => setInPrimoPiano(e.target.checked)} />
                  ⭐ Mostra nel pop-up "In primo piano"
                </label>
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={mostraInNews} onChange={e => setMostraInNews(e.target.checked)} />
                  📰 Mostra nel carousel news (visibile anche se dormiente)
                </label>
              </div>

            </div>
          )}
        </div>

        {/* ── SEZIONE 2: Pagina pubblica ── */}
        <div className={styles.sezione}>
          <button type="button" className={styles.sezioneHeader} onClick={() => setSezionePagina(v => !v)}>
            <span className={styles.sezioneTitolo}>Pagina pubblica</span>
            {slug
              ? <span className={styles.sezioneBadge} style={{ fontFamily: 'monospace' }}>/eventi-speciali/{slug}</span>
              : <span className={styles.sezioneBadgeGray}>non configurata</span>
            }
            <span className={`${styles.sezioneArrow} ${sezionePagina ? styles.sezioneArrowOpen : ''}`}>›</span>
          </button>
          {sezionePagina && (
            <div className={styles.sezioneBody}>

              <div className={styles.field}>
                <label>
                  Slug URL
                  <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>
                    /eventi-speciali/{slug || '…'}
                  </span>
                </label>
                <input
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="es. serata-jazz-live"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div className={styles.field}>
                <label>Foto Hero</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <input
                    value={fotoHero}
                    onChange={e => setFotoHero(e.target.value)}
                    placeholder="URL immagine (oppure scegli dalla libreria)"
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  />
                  <button type="button" className="btn-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    onClick={() => setMostraMediaHero(true)}>
                    🖼 Libreria
                  </button>
                </div>
                {fotoHero && (
                  <div style={{ marginTop: 8, position: 'relative', width: '100%', height: 100, borderRadius: 6, overflow: 'hidden' }}>
                    <img src={fotoHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setFotoHero('')}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {mostraMediaHero && (
                <MediaLibraryModal
                  onSelect={m => { setFotoHero(m.url); setMostraMediaHero(false) }}
                  onClose={() => setMostraMediaHero(false)}
                />
              )}

              <div className={styles.field}>
                <label>Titolo intro (h2)</label>
                <input
                  value={titoloIntro}
                  onChange={e => setTitoloIntro(e.target.value)}
                  placeholder={`Es. "Una serata unica" (default: titolo evento)`}
                />
              </div>

              <div className={styles.field}>
                <label>Testo intro</label>
                <RichTextEditor value={testoIntro} onChange={setTestoIntro} />
              </div>

              <div className={styles.field}>
                <label>Tag foto intro (carosello)</label>
                <input
                  value={tagFotoIntro}
                  onChange={e => setTagFotoIntro(e.target.value)}
                  placeholder="es. serate-jazz"
                />
                {tagEsistenti.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {tagEsistenti.map(t => (
                      <button key={t} type="button" onClick={() => setTagFotoIntro(t)}
                        style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer',
                          border: '1px solid var(--border)',
                          background: tagFotoIntro === t ? 'var(--accent)' : 'var(--bg-input)',
                          color: tagFotoIntro === t ? '#000' : 'var(--text2)',
                        }}
                      >{t}</button>
                    ))}
                  </div>
                )}
              </div>

              {slug && (
                <div className={styles.field}>
                  <label>Contenuto pagina pubblica</label>
                  <BlocchiEditor blocchi={blocchi} onChange={setBlocchi} />
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── SEZIONE 3: SEO ── */}
        <div className={styles.sezione}>
          <button type="button" className={styles.sezioneHeader} onClick={() => setSezioneSeo(v => !v)}>
            <span className={styles.sezioneTitolo}>SEO <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text3)' }}>opzionale</span></span>
            <span className={`${styles.sezioneArrow} ${sezioneSeo ? styles.sezioneArrowOpen : ''}`}>›</span>
          </button>
          {sezioneSeo && (
            <div className={styles.sezioneBody}>
              <div className={styles.field}>
                <label>Meta Title ({metaTitle.length}/60)</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                  placeholder={`${title || 'Titolo evento'} | Boogie Bistrot`} maxLength={80} />
              </div>
              <div className={styles.field}>
                <label>Meta Description ({metaDescription.length}/160)</label>
                <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
                  rows={2} placeholder="Breve descrizione per i motori di ricerca..." maxLength={200} />
              </div>
            </div>
          )}
        </div>

        {/* ── SEZIONE 4: Social Media ── */}
        <div className={styles.sezione}>
          <button type="button" className={styles.sezioneHeader} onClick={() => setSezioneSocial(v => !v)}>
            <span className={styles.sezioneTitolo}>📱 Social Media</span>
            {statoSocial === 'pronto' && (
              <span className={styles.sezioneBadge} style={{ background: 'rgba(230,126,34,0.12)', color: '#E67E22', borderColor: 'rgba(230,126,34,0.3)' }}>Pronto</span>
            )}
            {statoSocial === 'pubblicato' && (
              <span className={styles.sezioneBadge} style={{ background: 'rgba(39,174,96,0.12)', color: '#27AE60', borderColor: 'rgba(39,174,96,0.3)' }}>Pubblicato</span>
            )}
            <span className={`${styles.sezioneArrow} ${sezioneSocial ? styles.sezioneArrowOpen : ''}`}>›</span>
          </button>
          {sezioneSocial && (
            <div className={styles.sezioneBody}>
              <div className={styles.field}>
                <label>Stato social</label>
                <div className={styles.tipoGroup}>
                  {[
                    { v: 'nessuno',    label: '— Nessuno',    bg: '#64748b' },
                    { v: 'pronto',     label: '⏳ Pronto',     bg: '#E67E22' },
                    { v: 'pubblicato', label: '✓ Pubblicato', bg: '#27AE60' },
                  ].map(({ v, label, bg }) => (
                    <button key={v} type="button"
                      className={`${styles.tipoBtn} ${statoSocial === v ? styles.tipoBtnActive : ''}`}
                      style={statoSocial === v ? { background: bg, borderColor: bg } : {}}
                      onClick={() => setStatoSocial(v)}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label>Caption social <span style={{ fontWeight: 400, color: 'var(--text3)' }}>({socialCopy.length} caratteri)</span></label>
                <textarea
                  value={socialCopy}
                  onChange={e => setSocialCopy(e.target.value)}
                  rows={5}
                  placeholder="Testo del post per Instagram, Facebook e Google Business..."
                />
              </div>
              <div>
                <button type="button" className={styles.btnAi} onClick={handleGeneraCaption} disabled={generandoCaption || !title.trim()}>
                  <Sparkle size={13} weight="fill" />
                  {generandoCaption ? 'Generando...' : 'Genera Caption AI'}
                </button>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text3)' }}>
                  Usa Gemini (piano gratuito) per scrivere la caption basandosi su titolo, descrizione e data dell'evento.
                  Richiede <code style={{ fontSize: '0.72rem', background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>GEMINI_API_KEY</code> nelle env vars Netlify.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {errore && (
        <div style={{ padding: '8px 20px', background: 'rgba(192,57,43,0.08)', borderTop: '1px solid rgba(192,57,43,0.2)' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#C0392B' }}>{errore}</p>
        </div>
      )}

      {confirmDelete ? (
        <div className={styles.confirmDeleteWrap}>
          <p className={styles.confirmDeleteMsg}>
            Scrivi <strong>{title}</strong> per confermare l'eliminazione:
          </p>
          <input
            className={styles.confirmDeleteInput}
            value={confirmInput}
            onChange={e => setConfirmInput(e.target.value)}
            placeholder={title}
            autoFocus
          />
          <div className={styles.confirmDeleteActions}>
            <button className={styles.btnAnnullaDelete} onClick={() => { setConfirmDelete(false); setConfirmInput('') }}>
              Annulla
            </button>
            <button
              className={styles.btnEliminaConfirm}
              disabled={confirmInput !== title}
              onClick={() => onElimina(appuntamento.id)}
            >
              Elimina definitivamente
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.editorFooter}>
          {isEdit && (
            <button className={styles.btnEliminaNew} onClick={() => setConfirmDelete(true)}>
              Elimina evento
            </button>
          )}
          <button className="btn-primary" onClick={handleSalva} disabled={loading || !title.trim()}>
            {loading ? '...' : isEdit ? 'Salva modifiche' : 'Aggiungi'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sezioni appuntamenti sotto il calendario ────────────────────────────────
function CardAppuntamento({ a, onEdit }) {
  const isPagina = !!a.slug
  const isDormiente = a.stato === 'dormiente'
  return (
    <button
      type="button"
      onClick={() => onEdit(a)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        padding: '10px 12px', background: 'var(--bg2)', cursor: 'pointer',
        opacity: isDormiente ? 0.7 : 1,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: isDormiente ? '#64748b' : isPagina ? 'var(--accent)' : '#E67E22',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {a.title}
        </p>
        {a.slug && (
          <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'monospace' }}>
            /eventi-speciali/{a.slug}
          </p>
        )}
      </div>
      {isDormiente && (
        <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 999, background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)', flexShrink: 0 }}>
          dormiente
        </span>
      )}
    </button>
  )
}

function SezioneLabel({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 999, padding: '1px 7px' }}>
        {count}
      </span>
    </div>
  )
}

function SezioniAppuntamenti({ appuntamenti, onEdit }) {
  const oggi = new Date().toISOString().split('T')[0]

  const pagineAttive    = appuntamenti.filter(a => a.slug && a.stato === 'attivo')
  const promozioniAttive = appuntamenti.filter(a => !a.slug && a.stato === 'attivo' && (!a.data || a.data >= oggi))
  const dormienti       = appuntamenti.filter(a => a.slug && a.stato === 'dormiente')
  const bozze           = appuntamenti.filter(a => a.stato === 'bozza')

  if (pagineAttive.length === 0 && promozioniAttive.length === 0 && dormienti.length === 0 && bozze.length === 0) return null

  return (
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {pagineAttive.length > 0 && (
        <div>
          <SezioneLabel label="Appuntamenti attivi" count={pagineAttive.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pagineAttive.map(a => <CardAppuntamento key={a.id} a={a} onEdit={onEdit} />)}
          </div>
        </div>
      )}
      {promozioniAttive.length > 0 && (
        <div>
          <SezioneLabel label="Promozioni attive" count={promozioniAttive.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {promozioniAttive.map(a => <CardAppuntamento key={a.id} a={a} onEdit={onEdit} />)}
          </div>
        </div>
      )}
      {dormienti.length > 0 && (
        <div>
          <SezioneLabel label="Appuntamenti dormienti" count={dormienti.length} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8 }}>
            Le pagine sono online per la SEO ma mostrano un avviso ai visitatori.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dormienti.map(a => <CardAppuntamento key={a.id} a={a} onEdit={onEdit} />)}
          </div>
        </div>
      )}
      {bozze.length > 0 && (
        <div>
          <SezioneLabel label="Bozze" count={bozze.length} />
          <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8 }}>
            Non visibili sul sito. Pubblicali impostando lo stato su "Attivo".
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bozze.map(a => <CardAppuntamento key={a.id} a={a} onEdit={onEdit} />)}
          </div>
        </div>
      )}
    </div>
  )
}

const isMobile = () => window.innerWidth <= 768

function faseSpons(dataEvento) {
  if (!dataEvento) return null
  const oggi = new Date(); oggi.setHours(0,0,0,0)
  const evento = new Date(dataEvento + 'T00:00:00')
  const giorni = Math.round((evento - oggi) / 86400000)
  if (giorni < 2)  return { emoji: '❌', label: 'Troppo tardi per sponsorizzare', sub: 'Usa Stories + link WhatsApp', tipo: 'stop' }
  if (giorni < 5)  return { emoji: '⚠️', label: 'Solo retargeting', sub: 'Mostralo a chi ti conosce già', tipo: 'warning' }
  if (giorni <= 14) return { emoji: '✅', label: 'Momento perfetto — lancia ora!', sub: `${giorni} giorni all'evento`, tipo: 'go' }
  if (giorni <= 30) return { emoji: '⏸️', label: 'Troppo presto per vendere', sub: 'Fai brand awareness, non chiedere prenotazioni', tipo: 'wait' }
  return              { emoji: '⏸️', label: 'Aspetta ancora', sub: 'Torna quando mancano ~14 giorni', tipo: 'wait' }
}

// ─── Pannello principale ─────────────────────────────────────────────────────
export default function AgendaPanel() {
  const { appuntamenti, loading, aggiungi, aggiorna, elimina } = useAppuntamenti()
  const { dati: meteo } = useMeteo()
  const { orari } = useOrari()
  const { chiusure } = useChiusure()

  // Giorni chiusi: nessun orario attivo + chiusure straordinarie settimanali
  const giorniChiusi = useMemo(() => {
    const conOrari = new Set(orari.filter(o => o.attivo && o.giorno !== null).map(o => o.giorno))
    const chiusiOrdinari = [0,1,2,3,4,5,6].filter(d => !conOrari.has(d))
    const chiusiStraordinari = chiusure
      .filter(c => c.tipo === 'Giorno della settimana' && c.tipoApertura === 'Chiusura' && c.giorno !== null)
      .map(c => c.giorno)
    return new Set([...chiusiOrdinari, ...chiusiStraordinari])
  }, [orari, chiusure])
  const [modal, setModal] = useState(null)
  const [vistaAttiva, setVistaAttiva] = useState(isMobile() ? 'listWeek' : 'dayGridMonth')
  const [aiAperto, setAiAperto] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggerimenti, setAiSuggerimenti] = useState(null)
  const [aiIgnorate, setAiIgnorate] = useState([])
  const [ignorateAperte, setIgnorateAperte] = useState(false)
  const calRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (modal && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [modal])

  async function richiediSuggerimenti(force = false) {
    setAiAperto(true)
    if (aiSuggerimenti && !force) return
    setAiLoading(true)
    setAiSuggerimenti(null)
    const oggi = new Date()
    const fraduemesi = new Date(oggi)
    fraduemesi.setMonth(fraduemesi.getMonth() + 2)
    const appFiltrati = appuntamenti.filter(a => {
      if (!a.data) return false
      const d = new Date(a.data + 'T12:00:00')
      return d >= oggi && d <= fraduemesi
    })
    const festFiltrate = FESTIVITA.filter(f => {
      const d = new Date(f.date + 'T12:00:00')
      return d >= oggi && d <= fraduemesi
    }).map(f => ({ date: f.date, title: f.title.replace(/\p{Emoji}/gu, '').trim() }))
    try {
      const meteoPerData = {}
      if (meteo) {
        meteo.forEach(g => { meteoPerData[g.dateStr] = g })
      }

      const festivitaConMeteo = festFiltrate.map(f => {
        const m = meteoPerData[f.date]
        return {
          ...f,
          meteo: m ? { tMax: m.tMax, tMin: m.tMin, pioggia: m.pioggia, codice: m.codice } : null
        }
      })

      const res = await authFetch('/.netlify/functions/suggerisci-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appuntamenti: appFiltrati, festivita: festivitaConMeteo, dataOggi: oggi.toISOString().split('T')[0] })
      })
      const json = await res.json()
      setAiSuggerimenti(Array.isArray(json.suggerimenti) ? json.suggerimenti : [])
    } catch {
      setAiSuggerimenti([])
    }
    setAiLoading(false)
  }

  function ignoraSuggerimento(i) {
    const s = aiSuggerimenti[i]
    setAiSuggerimenti(prev => prev.filter((_, idx) => idx !== i))
    setAiIgnorate(prev => [...prev, s])
  }

  function ripristinaSuggerimento(i) {
    const s = aiIgnorate[i]
    setAiIgnorate(prev => prev.filter((_, idx) => idx !== i))
    setAiSuggerimenti(prev => [...(prev || []), s])
  }

  function seguiConsiglio(s) {
    setModal({ data: s.dataFestivita, appuntamento: null, prefill: { title: s.festivita, data: s.dataFestivita, visibilita: 'promozione' } })
    ignoraSuggerimento(aiSuggerimenti.indexOf(s))
  }

  function cambiaVista(vista) {
    setVistaAttiva(vista)
    calRef.current?.getApi().changeView(vista)
  }

  const viste = isMobile()
    ? [{ id: 'listDay', label: 'Giorno' }, { id: 'listWeek', label: 'Settimana' }, { id: 'listMonth', label: 'Mese' }]
    : [{ id: 'dayGridMonth', label: 'Mese' }, { id: 'timeGridWeek', label: 'Settimana' }, { id: 'timeGridDay', label: 'Giorno' }]

  const festivitaLabels = FESTIVITA.map(f => ({
    ...f,
    color: 'transparent',
    textColor: '#A0722A',
    classNames: ['fc-festivita-label'],
    editable: false,
  }))

  const appEvents = appuntamenti.flatMap(a => {
    const isRicorrente = a.ricorrenza && a.ricorrenza !== 'nessuna'
    const isDormiente = a.stato === 'dormiente'
    const isBozza = a.stato === 'bozza'
    const vis = a.slug ? 'pagina' : 'promozione'
    const color = isDormiente
      ? '#94a3b8'
      : isBozza
        ? '#ffffff'
        : isRicorrente
          ? (VISIBILITA_COLORI_RICORRENTE[vis] || VISIBILITA_COLORI_RICORRENTE['promozione'])
          : (VISIBILITA_COLORI[vis] || VISIBILITA_COLORI['promozione'])
    const base = {
      title:           a.title,
      backgroundColor: color,
      borderColor:     color,
      textColor:       isBozza ? '#000' : '#fff',
      classNames:      isBozza ? ['fc-event-bozza'] : [],
      extendedProps:   a,
    }

    if (!a.ricorrenza || a.ricorrenza === 'nessuna') {
      if (a.ora) {
        const start = `${a.data}T${a.ora}`
        const end = a.oraFine ? `${a.data}T${a.oraFine}` : undefined
        return [{ ...base, id: a.id, start, ...(end ? { end } : {}) }]
      }
      return [{ ...base, id: a.id, date: a.data }]
    }

    const endRecur = a.dataFineRicorrenza || null

    const timeProps = {
      ...(a.ora ? { startTime: a.ora } : {}),
      ...(a.oraFine ? { endTime: a.oraFine } : {}),
    }

    if (a.ricorrenza === 'giornaliera') {
      const esclusi = a.giorniEsclusione
        ? a.giorniEsclusione.split(',').map(Number)
        : []
      const daysOfWeek = [0,1,2,3,4,5,6].filter(d => !esclusi.includes(d) && !giorniChiusi.has(d))
      const ev = { ...base, ...timeProps, groupId: a.id, daysOfWeek, startRecur: a.data }
      if (endRecur) ev.endRecur = endRecur
      return [ev]
    }

    if (a.ricorrenza === 'settimanale') {
      const giorni = a.giorniSettimana
        ? a.giorniSettimana.split(',').map(Number)
        : [new Date(a.data + 'T12:00:00').getDay()]
      const ev = { ...base, ...timeProps, groupId: a.id, daysOfWeek: giorni, startRecur: a.data }
      if (endRecur) ev.endRecur = endRecur
      return [ev]
    }

    if (a.ricorrenza === 'mensile') {
      const dayOfMonth = new Date(a.data + 'T12:00:00').getDate()
      const limit = endRecur ? new Date(endRecur + 'T12:00:00') : new Date(new Date().getFullYear() + 2, 11, 31)
      const events = []
      let d = new Date(a.data + 'T12:00:00')
      while (d <= limit) {
        const dateStr = d.toISOString().split('T')[0]
        events.push({ ...base, id: `${a.id}-${dateStr}`, date: dateStr })
        d = new Date(d.getFullYear(), d.getMonth() + 1, dayOfMonth)
      }
      return events
    }

    return [{ ...base, id: a.id, date: a.data }]
  })

  function handleDateClick(info) {
    setModal({ data: info.dateStr, appuntamento: null })
  }

  function handleEventClick(info) {
    if (info.event.classNames.includes('fc-festivita-label')) return
    setModal({ data: null, appuntamento: info.event.extendedProps })
  }

  async function handleSalva(dati) {
    const json = dati.id ? await aggiorna(dati) : await aggiungi(dati)
    if (!json.success) throw new Error(json.error || 'Errore Airtable')
    setModal(null)
  }

  async function handleElimina(id) {
    await elimina(id)
    setModal(null)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          <CalendarDots size={20} weight="light" />
          Appuntamenti
        </h1>
        <div className={styles.headerRight}>
          <div className={styles.vistaTabs}>
            {viste.map(v => (
              <button key={v.id} className={`btn-toggle ${vistaAttiva === v.id ? 'active' : ''}`} onClick={() => cambiaVista(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          <button className={styles.btnAi} onClick={richiediSuggerimenti} style={{ display: 'none' }}>
            <Sparkle size={15} weight="fill" />
            <span className={styles.btnAiLabel}>Radar Festività</span>
          </button>
        </div>
      </div>

      <div className={`${styles.contentLayout} ${aiAperto ? styles.contentLayoutAi : ''}`}>
        <div className={styles.layout}>
          <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={vistaAttiva}
              locale={itLocale}
              height="auto"
              headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
              events={[...festivitaLabels, ...appEvents]}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              editable={false}
              displayEventTime={false}
              eventContent={(info) => {
                if (info.event.classNames.includes('fc-festivita-label')) return null
                const { ora, oraFine, stato } = info.event.extendedProps
                const isBozza = stato === 'bozza'
                const oraLabel = ora && oraFine ? `${ora}–${oraFine}` : (ora || '')
                const bg = info.event.backgroundColor
                const textCol = isBozza ? '#1e293b' : '#fff'
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', padding: '2px 6px', borderRadius: '3px', background: bg, width: '100%', border: isBozza ? '1.5px dashed #94a3b8' : 'none' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 600, color: textCol, fontStyle: isBozza ? 'italic' : 'normal' }}>
                      {info.event.title}
                    </span>
                    {oraLabel && (
                      <span style={{ flexShrink: 0, fontSize: '0.68rem', background: isBozza ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.25)', borderRadius: '4px', padding: '1px 5px', fontWeight: 500, color: textCol }}>
                        {oraLabel}
                      </span>
                    )}
                  </div>
                )
              }}
              dayMaxEvents={3}
              listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
              listDaySideFormat={false}
              noEventsText="Nessun evento"
            />
        </div>

        {aiAperto && (
          <div className={styles.aiPanel}>
            <div className={styles.aiHeader}>
              <span className={styles.aiTitolo}><Sparkle size={14} weight="fill" /> Radar Festività</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!aiLoading && <button className="btn-icon" title="Rigenera" onClick={() => richiediSuggerimenti(true)}>↺</button>}
                <button className="btn-icon" onClick={() => setAiAperto(false)}><IconClose size={14} /></button>
              </div>
            </div>
            <div className={styles.aiBody}>
              {aiLoading
                ? <span className={styles.aiLoading}>Elaborazione in corso...</span>
                : <>
                    {aiSuggerimenti && aiSuggerimenti.length === 0 && aiIgnorate.length === 0 && (
                      <span className={styles.aiLoading}>Nessuna festività scoperta nei prossimi 30 giorni.</span>
                    )}
                    {(aiSuggerimenti || []).map((s, i) => (
                      <div key={i} className={styles.aiCard}>
                        {(s.categoria || s.meteo_mood) && (
                          <div className={styles.aiMeta}>
                            {s.categoria && <span className={styles.aiCategoria}>{s.categoria}</span>}
                            {s.meteo_mood && <span className={styles.aiMeteo}>{s.meteo_mood}</span>}
                          </div>
                        )}
                        <p className={styles.aiTesto}><strong>{s.festivita}</strong> — {s.testo}</p>
                        {(s.dataFestivita || s.evento?.data) && (() => {
                          const f = faseSpons(s.dataFestivita || s.evento?.data)
                          return (
                            <div className={`${styles.faseBadge} ${styles[`faseBadge_${f.tipo}`]}`}>
                              <span>{f.emoji} {f.label}</span>
                              {f.sub && <span className={styles.faseSub}>{f.sub}</span>}
                            </div>
                          )
                        })()}
                        <div className={styles.aiActions}>
                          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => ignoraSuggerimento(i)}>Ignora</button>
                          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => seguiConsiglio(s)}>+ Aggiungi</button>
                        </div>
                      </div>
                    ))}
                    {aiIgnorate.length > 0 && (
                      <div className={styles.ignorateWrap}>
                        <button className={styles.ignorateToggle} onClick={() => setIgnorateAperte(p => !p)}>
                          {ignorateAperte ? '▲' : '▼'} Ignorate ({aiIgnorate.length})
                        </button>
                        {ignorateAperte && aiIgnorate.map((s, i) => (
                          <div key={i} className={styles.aiCardIgnorata}>
                            <p className={styles.aiTesto}><strong>{s.festivita}</strong> — {s.testo}</p>
                            <div className={styles.aiActions}>
                              <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => ripristinaSuggerimento(i)}>Ripristina</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
              }
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div ref={editorRef} style={{ marginTop: 24 }}>
          <EditorAppuntamento
            key={modal.appuntamento?.id || 'nuovo'}
            data={modal.data}
            appuntamento={modal.appuntamento}
            prefill={modal.prefill}
            onSalva={handleSalva}
            onElimina={handleElimina}
            onClose={() => setModal(null)}
          />
        </div>
      )}

      <SezioniAppuntamenti
        appuntamenti={appuntamenti}
        onEdit={a => setModal({ data: null, appuntamento: a })}
      />
    </div>
  )
}
