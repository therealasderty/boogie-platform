import { usePanoramica } from '../../hooks/usePanoramica'
import { IconRefresh, IconExternalLink } from '../../icons/index.jsx'
import styles from './PanoramicaSitoPanel.module.css'

const SITO = 'https://www.boogiebistrot.com'

const PAGINE_SITO = [
  { label: 'Homepage', path: '/' },
  { label: 'Specialità alla Carta', path: '/menu/specialita' },
  { label: 'La Pizza', path: '/menu/pizza' },
  { label: 'Carta dei Vini', path: '/menu/vini' },
  { label: 'Le Birre', path: '/menu/birre' },
  { label: 'Cocktail', path: '/menu/cocktails' },
  { label: 'Prenota un tavolo', path: '/prenota' },
  { label: 'Appuntamenti', path: '/eventi-speciali' },
  { label: 'Cene Aziendali di Natale', path: '/cene-aziendali-natale', stagionale: 'natale' },
  { label: 'Eventi Aziendali', path: '/eventi-aziendali', stagionale: 'standard' },
  { label: 'Comunioni e Cresime', path: '/comunioni-e-cresime' },
  { label: 'Galleria', path: '/galleria' },
  { label: 'Blog', path: '/blog' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Fidelity Card', path: '/fidelity' },
  { label: 'Contattaci', path: '/contattaci' },
  { label: 'Pagina Link Social', path: '/links' },
]

function formatData(d) {
  if (!d) return 'Ricorrente'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

function StatoTag({ stato }) {
  const map = {
    Bozza: styles.statoBozza,
    Programmata: styles.statoProgrammato,
    Programmato: styles.statoProgrammato,
    InCorso: styles.statoInCorso,
    Completata: styles.statoCompletata,
    Pausa: styles.statoPausa,
    Pubblicato: styles.statoAttivo,
  }
  return <span className={`${styles.stato} ${map[stato] || styles.statoBozza}`}>{stato}</span>
}

export default function PanoramicaSitoPanel() {
  const { dati, loading, ricarica } = usePanoramica()

  if (loading) return <div className={styles.loading}>Caricamento panoramica...</div>
  if (!dati) return <div className={styles.loading}>Errore nel caricamento</div>

  const meseCorrente = new Date().getMonth()
  const isNatale = meseCorrente >= 8 // Set–Dic

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Panoramica Sito</div>
          <div className={styles.subtitle}>Quadro generale di cosa è attivo e visibile sul sito</div>
        </div>
        <button className="btn-icon" onClick={ricarica} title="Aggiorna">
          <IconRefresh size={15} />
        </button>
      </div>

      <div className={styles.grid}>

        {/* ── Appuntamenti ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Appuntamenti sul sito
              <span className={styles.badge}>{dati.appuntamenti.totale}</span>
            </span>
          </div>
          <div className={styles.list}>
            {dati.appuntamenti.lista.length === 0 && (
              <div className={styles.empty}>Nessun appuntamento pubblicato</div>
            )}
            {dati.appuntamenti.lista.slice(0, 8).map(a => (
              <div key={a.id} className={styles.listItem}>
                {a.inPrimoPiano && <span className={styles.dotEvidenza} title="In primo piano" />}
                <span className={styles.listItemLabel}>{a.titolo}</span>
                <span className={styles.listItemMeta}>{formatData(a.data)}</span>
              </div>
            ))}
            {dati.appuntamenti.lista.length > 8 && (
              <div className={styles.empty}>+{dati.appuntamenti.lista.length - 8} altri</div>
            )}
          </div>
        </div>

        {/* ── Menu ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Piatti attivi nel menu
              <span className={`${styles.badge} ${styles.badgeGreen}`}>{dati.menu.totale}</span>
            </span>
          </div>
          <div className={styles.menuGrid}>
            {Object.entries(dati.menu.perCategoria).map(([cat, count]) => (
              <div key={cat} className={styles.menuCat}>
                <span className={styles.menuCatLabel}>{cat}</span>
                <span className={styles.menuCatCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Campagne email ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Campagne email
              <span className={styles.badge}>{dati.campagne.totale}</span>
            </span>
          </div>
          <div className={styles.list}>
            {dati.campagne.lista.length === 0 && (
              <div className={styles.empty}>Nessuna campagna</div>
            )}
            {dati.campagne.lista.slice(0, 8).map(c => (
              <div key={c.id} className={styles.listItem}>
                <span className={styles.listItemLabel}>{c.titolo}</span>
                <StatoTag stato={c.stato} />
                {c.totaleInviati > 0 && (
                  <span className={styles.listItemMeta}>{c.totaleInviati} inviate</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Social programmati ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Post social
              {dati.social.programmati > 0 && (
                <span className={styles.badge}>{dati.social.programmati} programmati</span>
              )}
            </span>
          </div>
          <div className={styles.list}>
            {dati.social.lista.length === 0 && (
              <div className={styles.empty}>Nessun post recente</div>
            )}
            {dati.social.lista.slice(0, 6).map(s => (
              <div key={s.id} className={styles.listItem}>
                <span className={styles.listItemLabel}>{s.titolo || '(senza titolo)'}</span>
                <StatoTag stato={s.stato} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Blog ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Blog
              <span className={`${styles.badge} ${styles.badgeGreen}`}>{dati.blog.pubblicati} pubblicati</span>
              {dati.blog.bozze > 0 && (
                <span className={`${styles.badge} ${styles.badgeMuted}`}>{dati.blog.bozze} bozze</span>
              )}
            </span>
          </div>
          <div className={styles.list}>
            {dati.blog.lista.slice(0, 5).map(b => (
              <div key={b.id} className={styles.listItem}>
                <span className={styles.listItemLabel}>{b.titolo}</span>
                {!b.pubblicato && <StatoTag stato="Bozza" />}
                {b.data && <span className={styles.listItemMeta}>{formatData(b.data)}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              FAQ attive
              <span className={`${styles.badge} ${styles.badgeGreen}`}>{dati.faq.totale}</span>
            </span>
          </div>
          <div className={styles.empty}>
            {dati.faq.totale} domande e risposte pubblicate sul sito
          </div>
        </div>

        {/* ── Pagine del sito ── */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Pagine del sito</span>
          </div>
          <div className={styles.list}>
            {PAGINE_SITO.map(p => {
              // Nascondi pagine stagionali fuori stagione
              if (p.stagionale === 'natale' && !isNatale) return null
              if (p.stagionale === 'standard' && isNatale) return null
              return (
                <a
                  key={p.path}
                  href={SITO + p.path}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.pageLink}
                >
                  <IconExternalLink size={14} />
                  <span>{p.label}</span>
                  <span className={styles.pageLinkUrl}>{p.path}</span>
                </a>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
