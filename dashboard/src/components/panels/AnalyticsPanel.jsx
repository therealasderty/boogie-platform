import { useState, useMemo } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useUmamiStats } from '../../hooks/useUmamiStats'
import { IconAnalytics } from '../../icons/index.jsx'
import styles from './AnalyticsPanel.module.css'

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const GIORNI_KEYS = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica']
const PIE_COLORS = ['var(--accent)', 'var(--text2)', 'var(--text3)']

function avg(arr) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0 }
function sum(arr) { return arr.reduce((a, b) => a + b, 0) }
function mode(arr) {
  const freq = {}
  arr.forEach(v => { if (v) freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
}

function formatWeekLabel(s) {
  if (!s) return ''
  if (!s.dataInizio) return s.settimana
  const fmt = d => { const [, m, g] = d.split('-'); return `${g}/${m}` }
  return `${fmt(s.dataInizio)} – ${fmt(s.dataFine)}`
}

function TrendBadge({ value }) {
  if (value == null || isNaN(value)) return null
  const up = value >= 0
  return (
    <span className={`${styles.trendBadge} ${up ? styles.trendUp : styles.trendDown}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  )
}

function KpiCard({ label, value, sub, trend }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiValueRow}>
        <div className={styles.kpiValue}>{value ?? '—'}</div>
        {trend != null && <TrendBadge value={trend} />}
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

function BarChart({ items, maxVal }) {
  const max = maxVal ?? Math.max(...items.filter(i => !i.closed).map(i => i.value), 1)
  return (
    <div className={styles.barChart}>
      {items.map(({ label, value, accent, closed }) => (
        <div key={label} className={`${styles.barRow} ${closed ? styles.barRowClosed : ''}`}>
          <div className={styles.barLabel}>{label}</div>
          <div className={styles.barTrack}>
            {!closed && (
              <div
                className={`${styles.barFill} ${accent ? styles.barAccent : ''}`}
                style={{ width: `${Math.round((value / max) * 100)}%` }}
              />
            )}
          </div>
          <div className={styles.barValue}>{closed ? 'chiuso' : value}</div>
        </div>
      ))}
    </div>
  )
}

// Istogramma verticale — usato per le fasce Pranzo/Cena
function BarChartV({ items }) {
  const max = Math.max(...items.map(i => i.value), 1)
  const total = items.reduce((s, i) => s + i.value, 0)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '0 16px' }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, maxWidth: 120 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.accent ? 'var(--accent)' : 'var(--text)' }}>{item.value}</div>
          {item.sub && <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: -4 }}>{item.sub}</div>}
          <div style={{ width: '100%', height: 90, display: 'flex', alignItems: 'flex-end', background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: '100%',
              background: item.accent ? 'var(--accent)' : 'var(--text2)',
              height: `${Math.round((item.value / max) * 100)}%`,
              transition: 'height 0.4s ease',
              minHeight: item.value > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)' }}>{item.label}</div>
          {total > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{Math.round(item.value / total * 100)}%</div>}
        </div>
      ))}
    </div>
  )
}

// Barre doppie orizzontali — prenotazioni (grigio) + coperti (oro) per giorno
function BarChartDual({ items }) {
  const max = Math.max(...items.filter(i => !i.closed).flatMap(i => [i.pren, i.coperti]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 2 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text2)', display: 'inline-block' }} /> Prenotazioni
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} /> Coperti
        </span>
      </div>
      {items.map(({ label, pren, coperti, closed }) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 48px', gap: '2px 8px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: closed ? 'var(--text3)' : 'var(--text2)' }}>{label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!closed ? (
              <>
                <div style={{ background: 'var(--bg3)', borderRadius: 2, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--text2)', borderRadius: 2, width: `${Math.round((pren / max) * 100)}%`, minWidth: pren > 0 ? 2 : 0, transition: 'width 0.4s' }} />
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 2, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${Math.round((coperti / max) * 100)}%`, minWidth: coperti > 0 ? 2 : 0, transition: 'width 0.4s' }} />
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>chiuso</div>
            )}
          </div>
          {!closed ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text)', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {pren}<span style={{ color: 'var(--text3)', fontWeight: 400 }}>/</span>{coperti}
            </div>
          ) : (
            <div />
          )}
        </div>
      ))}
    </div>
  )
}

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
}

