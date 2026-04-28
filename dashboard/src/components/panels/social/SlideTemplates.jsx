/**
 * SlideTemplates.jsx
 * Template grafici per il Post Builder social.
 * Tutti usano inline style per compatibilità con html-to-image.
 *
 * Template disponibili:
 *  - TemplateCover    — cover evento 4:5 (1080×1350)
 *  - TemplateFoto     — foto pura 1:1 / 4:5 / 9:16
 *  - TemplateStoriaEvento — story 9:16 (1080×1920)
 */

// ─── Costanti brand ────────────────────────────────────────────────────────────
const BRAND_GOLD = '#eece9d'
const DARK_BG    = '#13100a'

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDataIT(dateStr) {
  if (!dateStr) return ''
  try {
    const raw = new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
      weekday: 'short', day: 'numeric', month: 'long',
    })
    // "ven 1 maggio" → "Ven 1 Maggio"
    return raw.replace(/\b([a-z])/g, c => c.toUpperCase())
  } catch { return dateStr }
}

// ─── Template Cover (4:5 — 1080×1350) ────────────────────────────────────────
// Sfondo: foto full-bleed + overlay scuro.
// Logo SVG in cima, badge data pill, titolo Alga, descrizione Sofia Pro.

const W_COVER = 1080
const H_COVER = 1350
const LOGO_URL = '/Logo-Gold.svg'

