import { TEMPLATES } from './social/SlideTemplates.jsx'
import styles from './DesignPanel.module.css'

const SCALE = 0.21
const SIZE_MAP = {
  '4:5':  [1080, 1350],
  '9:16': [1080, 1920],
  '1:1':  [1080, 1080],
}

function TemplatePreview({ id, label, Component, size, demoProps = {} }) {
  const [w, h] = SIZE_MAP[size] ?? [1080, 1350]
  const scaledW = Math.round(w * SCALE)
  const scaledH = Math.round(h * SCALE)

  return (
    <div className={styles.card}>
      <div className={styles.preview} style={{ width: scaledW, height: scaledH }}>
        <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: w, height: h }}>
          <Component {...demoProps} />
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>{label}</span>
        <span className={styles.size}>{size}</span>
      </div>
    </div>
  )
}

export default function DesignPanel() {
  const entries = Object.entries(TEMPLATES)
  const post    = entries.filter(([, t]) => t.size !== '9:16')
  const storie  = entries.filter(([, t]) => t.size === '9:16')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Grafiche Social</h1>
        <p className={styles.sub}>Tutti i template renderizzati con i dati demo. Modifica <code>SlideTemplates.jsx</code> per aggiornare.</p>
      </div>

      <h2 className={styles.section}>Post</h2>
      <div className={styles.grid}>
        {post.map(([id, { label, Component, size, demoProps }]) => (
          <TemplatePreview key={id} id={id} label={label} Component={Component} size={size} demoProps={demoProps} />
        ))}
      </div>

      <h2 className={styles.section}>Storie</h2>
      <div className={styles.grid}>
        {storie.map(([id, { label, Component, size, demoProps }]) => (
          <TemplatePreview key={id} id={id} label={label} Component={Component} size={size} demoProps={demoProps} />
        ))}
      </div>
    </div>
  )
}
