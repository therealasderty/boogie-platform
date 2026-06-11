import { useRecensioni } from '../../hooks/useRecensioni'
import { IconStar, IconGoogle, IconTripAdvisor } from '../../icons/index.jsx'
import styles from './RecensioniWidget.module.css'

function Diff({ val }) {
  if (val === null || val === undefined) return <span className={styles.nd}>N/D</span>
  const pos = val >= 0
  return (
    <span className={pos ? styles.pos : styles.neg}>
      {pos ? '+' : ''}{val}
    </span>
  )
}

function Piattaforma({ nome, IconComponent, voto, recensioni, diffSettimana, diffMese }) {
  return (
    <div className={styles.piattaforma}>
      <div className={styles.pHeader}>
        <span className={styles.pEmoji}><IconComponent size={16} /></span>
        <span className={styles.pNome}>{nome}</span>
        {voto && <span className={styles.pVoto}>★ {voto}</span>}
      </div>
      {recensioni && <div className={styles.pCount}>{recensioni} recensioni</div>}
      <div className={styles.pStats}>
        <div className={styles.pStat}>
          <span className={styles.pStatLabel}>vs settimana scorsa</span>
          <Diff val={diffSettimana} />
        </div>
        <div className={styles.pStat}>
          <span className={styles.pStatLabel}>vs mese scorso</span>
          <Diff val={diffMese} />
        </div>
      </div>
    </div>
  )
}

const MESI_SHORT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic']
function fmtData(d) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getDate()} ${MESI_SHORT[dt.getMonth()]}`
}

function MiniGrafico({ punti, colore }) {
  if (!punti || punti.length < 2) return null

  const W = 500, H = 90, padL = 36, padR = 12, padT = 10, padB = 22
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const vals  = punti.map(p => p.val)
  const minV  = Math.min(...vals)
  const maxV  = Math.max(...vals)
  const range = maxV - minV || 1

  const xPos = i => padL + (i / (punti.length - 1)) * innerW
  const yPos = v => padT + (1 - (v - minV) / range) * innerH

  const linePoints = punti.map((p, i) => `${xPos(i).toFixed(1)},${yPos(p.val).toFixed(1)}`).join(' ')
  const areaPoints = [
    `${xPos(0).toFixed(1)},${(H - padB).toFixed(1)}`,
    ...punti.map((p, i) => `${xPos(i).toFixed(1)},${yPos(p.val).toFixed(1)}`),
    `${xPos(punti.length - 1).toFixed(1)},${(H - padB).toFixed(1)}`,
  ].join(' ')

  const gridVals = [minV, maxV]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} preserveAspectRatio="xMidYMid meet">
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} y1={yPos(v).toFixed(1)} x2={W - padR} y2={yPos(v).toFixed(1)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 4} y={yPos(v) + 4} textAnchor="end" fontSize="9" fill="var(--text3)">{v}</text>
        </g>
      ))}
      <polygon points={areaPoints} fill={colore} opacity="0.08" />
      <polyline points={linePoints} fill="none" stroke={colore} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {punti.map((p, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(p.val)} r="3" fill={colore} />
      ))}
      <text x={xPos(0)} y={H - padB + 13} textAnchor="start" fontSize="8.5" fill="var(--text3)">{fmtData(punti[0].data)}</text>
      <text x={xPos(punti.length - 1)} y={H - padB + 13} textAnchor="end" fontSize="8.5" fill="var(--text3)">{fmtData(punti[punti.length - 1].data)}</text>
    </svg>
  )
}

function GraficiRecensioni({ storico }) {
  if (!storico || storico.length < 2) return null

  const pGoogle = storico.filter(s => s.google !== null).map(s => ({ val: s.google, data: s.data }))
  const pTA     = storico.filter(s => s.tripadvisor !== null).map(s => ({ val: s.tripadvisor, data: s.data }))

  if (pGoogle.length < 2 && pTA.length < 2) return null

  return (
    <div className={styles.graficiWrap}>
      {pGoogle.length >= 2 && (
        <div className={styles.graficoBox}>
          <div className={styles.graficoLabel} style={{ color: '#4285F4' }}>
            <span className={styles.legendDot} style={{ background: '#4285F4' }} />
            Google
          </div>
          <MiniGrafico punti={pGoogle} colore="#4285F4" />
        </div>
      )}
      {pTA.length >= 2 && (
        <div className={styles.graficoBox}>
          <div className={styles.graficoLabel} style={{ color: '#00AF87' }}>
            <span className={styles.legendDot} style={{ background: '#00AF87' }} />
            TripAdvisor
          </div>
          <MiniGrafico punti={pTA} colore="#00AF87" />
        </div>
      )}
    </div>
  )
}

export default function RecensioniWidget() {
  const { dati, loading } = useRecensioni()

  if (loading) return null
  if (!dati) return null

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.title}>
          <IconStar size={16} />
          Recensioni
        </span>
      </div>
      <div className={styles.grid}>
        <Piattaforma
          nome="Google"
          IconComponent={IconGoogle}
          voto={dati.google?.votoAttuale}
          recensioni={dati.google?.recensioni}
          diffSettimana={dati.google?.diffSettimana}
          diffMese={dati.google?.diffMese}
        />
        <Piattaforma
          nome="TripAdvisor"
          IconComponent={IconTripAdvisor}
          voto={dati.tripadvisor?.votoAttuale}
          recensioni={dati.tripadvisor?.recensioni}
          diffSettimana={dati.tripadvisor?.diffSettimana}
          diffMese={dati.tripadvisor?.diffMese}
        />
      </div>
      <GraficiRecensioni storico={dati.storico} />
    </div>
  )
}
