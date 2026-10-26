import { useState, useRef, useMemo, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendario } from '../../hooks/useCalendario'
import { useAppuntamenti } from '../../hooks/useAppuntamenti'
import { useOrari } from '../../hooks/useOrari'
import { useChiusure } from '../../hooks/useChiusure'
import { IconNote, IconClose, IconCalendar, IconRefresh, IconEdit } from '../../icons/index.jsx'
import ModalPrenotazione from '../ModalPrenotazione.jsx'
import styles from './CalendarioPanel.module.css'

const STATO_INFO = {
  'Confermata': { color: '#2E7D32', bg: 'rgba(46,125,50,0.1)' },
  'In attesa':  { color: '#B8820A', bg: 'rgba(184,130,10,0.1)' },
  'Nuova':      { color: '#B8820A', bg: 'rgba(184,130,10,0.1)' },
  'Cancellata': { color: '#C0392B', bg: 'rgba(192,57,43,0.1)' },
}

const STATO_COLORI = {
  'Confermata': '#2E7D32',
  'In attesa':  '#B8820A',
  'Nuova':      '#B8820A',
  'Cancellata': '#C0392B',
}

const isMobile = () => window.innerWidth <= 768

function EventoContenuto({ info }) {
  const { ora, persone, stato, note, isAgenda, oraLabel, ricorrente } = info.event.extendedProps
  if (isAgenda) {
    const dotColor = ricorrente ? '#9B91F0' : '#c9a84c'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '1px 4px', width: '100%', overflow: 'hidden', cursor: 'default', opacity: 0.55 }}>
        <span style={{ flexShrink: 0, width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {info.event.title}
        </span>
      </div>
    )
  }
  const bg = STATO_COLORI[stato] || '#7A6448'
  return (
    <div style={{ background: bg, borderRadius: '4px', padding: '2px 6px', width: '100%', cursor: 'pointer', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {info.event.title}
        </span>
        {note && <IconNote size={11} color="rgba(255,255,255,0.85)" />}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>
        {ora} · {persone} pers.
      </div>
    </div>
  )
}

function ModalDettaglio({ evento, onClose, onEdit }) {
  if (!evento) return null
  const { ora, persone, stato, note, telefono, preferenza, evento: nomeEvento } = evento.extendedProps
  const statoInfo = STATO_INFO[stato] || { color: '#7A6448', bg: 'rgba(122,100,72,0.1)' }
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitolo}>{evento.title}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-icon" onClick={onEdit} title="Modifica">
              <IconEdit size={15} />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <IconClose size={16} weight="regular" />
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalChip} style={{ background: statoInfo.bg, color: statoInfo.color }}>{stato}</div>
          {nomeEvento && <div className={styles.modalRiga}><span className={styles.modalLabel}>Evento</span><span className={styles.modalVal} style={{ color: 'var(--accent)' }}>{nomeEvento}</span></div>}
          <div className={styles.modalRiga}><span className={styles.modalLabel}>Orario</span><span className={styles.modalVal}>{ora}</span></div>
          <div className={styles.modalRiga}><span className={styles.modalLabel}>Persone</span><span className={styles.modalVal}>{persone}</span></div>
          {preferenza && <div className={styles.modalRiga}><span className={styles.modalLabel}>Preferenza</span><span className={styles.modalVal}>{preferenza.toLowerCase() === 'pizza' ? '🍕 Pizza' : '🍽️ Cucina'}</span></div>}
          {telefono && <div className={styles.modalRiga}><span className={styles.modalLabel}>Telefono</span><a href={`tel:${telefono}`} className={styles.modalTel}>{telefono}</a></div>}
          {note && (
            <div className={styles.modalNote}>
              <span className={styles.modalLabel}>Note</span>
              <p className={styles.modalNoteText}>{note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BASE_SINGOLO = {
  backgroundColor: 'transparent',
  borderColor:     'transparent',
  textColor:       'var(--text2)',
}
const BASE_RICORRENTE = {
  backgroundColor: 'transparent',
  borderColor:     'transparent',
  textColor:       'var(--text2)',
}

function buildAgendaEvents(appuntamenti, orari = []) {
  const aperti = orari.length > 0 ? new Set(orari.filter(o => o.attivo).map(o => o.giorno)) : null
  return appuntamenti.flatMap(a => {
    const oraLabel = a.ora && a.oraFine ? `${a.ora}–${a.oraFine}` : (a.ora || '')
    const ricorrente = a.ricorrenza && a.ricorrenza !== 'nessuna'
    const colori = ricorrente ? BASE_RICORRENTE : BASE_SINGOLO
    const base = {
      title: a.title,
      ...colori,
      editable:      false,
      extendedProps: { isAgenda: true, ricorrente, oraLabel },
    }
    if (!ricorrente) {
      return a.data ? [{ ...base, id: `ag-${a.id}`, date: a.data }] : []
    }
    const endRecur = a.dataFineRicorrenza || undefined
    if (a.ricorrenza === 'giornaliera') {
      const esclusi = a.giorniEsclusione ? a.giorniEsclusione.split(',').map(Number) : []
      const daysOfWeek = [0,1,2,3,4,5,6].filter(d => !esclusi.includes(d) && (!aperti || aperti.has(d)))
      return [{ ...base, id: `ag-${a.id}`, daysOfWeek, startRecur: a.data || undefined, endRecur }]
    }
    if (a.ricorrenza === 'settimanale') {
      const daysOfWeek = (a.giorniSettimana ? a.giorniSettimana.split(',').map(Number) : [])
        .filter(d => !aperti || aperti.has(d))
      return [{ ...base, id: `ag-${a.id}`, daysOfWeek, startRecur: a.data || undefined, endRecur }]
    }
    return []
  })
}

export default function CalendarioPanel() {
  const { eventi, loading, ricarica } = useCalendario()
  const { appuntamenti } = useAppuntamenti()
  const { orari } = useOrari()
  const { chiusure } = useChiusure()
  const agendaEvents = useMemo(() => buildAgendaEvents(appuntamenti, orari), [appuntamenti, orari])

  const getStatoGiorno = useCallback((dateStr) => {
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()
    const matchData = (c) =>
      (c.tipo === 'Data specifica' && c.dataInizio <= dateStr && dateStr <= c.dataFine) ||
      (c.tipo === 'Ricorrente' && c.giorno === dayOfWeek)
    if (chiusure.some(c => c.tipoApertura === 'Apertura' && matchData(c))) return { tipo: null }
    const attive = chiusure.filter(c => c.tipoApertura !== 'Apertura' && matchData(c))
    if (attive.length > 0) {
      const fullDay = attive.some(c => !c.fasce || c.fasce.length === 0)
      if (fullDay) return { tipo: 'straordinaria', tuttoIlGiorno: true }
      const fasce = [...new Set(attive.flatMap(c => c.fasce))]
      return { tipo: 'straordinaria', tuttoIlGiorno: false, fasce }
    }
    if (orari.length > 0 && !orari.some(o => o.giorno === dayOfWeek && o.attivo)) return { tipo: 'ordinaria' }
    return { tipo: null }
  }, [chiusure, orari])
  const calRef = useRef(null)
  const [vistaAttiva, setVistaAttiva] = useState(isMobile() ? 'listWeek' : 'dayGridMonth')
  const [eventoSelezionato, setEventoSelezionato] = useState(null)
  const [prenotazioneEdit, setPrenotazioneEdit] = useState(null)

  function cambiaVista(vista) {
    setVistaAttiva(vista)
    calRef.current?.getApi().changeView(vista)
  }

  function apriEdit() {
    if (!eventoSelezionato) return
    const { ora, persone, stato, note, telefono, email, preferenza, evento } = eventoSelezionato.extendedProps
    setPrenotazioneEdit({
      id:     eventoSelezionato.id,
      nome:   eventoSelezionato.title,
      data:   eventoSelezionato.startStr?.split('T')[0],
      ora, persone, stato, note, telefono, email: email || '', preferenza: preferenza || '', evento: evento || '',
    })
    setEventoSelezionato(null)
  }

  const viste = isMobile()
    ? [{ id: 'listDay', label: 'Giorno' }, { id: 'listWeek', label: 'Settimana' }, { id: 'listMonth', label: 'Mese' }]
    : [{ id: 'dayGridMonth', label: 'Mese' }, { id: 'timeGridWeek', label: 'Settimana' }, { id: 'timeGridDay', label: 'Giorno' }]

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>
          <IconCalendar size={20} />
          Calendario prenotazioni
        </h1>
        <div className={styles.headerActions}>
          <div className={styles.vistaTabs}>
            {viste.map(v => (
              <button key={v.id} className={`btn-toggle ${vistaAttiva === v.id ? 'active' : ''}`} onClick={() => cambiaVista(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          <button className="btn-icon" onClick={ricarica} title="Aggiorna">
            <IconRefresh size={15} />
          </button>
        </div>
      </div>
      {loading && <div className={styles.loading}>Caricamento prenotazioni...</div>}
      <div className={styles.calWrap}>
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={vistaAttiva}
          locale="it"
          events={[...agendaEvents, ...eventi]}
          eventContent={(info) => <EventoContenuto info={info} />}
          eventClick={(info) => {
            if (info.event.extendedProps.isAgenda) return
            setEventoSelezionato(info.event)
          }}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          buttonText={{ today: 'Vai ad oggi' }}
          height="auto"
          slotMinTime="11:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          firstDay={1}
          nowIndicator={true}
          dayMaxEvents={3}
          allDayText=""
          listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
          listDaySideFormat={false}
          noEventsText="Nessuna prenotazione"
          dayCellClassNames={(arg) => {
            const stato = getStatoGiorno(arg.date.toISOString().slice(0, 10))
            if (stato.tipo === 'ordinaria') return 'fc-day-chiuso-ord'
            if (stato.tipo === 'straordinaria') return 'fc-day-chiuso-strao'
            return ''
          }}
          dayCellContent={(arg) => {
            const stato = getStatoGiorno(arg.date.toISOString().slice(0, 10))
            return (
              <div className={styles.dayCellWrap}>
                <span>{arg.dayNumberText}</span>
                {stato.tipo === 'ordinaria' && (
                  <span className={styles.dcBadgeRed}>Chiuso</span>
                )}
                {stato.tipo === 'straordinaria' && stato.tuttoIlGiorno && (
                  <span className={styles.dcBadgeAmber}>Chius. str.</span>
                )}
                {stato.tipo === 'straordinaria' && !stato.tuttoIlGiorno && stato.fasce.map(f => (
                  <span key={f} className={styles.dcBadgeFascia}>
                    {f === 'Pranzo' ? 'Pranzo' : 'Cena'}
                  </span>
                ))}
              </div>
            )
          }}
          dayHeaderContent={(arg) => {
            const stato = getStatoGiorno(arg.date.toISOString().slice(0, 10))
            return (
              <div className={styles.dayHeaderWrap}>
                <span>{arg.text}</span>
                {stato.tipo === 'ordinaria' && (
                  <span className={styles.dcBadgeRed}>Chiuso</span>
                )}
                {stato.tipo === 'straordinaria' && stato.tuttoIlGiorno && (
                  <span className={styles.dcBadgeAmber}>Chius. str.</span>
                )}
                {stato.tipo === 'straordinaria' && !stato.tuttoIlGiorno && stato.fasce.map(f => (
                  <span key={f} className={styles.dcBadgeFascia}>
                    {f === 'Pranzo' ? 'Pranzo' : 'Cena'}
                  </span>
                ))}
              </div>
            )
          }}
        />
      </div>

      <ModalDettaglio
        evento={eventoSelezionato}
        onClose={() => setEventoSelezionato(null)}
        onEdit={apriEdit}
      />

      {prenotazioneEdit && (
        <ModalPrenotazione
          prenotazione={prenotazioneEdit}
          onClose={() => setPrenotazioneEdit(null)}
          onSuccess={ricarica}
        />
      )}
    </div>
  )
}