function PieChart({ items }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total === 0) return <div className={styles.emptyChart}>Nessun dato</div>
  const cx = 70, cy = 70, r = 60
  let cursor = 0
  const slices = items.map((item, i) => {
    const angle = (item.value / total) * 360
    const path = slicePath(cx, cy, r, cursor, cursor + angle - 0.5)
    cursor += angle
    return { ...item, path, color: PIE_COLORS[i] }
  })
  return (
    <div className={styles.pieWrap}>
      <svg viewBox="0 0 140 140" className={styles.pieSvg}>
        {slices.map(slice => (
          <path key={slice.label} d={slice.path} fill={slice.color} opacity="0.9" />
        ))}
        <circle cx={cx} cy={cy} r={32} fill="var(--bg2)" />
      </svg>
      <div className={styles.pieLegend}>
        {slices.map(slice => (
          <div key={slice.label} className={styles.pieLegendItem}>
            <span className={styles.pieDot} style={{ background: slice.color }} />
            <span className={styles.pieLegendLabel}>{slice.label}</span>
            <span className={styles.pieLegendPct}>{Math.round(slice.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ settimane }) {
  const data = [...settimane].reverse()
  const W = 500, H = 120, padL = 36, padR = 12, padT = 16, padB = 28
  const vals = data.map(s => s.prenotazioni)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const range = maxV - minV || 1
  const xStep = (W - padL - padR) / Math.max(data.length - 1, 1)
  function xPos(i) { return padL + i * xStep }
  function yPos(v) { return padT + (1 - (v - minV) / range) * (H - padT - padB) }
  const points = data.map((s, i) => `${xPos(i).toFixed(1)},${yPos(s.prenotazioni).toFixed(1)}`).join(' ')
  const areaPoints = [
    `${xPos(0).toFixed(1)},${(H - padB).toFixed(1)}`,
    ...data.map((s, i) => `${xPos(i).toFixed(1)},${yPos(s.prenotazioni).toFixed(1)}`),
    `${xPos(data.length - 1).toFixed(1)},${(H - padB).toFixed(1)}`,
  ].join(' ')
  const gridVals = [minV, Math.round((minV + maxV) / 2), maxV]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.lineSvg} preserveAspectRatio="xMidYMid meet">
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} y1={yPos(v).toFixed(1)} x2={W - padR} y2={yPos(v).toFixed(1)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 4} y={yPos(v) + 4} textAnchor="end" fontSize="9" fill="var(--text3)">{v}</text>
        </g>
      ))}
      <polygon points={areaPoints} fill="var(--accent)" opacity="0.08" />
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((s, i) => (
        <g key={s.settimana}>
          <circle cx={xPos(i)} cy={yPos(s.prenotazioni)} r="3.5" fill="var(--accent)" />
          <text x={xPos(i)} y={H - padB + 12} textAnchor="middle" fontSize="8.5" fill="var(--text3)">
            {formatWeekLabel(s).split('–')[0].trim()}
          </text>
        </g>
      ))}
    </svg>
  )
}

