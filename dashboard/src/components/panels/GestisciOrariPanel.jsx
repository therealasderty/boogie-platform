import { useState } from 'react'
import OrariPanel from './OrariPanel'
import ChiusurePanel from './ChiusurePanel'
import ConfermaPrenotazioniPanel from './ConfermaPrenotazioniPanel'
import BloccoPrenotazioniPanel from './BloccoPrenotazioniPanel'
import { IconClock, IconLock, IconCheck, IconCalendarX } from '../../icons/index.jsx'
import styles from './GestisciOrariPanel.module.css'

const TABS = [
  { id: 'orari',    Icon: IconClock,      label: 'Orari Ordinari' },
  { id: 'chiusure', Icon: IconLock,       label: 'Chiusure & Aperture' },
  { id: 'conferma', Icon: IconCheck,      label: 'Conferma Prenotazioni' },
  { id: 'blocco',   Icon: IconCalendarX,  label: 'Blocco Prenotazioni' },
]

export default function GestisciOrariPanel() {
  const [tab, setTab] = useState('orari')

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.Icon size={15} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'orari'    && <OrariPanel />}
      {tab === 'chiusure' && <ChiusurePanel />}
      {tab === 'conferma' && <ConfermaPrenotazioniPanel />}
      {tab === 'blocco'   && <BloccoPrenotazioniPanel />}
    </div>
  )
}
