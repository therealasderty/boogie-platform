import { useState, useEffect } from 'react'
import { InstagramLogo, FacebookLogo, GoogleLogo, Sparkle, ShareNetwork, PlusCircle, X } from '@phosphor-icons/react'
import { authFetch } from '../../lib/authFetch'
import { useMedia } from '../../hooks/useMedia'
import { IconRefresh } from '../../icons/index.jsx'
import styles from './SocialPanel.module.css'

const SITO_BASE = 'https://boogiebistrot.it'

function cloudinaryThumb(url, width = 200) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
}

const PIATTAFORME_CONFIG = [
  { key: 'instagram', label: 'Instagram',       color: '#E1306C', Icon: InstagramLogo, requiresImg: true  },
  { key: 'facebook',  label: 'Facebook',        color: '#1877F2', Icon: FacebookLogo,  requiresImg: false },
  { key: 'google',    label: 'Google Business', color: '#4285F4', Icon: GoogleLogo,    requiresImg: false },
]

// ── Compositore post libero ───────────────────────────────────────────────────
function ComposerPost({ onClose }) {
  const { items: mediaItems, loading: mediaLoading } = useMedia()

  const [fotoSelezionata, setFotoSelezionata]   = useState(null)
  const [tagFiltro, setTagFiltro]               = useState('tutti')
  const [caption, setCaption]                   = useState('')
  const [argomento, setArgomento]               = useState('')
  const [piattaforme, setPiattaforme]           = useState({ instagram: true, facebook: true, google: false })
  const [generando, setGenerando]               = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [risultato, setRisultato]               = useState(null)

  // Ricava tutti i tag unici dalle foto
  const tuttiTag = ['tutti', ...new Set(mediaItems.flatMap(m => m.tag).filter(Boolean)).values()]

  const fotoFiltrate = tagFiltro === 'tutti'
    ? mediaItems
    : mediaItems.filter(m => m.tag.includes(tagFiltro))

  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)

  async function handleGeneraCaption() {
    setGenerando(true)
    setRisultato(null)
    try {
      const res = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titolo:      argomento || 'Post Boogie Bistrot',
          descrizione: '',
          tipo:        'post_libero',
        }),
      })
      const data = await res.json()
      if (data.success && data.caption) setCaption(data.caption)
      else setRisultato({ tipo: 'err', msg: data.error || 'Errore generazione' })
    } catch (e) {
      setRisultato({ tipo: 'err', msg: e.message })
    } finally {
      setGenerando(false)
    }
  }

  async function handlePubblica() {
    if (!caption.trim()) { setRisultato({ tipo: 'err', msg: 'Scrivi una caption prima di pubblicare.' }); return }
    if (piattaformeAttive.length === 0) { setRisultato({ tipo: 'err', msg: 'Seleziona almeno una piattaforma.' }); return }
    if (piattaforme.instagram && !fotoSelezionata) { setRisultato({ tipo: 'err', msg: 'Instagram richiede una foto.' }); return }
    if (!window.confirm(`Pubblicare su ${piattaformeAttive.join(', ')}?`)) return

    setLoading(true)
    setRisultato(null)
    try {
      const res = await authFetch('/.netlify/functions/pubblica-social?action=pubblica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          imageUrl:    fotoSelezionata?.url || '',
          piattaforme: piattaformeAttive,
          titolo:      argomento || 'Boogie Bistrot',
          link:        SITO_BASE,
        }),
      })
      const data = await res.json()
      setRisultato({ tipo: data.success ? 'ok' : 'parziale', data })
    } catch (e) {
      setRisultato({ tipo: 'err', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.composer}>
      <div className={styles.composerHeader}>
        <span className={styles.composerTitolo}>Crea post</span>
        <button className={styles.composerClose} onClick={onClose}><X size={16} /></button>
      </div>

      <div className={styles.composerBody}>

        {/* ── Selezione foto ── */}
        <div className={styles.composerSection}>
          <div className={styles.composerSectionLabel}>Foto dalla galleria</div>

          {/* Filtri tag */}
          <div className={styles.tagFiltri}>
            {tuttiTag.map(t => (
              <button
                key={t}
                className={`${styles.tagBtn} ${tagFiltro === t ? styles.tagBtnActive : ''}`}
                onClick={() => setTagFiltro(t)}
              >{t}</button>
            ))}
          </div>

          {/* Griglia foto */}
          {mediaLoading ? (
            <div className={styles.composerLoading}>Caricamento galleria...</div>
          ) : (
            <div className={styles.fotoGrid}>
              {fotoFiltrate.map(foto => (
                <button
                  key={foto.id}
                  className={`${styles.fotoCell} ${fotoSelezionata?.id === foto.id ? styles.fotoCellSelected : ''}`}
                  onClick={() => setFotoSelezionata(f => f?.id === foto.id ? null : foto)}
                  title={foto.alt || foto.nome}
                >
                  <img src={cloudinaryThumb(foto.url)} alt={foto.alt || ''} className={styles.fotoImg} />
                  {fotoSelezionata?.id === foto.id && (
                    <div className={styles.fotoCheck}>✓</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Preview foto selezionata */}
          {fotoSelezionata && (
            <div className={styles.fotoSelezionataWrap}>
              <img src={fotoSelezionata.url} alt="" className={styles.fotoSelezionataPreview} />
              <div className={styles.fotoSelezionataInfo}>
                <span>{fotoSelezionata.alt || fotoSelezionata.nome || 'Foto selezionata'}</span>
                {fotoSelezionata.tag.length > 0 && (
                  <span className={styles.fotoTag}>{fotoSelezionata.tag.join(', ')}</span>
                )}
              </div>
              <button className={styles.fotoDeseleziona} onClick={() => setFotoSelezionata(null)}>
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ── Caption ── */}
        <div className={styles.composerSection}>
          <div className={styles.composerSectionLabel}>Caption</div>

          <div className={styles.argomentoRow}>
            <input
              className={styles.argomentoInput}
              value={argomento}
              onChange={e => setArgomento(e.target.value)}
              placeholder="Argomento per l'AI (es. &quot;serata estiva in giardino&quot;, &quot;pizza forno a legna&quot;)…"
            />
            <button
              className={styles.btnAi}
              onClick={handleGeneraCaption}
              disabled={generando}
              title="Genera caption con Gemini AI"
            >
              <Sparkle size={13} weight="fill" />
              {generando ? 'Generando...' : 'Genera AI'}
            </button>
          </div>

          <textarea
            className={styles.composerTextarea}
            value={caption}
            onChange={e => { setCaption(e.target.value); setRisultato(null) }}
            rows={6}
            placeholder="Scrivi la caption oppure generala con AI..."
          />
          <div className={styles.charCount}>{caption.length} / 2200</div>
        </div>

        {/* ── Piattaforme ── */}
        <div className={styles.composerSection}>
          <div className={styles.composerSectionLabel}>Pubblica su</div>
          <div className={styles.piattaformeGroup}>
            {PIATTAFORME_CONFIG.map(({ key, label, color, Icon, requiresImg }) => (
              <button
                key={key}
                className={`${styles.piattaformaBtn} ${piattaforme[key] ? styles.piattaformaBtnActive : ''}`}
                style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
                onClick={() => setPiattaforme(prev => ({ ...prev, [key]: !prev[key] }))}
                title={requiresImg && !fotoSelezionata ? 'Richiede una foto selezionata' : label}
              >
                <Icon size={15} />
                {label}
                {requiresImg && !fotoSelezionata && <span className={styles.piattaformaWarn}>⚠</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Risultato */}
        {risultato?.tipo === 'ok' && (
          <div className={styles.risultatoOk}>✓ Pubblicato con successo su {piattaformeAttive.join(', ')}</div>
        )}
        {risultato?.tipo === 'parziale' && risultato.data && (
          <div className={styles.risultatoParziale}>
            {Object.entries(risultato.data.risultati || {}).map(([p]) => (
              <div key={p} className={styles.risultatoRiga}>✓ {p}: pubblicato</div>
            ))}
            {Object.entries(risultato.data.errori || {}).map(([p, e]) => (
              <div key={p} className={styles.risultatoRigaErr}>✕ {p}: {e}</div>
            ))}
          </div>
        )}
        {risultato?.tipo === 'err' && (
          <div className={styles.risultatoErr}>{risultato.msg}</div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.composerFooter}>
        <button className={styles.btnSegna} onClick={onClose}>Annulla</button>
        <button
          className={styles.btnPubblica}
          onClick={handlePubblica}
          disabled={loading || piattaformeAttive.length === 0}
        >
          {loading ? 'Pubblicando...' : 'Pubblica ora →'}
        </button>
      </div>
    </div>
  )
}

// ── Card singolo contenuto ────────────────────────────────────────────────────
function CardSocial({ item, onAggiornato }) {
  const [caption, setCaption]           = useState(item.socialCopy || '')
  const [piattaforme, setPiattaforme]   = useState({ instagram: true, facebook: true, google: false })
  const [loading, setLoading]           = useState(false)
  const [generando, setGenerando]       = useState(false)
  const [risultato, setRisultato]       = useState(null)

  const piattaformeAttive = Object.entries(piattaforme).filter(([, v]) => v).map(([k]) => k)

  const linkPubblico = item.slug
    ? `${SITO_BASE}/${item.source === 'blog' ? 'blog' : 'eventi-speciali'}/${item.slug}`
    : ''

  const imageUrl = item.fotoHero || item.fotoUrl || ''

  async function handleGeneraCaption() {
    setGenerando(true)
    setRisultato(null)
    try {
      const res = await authFetch('/.netlify/functions/pubblica-social?action=genera-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titolo:      item.titolo || item.title || '',
          descrizione: item.descrizioneBreve || '',
          data:        item.data || '',
          ora:         item.ora || '',
          tipo:        item.source === 'blog' ? 'articolo' : 'evento',
        }),
      })
      const data = await res.json()
      if (data.success && data.caption) {
        setCaption(data.caption)
      } else {
        setRisultato({ tipo: 'err', msg: data.error || 'Errore nella generazione caption' })
      }
    } catch (e) {
      setRisultato({ tipo: 'err', msg: e.message })
    } finally {
      setGenerando(false)
    }
  }

  async function aggiornaSuAirtable(nuovoStatoSocial, nuovaCaption) {
    const endpoint = item.source === 'blog' ? 'gestisci-blog' : 'gestisci-appuntamenti'
    await authFetch(`/.netlify/functions/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, statoSocial: nuovoStatoSocial, socialCopy: nuovaCaption }),
    })
  }

  async function handlePubblica() {
    if (!caption.trim()) {
      setRisultato({ tipo: 'err', msg: 'Inserisci una caption prima di pubblicare.' })
      return
    }
    if (piattaformeAttive.length === 0) {
      setRisultato({ tipo: 'err', msg: 'Seleziona almeno una piattaforma.' })
      return
    }
    if (!window.confirm(`Pubblicare su ${piattaformeAttive.join(', ')}?`)) return

    setLoading(true)
    setRisultato(null)
    try {
      const res = await authFetch('/.netlify/functions/pubblica-social?action=pubblica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          imageUrl,
          piattaforme: piattaformeAttive,
          titolo: item.titolo || item.title || '',
          link: linkPubblico,
        }),
      })
      const data = await res.json()
      setRisultato({ tipo: data.success ? 'ok' : 'parziale', data })

      // Aggiorna Airtable con il nuovo stato e la caption usata
      if (data.success || Object.keys(data.risultati || {}).length > 0) {
        await aggiornaSuAirtable('pubblicato', caption)
        onAggiornato()
      }
    } catch (e) {
      setRisultato({ tipo: 'err', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSegnaManualmente() {
    setLoading(true)
    try {
      await aggiornaSuAirtable('pubblicato', caption)
      onAggiornato()
    } catch (e) {
      setRisultato({ tipo: 'err', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.card} ${item.statoSocial === 'pubblicato' ? styles.cardPubblicata : ''}`}>

      {/* Intestazione card */}
      <div className={styles.cardTop}>
        {imageUrl && <img className={styles.cardFoto} src={imageUrl} alt="" />}
        <div className={styles.cardInfo}>
          <div className={styles.cardTitolo}>{item.titolo || item.title}</div>
          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${item.source === 'blog' ? styles.badgeBlog : styles.badgeEvento}`}>
              {item.source === 'blog' ? '📝 Blog' : '📅 Evento'}
            </span>
            {item.data && (
              <span className={styles.cardData}>
                {new Date(item.data + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {item.statoSocial === 'pubblicato' && (
              <span className={styles.badgePubblicato}>✓ Pubblicato</span>
            )}
          </div>
          {linkPubblico && (
            <a href={linkPubblico} target="_blank" rel="noreferrer" className={styles.linkPubblico}>
              {linkPubblico.replace('https://', '')}
            </a>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className={styles.captionSection}>
        <label className={styles.fieldLabel}>Caption</label>
        <div className={styles.captionWrap}>
          <textarea
            className={styles.captionTextarea}
            value={caption}
            onChange={e => { setCaption(e.target.value); setRisultato(null) }}
            rows={5}
            placeholder="Scrivi la caption del post o generala con AI..."
          />
          {imageUrl && <img className={styles.captionPreview} src={imageUrl} alt="" />}
        </div>
        <div className={styles.captionFooter}>
          <button className={styles.btnAi} onClick={handleGeneraCaption} disabled={generando}>
            <Sparkle size={13} weight="fill" />
            {generando ? 'Generando...' : 'Genera con AI'}
          </button>
          <span className={styles.charCount}>{caption.length} / 2200</span>
        </div>
      </div>

      {/* Selezione piattaforme */}
      <div className={styles.piattaformeSection}>
        <label className={styles.fieldLabel}>Pubblica su</label>
        <div className={styles.piattaformeGroup}>
          {[
            { key: 'instagram', label: 'Instagram', color: '#E1306C', Icon: InstagramLogo, requiresImg: true },
            { key: 'facebook',  label: 'Facebook',  color: '#1877F2', Icon: FacebookLogo,  requiresImg: false },
            { key: 'google',    label: 'Google Business', color: '#4285F4', Icon: GoogleLogo, requiresImg: false },
          ].map(({ key, label, color, Icon, requiresImg }) => (
            <button
              key={key}
              title={requiresImg && !imageUrl ? 'Richiede FotoHero' : label}
              className={`${styles.piattaformaBtn} ${piattaforme[key] ? styles.piattaformaBtnActive : ''} ${requiresImg && !imageUrl ? styles.piattaformaBtnDisabled : ''}`}
              style={piattaforme[key] ? { borderColor: color, color, background: `${color}18` } : {}}
              onClick={() => setPiattaforme(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              <Icon size={15} />
              {label}
              {requiresImg && !imageUrl && <span className={styles.piattaformaWarn}>⚠</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Risultato pubblicazione */}
      {risultato && risultato.tipo === 'ok' && (
        <div className={styles.risultatoOk}>
          ✓ Pubblicato con successo su {piattaformeAttive.join(', ')}
        </div>
      )}
      {risultato && risultato.tipo === 'parziale' && risultato.data && (
        <div className={styles.risultatoParziale}>
          {Object.entries(risultato.data.risultati || {}).map(([p]) => (
            <div key={p} className={styles.risultatoRiga}>✓ {p}: pubblicato</div>
          ))}
          {Object.entries(risultato.data.errori || {}).map(([p, e]) => (
            <div key={p} className={styles.risultatoRigaErr}>✕ {p}: {e}</div>
          ))}
        </div>
      )}
      {risultato && risultato.tipo === 'err' && (
        <div className={styles.risultatoErr}>{risultato.msg}</div>
      )}

      {/* Azioni */}
      <div className={styles.cardActions}>
        <button
          className={styles.btnSegna}
          onClick={handleSegnaManualmente}
          disabled={loading || item.statoSocial === 'pubblicato'}
          title="Segna come pubblicato senza usare l'integrazione API"
        >
          ✓ Segna pubblicato
        </button>
        <button
          className={styles.btnPubblica}
          onClick={handlePubblica}
          disabled={loading || piattaformeAttive.length === 0}
        >
          {loading ? 'Pubblicando...' : 'Pubblica ora →'}
        </button>
      </div>
    </div>
  )
}

// ── Pannello principale ───────────────────────────────────────────────────────
export default function SocialPanel() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState('pronto')
  const [tipo, setTipo]           = useState('tutti')
  const [refresh, setRefresh]     = useState(0)
  const [composerAperto, setComposerAperto] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch('/.netlify/functions/gestisci-appuntamenti').then(r => r.json()),
      authFetch('/.netlify/functions/gestisci-blog').then(r => r.json()),
    ]).then(([agendaData, blogData]) => {
      const eventi = (agendaData.appuntamenti || [])
        .filter(a => a.statoSocial && a.statoSocial !== 'nessuno')
        .map(a => ({ ...a, source: 'evento' }))

      const articoli = (blogData.articoli || [])
        .filter(a => a.statoSocial && a.statoSocial !== 'nessuno')
        .map(a => ({ ...a, source: 'blog', title: a.titolo, data: a.dataPubblicazione }))

      // Ordina: prima i "pronto", poi i "pubblicato"
      const tutto = [...eventi, ...articoli].sort((a, b) => {
        if (a.statoSocial === 'pronto' && b.statoSocial !== 'pronto') return -1
        if (b.statoSocial === 'pronto' && a.statoSocial !== 'pronto') return 1
        return 0
      })
      setItems(tutto)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [refresh])

  const filtered = items.filter(item => {
    const matchFiltro = filtro === 'tutti' || item.statoSocial === filtro
    const matchTipo   = tipo === 'tutti' || item.source === tipo
    return matchFiltro && matchTipo
  })

  const prontiCount     = items.filter(i => i.statoSocial === 'pronto').length
  const pubblicatiCount = items.filter(i => i.statoSocial === 'pubblicato').length

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titolo}>
            <ShareNetwork size={20} weight="light" />
            Social Scheduler
          </div>
          {prontiCount > 0 && (
            <span className={styles.badgePronte}>{prontiCount} {prontiCount === 1 ? 'pronto' : 'pronti'}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.btnCreaPost}
            onClick={() => setComposerAperto(v => !v)}
          >
            <PlusCircle size={16} />
            {composerAperto ? 'Chiudi compositore' : 'Crea post'}
          </button>
          <button className={styles.btnRefresh} onClick={() => setRefresh(r => r + 1)} title="Ricarica">
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      {/* Compositore post libero */}
      {composerAperto && (
        <ComposerPost onClose={() => setComposerAperto(false)} />
      )}

      {/* Filtri */}
      <div className={styles.filtriRow}>
        <div className={styles.filtriGroup}>
          {[
            ['pronto',    `In attesa${prontiCount > 0 ? ` (${prontiCount})` : ''}`],
            ['pubblicato', `Pubblicati${pubblicatiCount > 0 ? ` (${pubblicatiCount})` : ''}`],
            ['tutti',      'Tutti'],
          ].map(([v, l]) => (
            <button key={v} className={`${styles.tab} ${filtro === v ? styles.tabActive : ''}`}
              onClick={() => setFiltro(v)}>{l}</button>
          ))}
        </div>
        <div className={styles.filtriGroup}>
          {[['tutti','Tutti'],['evento','Eventi'],['blog','Blog']].map(([v, l]) => (
            <button key={v} className={`${styles.tab} ${tipo === v ? styles.tabActive : ''}`}
              onClick={() => setTipo(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Contenuto */}
      {loading ? (
        <div className={styles.empty}>Caricamento contenuti...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <ShareNetwork size={40} weight="thin" style={{ opacity: 0.3 }} />
          {filtro === 'pronto' ? (
            <>
              <p className={styles.emptyTitolo}>Nessun contenuto pronto per i social</p>
              <p className={styles.emptySub}>
                Vai in <strong>Appuntamenti</strong> o <strong>Blog</strong>, apri un contenuto, scorri fino alla sezione <em>📱 Social Media</em> e imposta lo stato su <strong>Pronto</strong>.
              </p>
            </>
          ) : (
            <p className={styles.emptyTitolo}>Nessun contenuto trovato</p>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(item => (
            <CardSocial
              key={`${item.source}-${item.id}`}
              item={item}
              onAggiornato={() => setRefresh(r => r + 1)}
            />
          ))}
        </div>
      )}

      {/* Info configurazione */}
      <div className={styles.infoBox}>
        <strong>Variabili d'ambiente richieste (Netlify):</strong>{' '}
        <code>GEMINI_API_KEY</code> · <code>META_PAGE_ID</code> · <code>META_ACCESS_TOKEN</code> · <code>META_IG_USER_ID</code> · <code>GOOGLE_CLIENT_ID</code> · <code>GOOGLE_CLIENT_SECRET</code> · <code>GOOGLE_REFRESH_TOKEN</code> · <code>GOOGLE_LOCATION_NAME</code>
      </div>
    </div>
  )
}