function AnalisiAI({ testo, titolo }) {
  if (!testo) return null

  const parseSection = (text, emoji) => {
    const match = text.match(new RegExp(`${emoji}[^\\n]*\\n([\\s\\S]*?)(?=📍|✅|⚠️|💡|$)`))
    return (match?.[1] || '').trim().split('\n').filter(Boolean)
  }

  const contesto = parseSection(testo, '📍')
  const pro  = parseSection(testo, '✅')
  const crit = parseSection(testo, '⚠️')
  const opp  = parseSection(testo, '💡')

  return (
    <div className={styles.analisiAi}>
      <div className={styles.analisiAiHeader}>
        <span className={styles.analisiAiIcon}>✦</span>
        <span className={styles.analisiAiTitolo}>{titolo || 'Analisi AI'}</span>
      </div>
      {contesto.length > 0 && (
        <div className={styles.analisiContesto}>
          {contesto.map((r, i) => <p key={i}>{r.replace(/^•\s*/, '')}</p>)}
        </div>
      )}
      <div className={styles.analisiAiBoxes}>
        <div className={`${styles.analisiBox} ${styles.analisiBoxPro}`}>
          <div className={styles.analisiBoxTitle}>✅ PRO</div>
          <ul className={styles.analisiBoxList}>
            {pro.map((r, i) => <li key={i}>{r.replace(/^•\s*/, '')}</li>)}
          </ul>
        </div>
        <div className={`${styles.analisiBox} ${styles.analisiBoxCrit}`}>
          <div className={styles.analisiBoxTitle}>⚠️ CRITICITÀ</div>
          <ul className={styles.analisiBoxList}>
            {crit.map((r, i) => <li key={i}>{r.replace(/^•\s*/, '')}</li>)}
          </ul>
        </div>
        <div className={`${styles.analisiBox} ${styles.analisiBoxOpp}`}>
          <div className={styles.analisiBoxTitle}>💡 OPPORTUNITÀ & AZIONI</div>
          <div className={styles.analisiBoxActions}>
            {opp.map((r, i) => {
              const colonIdx = r.indexOf(':')
              const label = colonIdx > -1 ? r.slice(0, colonIdx) : r
              const value = colonIdx > -1 ? r.slice(colonIdx + 1).trim() : ''
              return (
                <div key={i} className={styles.analisiBoxAction}>
                  <span className={styles.analisiBoxActionLabel}>{label}</span>
                  {value && <span>{value}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightChip({ label, value }) {
  return (
    <div className={styles.insightChip}>
      <div className={styles.insightLabel}>{label}</div>
      <div className={styles.insightValue}>{value || '—'}</div>
    </div>
  )
}

function vsMedia(value, media) {
  if (!media || media === 0) return null
  return Math.round((value - media) / media * 1000) / 10
}

// — Vista settimana singola
// Mappa da nome abbreviato (Mon-first) al nome completo
const GIORNI_TO_NOME = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']

function UmamiKpi({ data, loading, prenotazioniSito }) {
  if (loading) return <div className={styles.kpiCard} style={{ opacity: 0.4, fontSize: '0.75rem', color: 'var(--text3)' }}>Caricamento dati web…</div>
  if (!data) return null
  const pxPerVisit = data.visite > 0 ? (data.pageviews / data.visite).toFixed(1) : '—'
  const convRate = data.visitePrenota > 0 && prenotazioniSito > 0
    ? Math.min(100, Math.round(prenotazioniSito / data.visitePrenota * 100)) + '%'
    : '—'
  return (
    <>
      <KpiCard label="Visite sito" value={data.visite} sub="sessioni nel periodo" />
      <KpiCard label="Visitatori unici" value={data.visitatori} sub={data.bounceRate ? `bounce ${data.bounceRate}%` : undefined} />
      <KpiCard label="Pagine per visita" value={pxPerVisit} sub={`${data.pageviews} pageviews tot.`} />
      <KpiCard label="Conv. /prenota" value={convRate} sub={data.visitePrenota ? `${data.visitePrenota} visite` : undefined} />
    </>
  )
}

function VistaSettimana({ s, medie, umami, umamiLoading }) {
  const chiusiSet = new Set(s.giorniChiusi ? s.giorniChiusi.split(', ') : [])
  const nGiorniAperti = s.mediaCopertiGiorno > 0 ? Math.round(s.persone / s.mediaCopertiGiorno) : 1
  const fasceBarre = [
    { label: 'Pranzo', value: s.copertipranzo, sub: nGiorniAperti > 0 ? `~${Math.round(s.copertipranzo / nGiorniAperti * 10) / 10}/turno` : undefined },
    { label: 'Cena',   value: s.copertiCena,   sub: nGiorniAperti > 0 ? `~${Math.round(s.copertiCena   / nGiorniAperti * 10) / 10}/turno` : undefined, accent: true },
  ]
  const COPERTI_KEYS = ['copertilunedi','copertimartedi','copertimercoledi','copertigiovedi','copertivenerdi','copertisabato','copertidomenica']
  const giorniBarre = GIORNI.map((label, i) => ({
    label,
    pren:    s[GIORNI_KEYS[i]],
    coperti: s[COPERTI_KEYS[i]] || 0,
    closed:  chiusiSet.has(GIORNI_TO_NOME[i]),
  }))
  const canaliPie = [
    { label: 'Sito web',  value: s.prenotazioniSito },
    { label: 'Telefono',  value: s.prenotazioniTel },
  ]
  const fmt = d => { const [, m, g] = d.split('-'); return `${g}/${m}` }
  const periodoLabel = s.dataInizio
    ? `Settimana dal ${fmt(s.dataInizio)} al ${fmt(s.dataFine)}`
    : s.settimana

  return (
    <>
      <div className={styles.periodoLabel}>{periodoLabel}</div>
      <AnalisiAI testo={s.analisiAi} titolo="Analisi della settimana" />
      <div className={styles.kpiGrid}>
        <KpiCard label="Prenotazioni"      value={s.prenotazioni} trend={vsMedia(s.prenotazioni, medie?.prenotazioni)} />
        <KpiCard label="Coperti totali"    value={s.persone} trend={vsMedia(s.persone, medie?.persone)} />
        <KpiCard label="Cancellazioni"     value={`${s.tassoCancellazione}%`} sub={`${s.cancellazioni} tot.`} />
        <KpiCard label="Anticipo medio prenotazione" value={`${s.leadTime}g`} sub="giorni prima dell'arrivo" />
        <KpiCard label="Dim. media gruppo" value={s.dimGruppo} sub="persone" />
        <KpiCard label="Clienti unici"     value={s.clientiUnici} sub={s.clientiDiRitorno > 0 ? `${s.clientiDiRitorno} di ritorno` : undefined} />
        <UmamiKpi data={umami} loading={umamiLoading} prenotazioniSito={s.prenotazioniSito} />
      </div>
      <div className={`${styles.card} ${styles.cardFullWidth}`}>
        <div className={styles.cardTitle}>Insights settimana</div>
        <div className={styles.insightsGrid}>
          <InsightChip label="Giorno più pieno"      value={s.giornopiuPieno} />
          <InsightChip label="Giorno più vuoto"      value={s.giornopiuVuoto} />
          <InsightChip label="Slot più richiesto"    value={s.slotPiu} />
          <InsightChip label="Slot meno richiesto"   value={s.slotMeno} />
          <InsightChip label="Fascia meno richiesta" value={s.fasciaMenoRichiesta} />
          <InsightChip label="Last minute"           value={`${s.lastMinute} pren.`} />
        </div>
      </div>
      <div className={styles.chartsGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Coperti per fascia</div>
          <BarChartV items={fasceBarre} />
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Prenotazioni e coperti Lun–Dom</div>
          <BarChartDual items={giorniBarre} />
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Canale di prenotazione</div>
          <PieChart items={canaliPie} />
        </div>
      </div>
    </>
  )
}

// — Vista globale con medie
function VistaGlobale({ settimane, umami, umamiLoading }) {
  const n = settimane.length

  const stats = useMemo(() => {
    const mediaPrenotazioni = avg(settimane.map(s => s.prenotazioni))
    const mediaCoperti      = avg(settimane.map(s => s.persone))
    const mediaCancellaz    = avg(settimane.map(s => s.tassoCancellazione))
    const mediaLeadTime     = avg(settimane.map(s => s.leadTime))
    const mediaDimGruppo    = avg(settimane.map(s => s.dimGruppo))
    const mediaClienti        = avg(settimane.map(s => s.clientiUnici))
    const mediaClientiRitorno = avg(settimane.map(s => s.clientiDiRitorno))

    const totPrenSito = sum(settimane.map(s => s.prenotazioniSito))
    const totPrenTel  = sum(settimane.map(s => s.prenotazioniTel))
    const totEventi   = sum(settimane.map(s => s.prenotazioniEventi))

    const totPranzo  = sum(settimane.map(s => s.copertipranzo))
    const totCena    = sum(settimane.map(s => s.copertiCena))
    const totCoperti = totPranzo + totCena

    const mediaGiorni = GIORNI.map((label, i) => {
      const nomeCompleto = GIORNI_TO_NOME[i]
      const settimaneAperte = settimane.filter(s => !s.giorniChiusi?.split(', ').includes(nomeCompleto))
      return { label, value: avg(settimaneAperte.map(s => s[GIORNI_KEYS[i]])) }
    })

    const normalizzaGiorno = v => v ? v.replace(/\s*\(.*\)/, '').trim() : v
    const giornoFrequente     = mode(settimane.map(s => normalizzaGiorno(s.giornopiuPieno)))
    const giornoVuoto         = mode(settimane.map(s => normalizzaGiorno(s.giornopiuVuoto)))
    const slotFrequente       = mode(settimane.map(s => s.slotPiu))
    const fasciaPocoRichiesta = mode(settimane.map(s => s.fasciaMenoRichiesta))
    const mediaLastMinute     = avg(settimane.map(s => s.lastMinute))

    const COPERTI_KEYS_G = ['copertilunedi','copertimartedi','copertimercoledi','copertigiovedi','copertivenerdi','copertisabato','copertidomenica']
    const mediaGiorniDual = GIORNI.map((label, i) => {
      const nomeCompleto = GIORNI_TO_NOME[i]
      const settimaneAperte = settimane.filter(s => !s.giorniChiusi?.split(', ').includes(nomeCompleto))
      return {
        label,
        pren:    avg(settimaneAperte.map(s => s[GIORNI_KEYS[i]])),
        coperti: avg(settimaneAperte.map(s => s[COPERTI_KEYS_G[i]] || 0)),
        closed:  settimaneAperte.length === 0,
      }
    })

    const canaliPie = [
      { label: 'Sito web', value: totPrenSito },
      { label: 'Telefono', value: totPrenTel },
    ]
    const fasceBarre = [
      { label: 'Pranzo', value: totPranzo },
      { label: 'Cena',   value: totCena, accent: true },
    ]

    return {
      mediaPrenotazioni, mediaCoperti, mediaCancellaz, mediaLeadTime, mediaDimGruppo,
      mediaClienti, mediaClientiRitorno, totPrenSito, totPrenTel, totEventi,
      totPranzo, totCena, totCoperti, mediaGiorni, mediaGiorniDual,
      giornoFrequente, giornoVuoto, slotFrequente, fasciaPocoRichiesta,
      mediaLastMinute, canaliPie, fasceBarre,
    }
  }, [settimane])

  const {
    mediaPrenotazioni, mediaCoperti, mediaCancellaz, mediaLeadTime, mediaDimGruppo,
    mediaClienti, mediaClientiRitorno, totPrenSito, totPrenTel, totEventi,
    totPranzo, totCena, totCoperti, mediaGiorni, mediaGiorniDual,
    giornoFrequente, giornoVuoto, slotFrequente, fasciaPocoRichiesta,
    mediaLastMinute, canaliPie, fasceBarre,
  } = stats

  return (
    <>
      <div className={styles.globaleNote}>
        Media su <strong>{n} settimane</strong> di dati raccolti
      </div>
      <AnalisiAI testo={settimane[0]?.analisiAiGlobale} titolo="Analisi globale" />
      <div className={styles.kpiGrid}>
        <KpiCard label="Media pren./settimana"   value={mediaPrenotazioni} />
        <KpiCard label="Media coperti/settimana" value={mediaCoperti} />
        <KpiCard label="Tasso cancellazione"     value={`${mediaCancellaz}%`} sub="media" />
        <KpiCard label="Anticipo medio prenotazione" value={`${mediaLeadTime}g`} sub="giorni prima dell'arrivo" />
        <KpiCard label="Dim. media gruppo"       value={mediaDimGruppo} sub="persone" />
        <KpiCard label="Clienti unici/sett."     value={mediaClienti} sub={mediaClientiRitorno > 0 ? `media ${mediaClientiRitorno} di ritorno` : undefined} />
        {!umamiLoading && umami && (
          <>
            <KpiCard label="Visite sito" value={umami.visite} sub="nel periodo" />
            <KpiCard label="Pagine per visita" value={umami.visite > 0 ? (umami.pageviews / umami.visite).toFixed(1) : '—'} sub={`${umami.pageviews} pageviews tot.`} />
            <KpiCard label="Conv. /prenota" value={umami.visitePrenota > 0 && totPrenSito > 0 ? Math.min(100, Math.round(totPrenSito / umami.visitePrenota * 100)) + '%' : '—'} sub={umami.visitePrenota ? `${umami.visitePrenota} visite prenota` : undefined} />
          </>
        )}
      </div>
      <div className={`${styles.card} ${styles.cardFullWidth}`}>
        <div className={styles.cardTitle}>Pattern ricorrenti</div>
        <div className={styles.insightsGrid}>
          <InsightChip label="Giorno più pieno (freq.)"   value={giornoFrequente} />
          <InsightChip label="Giorno più vuoto (freq.)"   value={giornoVuoto} />
          <InsightChip label="Slot più richiesto (freq.)" value={slotFrequente} />
          <InsightChip label="Fascia meno richiesta"      value={fasciaPocoRichiesta} />
          <InsightChip label="Media last minute/sett."    value={`${mediaLastMinute} pren.`} />
        </div>
      </div>
      <div className={styles.chartsGrid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Coperti per fascia — totale</div>
          <BarChartV items={fasceBarre} />
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Media prenotazioni e coperti Lun–Dom</div>
          <BarChartDual items={mediaGiorniDual} />
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Canale di prenotazione — totale</div>
          <PieChart items={canaliPie} />
        </div>
      </div>
      {settimane.length > 1 && (
        <div className={`${styles.card} ${styles.cardFullWidth}`}>
          <div className={styles.cardTitle}>Trend prenotazioni — ultime {settimane.length} settimane</div>
          <LineChart settimane={settimane} />
        </div>
      )}

      {/* ── Dati digitali Umami ── */}
      {(umamiLoading || umami) && (
        <div className={styles.chartsGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Top pagine</div>
            {umamiLoading && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Caricamento…</div>}
            {umami?.pages?.length > 0 && (
              <BarChart items={umami.pages.map(p => ({
                label: p.url.replace(/^https?:\/\/[^/]+/, '') || '/',
                value: p.visite,
              }))} />
            )}
            {!umamiLoading && !umami?.pages?.length && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Nessun dato</div>}
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Sorgenti di traffico</div>
            {umamiLoading && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Caricamento…</div>}
            {umami?.sources?.length > 0 && (
              <BarChart items={umami.sources.map(s => ({
                label: s.sorgente,
                value: s.visite,
              }))} />
            )}
            {!umamiLoading && !umami?.sources?.length && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Nessun dato</div>}
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Dispositivi</div>
            {umamiLoading && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Caricamento…</div>}
            {umami?.devices?.length > 0 && (
              <PieChart items={umami.devices.map(d => ({ label: d.device, value: d.visite }))} />
            )}
            {!umamiLoading && !umami?.devices?.length && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', padding: '1rem 0' }}>Nessun dato</div>}
          </div>
        </div>
      )}
    </>
  )
}

export default function AnalyticsPanel() {
  const { settimane, loading } = useAnalytics()
  const [vista, setVista] = useState('settimana')
  const [idx, setIdx] = useState(0)

  const s = settimane[Math.min(idx, settimane.length - 1)] || null
  const medie = settimane.length > 1 ? {
    prenotazioni: avg(settimane.map(s => s.prenotazioni)),
    persone:      avg(settimane.map(s => s.persone)),
  } : null

  // Umami — settimana corrente
  const { data: umamiWeek, loading: umamiWeekLoading } = useUmamiStats(
    s?.dataInizio || null,
    s?.dataFine   || null
  )

  // Umami — intero periodo (vista globale)
  const startGlobal = settimane.length > 0 ? settimane[settimane.length - 1].dataInizio : null
  const endGlobal   = settimane.length > 0 ? settimane[0].dataFine                      : null
  const { data: umamiGlobal, loading: umamiGlobalLoading } = useUmamiStats(startGlobal, endGlobal)

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          <IconAnalytics size={20} />
          Analytics
        </h1>
        <div className={styles.headerRight}>
          {vista === 'settimana' && settimane.length > 0 && (
            <select
              className={styles.weekSelect}
              value={idx}
              onChange={e => setIdx(Number(e.target.value))}
            >
              {settimane.map((s, i) => (
                <option key={s.settimana} value={i}>
                  {i === 0 ? `Ultima (${formatWeekLabel(s)})` : formatWeekLabel(s)}
                </option>
              ))}
            </select>
          )}
          {settimane.length > 0 && (
            <div className={styles.vistaToggle}>
              <button
                className={`${styles.vistaBtn} ${vista === 'settimana' ? styles.vistaBtnActive : ''}`}
                onClick={() => setVista('settimana')}
              >
                Settimana
              </button>
              <button
                className={`${styles.vistaBtn} ${vista === 'globale' ? styles.vistaBtnActive : ''}`}
                onClick={() => setVista('globale')}
              >
                Globale
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <div className={styles.loading}>Caricamento statistiche...</div>}

      {!loading && settimane.length === 0 && (
        <div className={styles.empty}>Nessuna statistica disponibile. Le statistiche vengono calcolate ogni domenica sera.</div>
      )}

      {!loading && settimane.length > 0 && (
        <div className={styles.body}>
          {vista === 'settimana' && s && <VistaSettimana s={s} medie={medie} umami={umamiWeek} umamiLoading={umamiWeekLoading} />}
          {vista === 'globale' && <VistaGlobale settimane={settimane} umami={umamiGlobal} umamiLoading={umamiGlobalLoading} />}
        </div>
      )}
    </div>
  )
}