export function TemplateCover({
  titolo      = 'Titolo Evento',
  data        = '',
  imageUrl    = '',
  descrizione = '',
}) {
  const titleSize = titolo.length > 22 ? 120 : titolo.length > 14 ? 148 : 172

  return (
    <div
      style={{
        position:        'relative',
        width:           W_COVER,
        height:          H_COVER,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'SofiaPro', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Foto di sfondo */}
      {imageUrl && (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{
            position:  'absolute',
            inset:     0,
            width:     '100%',
            height:    '100%',
            objectFit: 'cover',
            display:   'block',
          }}
        />
      )}

      {/* Overlay scuro uniforme */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'rgba(0,0,0,0.42)',
      }} />

      {/* Logo */}
      <div style={{
        position:  'absolute',
        top:       88,
        left:      0,
        right:     0,
        display:   'flex',
        justifyContent: 'center',
      }}>
        <img
          src={LOGO_URL}
          crossOrigin="anonymous"
          alt="Boogie Bistrot"
          style={{ width: 140, display: 'block' }}
        />
      </div>

      {/* Blocco contenuto: data + titolo + descrizione */}
      <div style={{
        position:       'absolute',
        top:            370,
        left:           60,
        right:          60,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            0,
      }}>
        {/* Badge data */}
        {data && (
          <div style={{
            display:       'inline-block',
            padding:       '12px 36px',
            border:        `1.5px solid rgba(238,206,157,0.55)`,
            borderRadius:  999,
            fontSize:      34,
            fontWeight:    400,
            color:         BRAND_GOLD,
            marginBottom:  30,
            whiteSpace:    'nowrap',
            letterSpacing: 0.5,
          }}>
            {formatDataIT(data)}
          </div>
        )}

        {/* Titolo */}
        <div style={{
          fontFamily:    "'Alga', 'Georgia', serif",
          fontSize:      titleSize,
          fontWeight:    600,
          lineHeight:    0.92,
          color:         BRAND_GOLD,
          textAlign:     'center',
          wordBreak:     'break-word',
          marginBottom:  44,
          width:         '100%',
        }}>
          {titolo}
        </div>

        {/* Descrizione */}
        {descrizione && (
          <div style={{
            fontSize:    40,
            fontWeight:  400,
            lineHeight:  1.5,
            color:       'rgba(255,255,255,0.88)',
            textAlign:   'center',
            width:       '100%',
          }}>
            {descrizione}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Template Foto (1:1 e 4:5 e 9:16) ────────────────────────────────────────
// Slide pura: foto full-bleed dalla libreria media + logo opzionale.

export function TemplateFoto({ imageUrl = '', mostraLogo = true }) {
  return (
    <div
      style={{
        position:        'relative',
        width:           '100%',
        height:          '100%',
        backgroundColor: DARK_BG,
        overflow:        'hidden',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{
            position:  'absolute',
            inset:     0,
            width:     '100%',
            height:    '100%',
            objectFit: 'cover',
            display:   'block',
          }}
        />
      ) : (
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            20,
          color:          'rgba(255,255,255,0.2)',
          fontSize:       28,
          letterSpacing:  4,
        }}>
          <div style={{ fontSize: 64, opacity: 0.3 }}>🖼</div>
          Seleziona una foto
        </div>
      )}

      {mostraLogo && (
        <div style={{
          position:  'absolute',
          bottom:    48,
          left:      0,
          right:     0,
          display:   'flex',
          justifyContent: 'center',
        }}>
          <img
            src={LOGO_URL}
            crossOrigin="anonymous"
            alt="Boogie Bistrot"
            style={{ width: 90, opacity: 0.85, display: 'block' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Template Storia Evento (9:16 — 1080×1920) ───────────────────────────────

const W_STORIA = 1080
const H_STORIA = 1920

export function TemplateStoriaEvento({ titolo = 'Titolo Evento', data = '', ora = '', imageUrl = '' }) {
  const titoloFontSize = titolo.length > 25 ? 88 : titolo.length > 15 ? 110 : 130

  return (
    <div
      style={{
        position:        'relative',
        width:           W_STORIA,
        height:          H_STORIA,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'SofiaPro', 'Helvetica Neue', sans-serif",
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Gradient overlay */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to top, rgba(18,12,3,0.95) 0%, rgba(18,12,3,0.55) 40%, rgba(18,12,3,0.15) 100%)',
      }} />

      {/* Logo in alto */}
      <div style={{
        position:       'absolute',
        top:            110,
        left:           0,
        right:          0,
        display:        'flex',
        justifyContent: 'center',
      }}>
        <img
          src={LOGO_URL}
          crossOrigin="anonymous"
          alt="Boogie Bistrot"
          style={{ width: 130, display: 'block' }}
        />
      </div>

      {/* Contenuto in basso */}
      <div style={{ position: 'absolute', bottom: 220, left: 90, right: 90 }}>
        {/* Badge */}
        <div style={{
          display:       'inline-block',
          padding:       '8px 26px',
          border:        `1px solid ${BRAND_GOLD}`,
          borderRadius:  999,
          fontSize:       22,
          fontWeight:    600,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color:         BRAND_GOLD,
          marginBottom:  44,
        }}>
          Evento
        </div>

        {/* Titolo */}
        <div style={{
          fontFamily:   "'Alga', 'Georgia', serif",
          fontSize:      titoloFontSize,
          fontWeight:   600,
          lineHeight:   1.05,
          color:        '#ffffff',
          marginBottom: 44,
        }}>
          {titolo}
        </div>

        {/* Data e ora */}
        {(data || ora) && (
          <div style={{
            fontSize:      28,
            fontWeight:    500,
            color:         BRAND_GOLD,
            letterSpacing: 2,
            textTransform: 'capitalize',
          }}>
            {formatDataIT(data)}{ora ? ` — ${ora}` : ''}
          </div>
        )}
      </div>

      {/* CTA prenota */}
      <div style={{
        position:       'absolute',
        bottom:         80,
        left:           0,
        right:          0,
        textAlign:      'center',
        fontFamily:     "'SofiaPro', sans-serif",
        fontSize:       28,
        fontWeight:     400,
        letterSpacing:  1,
        color:          'rgba(255,255,255,0.7)',
      }}>
        ↑ prenota nel link in bio
      </div>

      {/* Linea brand */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: BRAND_GOLD }} />
    </div>
  )
}

// ─── Mappa template ───────────────────────────────────────────────────────────

export const TEMPLATES = {
  cover:         { label: 'Cover evento',  Component: TemplateCover,        bgDark: true, size: '4:5' },
  foto_11:       { label: 'Foto 1:1',      Component: TemplateFoto,         bgDark: true, size: '1:1' },
  foto_45:       { label: 'Foto 4:5',      Component: TemplateFoto,         bgDark: true, size: '4:5' },
  foto_916:      { label: 'Foto Story',    Component: TemplateFoto,         bgDark: true, size: '9:16' },
  storia_evento: { label: 'Story Evento',  Component: TemplateStoriaEvento, bgDark: true, size: '9:16' },
}

// ─── Componente generico che sceglie il template giusto ────────────────────────

export function SlideRenderer({ slide, style }) {
  const { template, data: d = {} } = slide
  const T = TEMPLATES[template]
  if (!T) return null
  const { Component } = T
  return <Component {...d} style={style} />
}
