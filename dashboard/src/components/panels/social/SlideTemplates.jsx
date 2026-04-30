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
const BRAND_GOLD     = '#eece9d'
const DARK_BG        = '#13100a'
const BRAND_ADDRESS  = 'Via Europa 2 · Colle Brianza (LC)'

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

// ─── Logo block (logo + indirizzo opzionale) ──────────────────────────────────

function LogoBlock({ top = 72, logoW = 140, mostraIndirizzo = false, indirizzo = BRAND_ADDRESS }) {
  return (
    <div style={{
      position:       'absolute',
      top,
      left:           0,
      right:          0,
      display:        'flex',
      justifyContent: 'center',
      alignItems:     'center',
      gap:            28,
    }}>
      <img
        src={LOGO_URL}
        crossOrigin="anonymous"
        alt="Boogie Bistrot"
        style={{ width: logoW, display: 'block', flexShrink: 0 }}
      />
      {mostraIndirizzo && indirizzo && (
        <>
          <div style={{ width: 1, height: 36, background: 'rgba(238,206,157,0.35)', flexShrink: 0 }} />
          <div style={{
            fontSize:      22,
            lineHeight:    1.45,
            color:         'rgba(238,206,157,0.75)',
            fontFamily:    "'SofiaPro', 'Helvetica Neue', sans-serif",
            fontWeight:    400,
            letterSpacing: 0.3,
            whiteSpace:    'pre-line',
          }}>
            {indirizzo.replace(' · ', '\n')}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Template Cover (4:5 — 1080×1350) ────────────────────────────────────────
// Sfondo: foto full-bleed + overlay scuro.
// Logo SVG in cima, badge data pill, titolo Alga, descrizione Sofia Pro.

const W_COVER = 1080
const H_COVER = 1350
const LOGO_URL = '/Logo-Gold.svg'

export function TemplateCover({
  titolo          = 'Titolo Evento',
  data            = '',
  imageUrl        = '',
  descrizione     = '',
  mostraIndirizzo = false,
  indirizzo       = BRAND_ADDRESS,
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
          position:   'absolute',
          inset:      0,
          background: [
            'radial-gradient(ellipse at 25% 35%, rgba(200,130,40,0.35) 0%, transparent 45%)',
            'radial-gradient(ellipse at 75% 65%, rgba(160,80,20,0.28) 0%, transparent 42%)',
            'radial-gradient(ellipse at 55% 80%, rgba(220,160,60,0.2) 0%, transparent 35%)',
            'linear-gradient(160deg, #2e1c08 0%, #1a0f06 45%, #080503 100%)',
          ].join(', '),
        }} />
      )}

      {/* Overlay scuro uniforme */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'rgba(18,8,0,0.62)',
      }} />

      <LogoBlock top={88} logoW={140} mostraIndirizzo={mostraIndirizzo} indirizzo={indirizzo} />

      {/* Blocco contenuto: data + titolo + descrizione — centrato verticalmente */}
      <div style={{
        position:       'absolute',
        top:            220,
        left:           60,
        right:          60,
        bottom:         80,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
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
        <div style={{
          fontSize:    40,
          fontWeight:  400,
          lineHeight:  1.5,
          color:       descrizione ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.25)',
          textAlign:   'center',
          width:       '100%',
        }}>
          {descrizione || 'Descrizione evento...'}
        </div>
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

// ─── Template Prezzo Evento (4:5 — 1080×1350) ────────────────────────────────
// Mostra l'offerta/prezzo incluso in un evento: importo grande, voci incluse, data.

export function TemplatePrezzoEvento({
  titolo          = 'Titolo Evento',
  data            = '',
  ora             = '',
  imageUrl        = '',
  prezzoImporto   = '26€',
  prezzoLabel     = 'Apericena',
  voci            = [],
  mostraIndirizzo = false,
  indirizzo       = BRAND_ADDRESS,
}) {
  const titleSize  = titolo.length > 22 ? 68 : titolo.length > 14 ? 82 : 96
  const prezzoSize = prezzoImporto.length > 5 ? 130 : prezzoImporto.length > 3 ? 158 : 188
  const dataOra    = [formatDataIT(data), ora ? `ore ${ora}` : ''].filter(Boolean).join(' · ')

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
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          position:   'absolute',
          inset:      0,
          background: [
            'radial-gradient(ellipse at 25% 35%, rgba(200,130,40,0.3) 0%, transparent 45%)',
            'radial-gradient(ellipse at 75% 65%, rgba(140,70,15,0.25) 0%, transparent 42%)',
            'linear-gradient(160deg, #2e1c08 0%, #1a0f06 45%, #080503 100%)',
          ].join(', '),
        }} />
      )}

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,6,0,0.74)' }} />

      <LogoBlock top={72} logoW={120} mostraIndirizzo={mostraIndirizzo} indirizzo={indirizzo} />

      {/* Zona contenuto: centrata verticalmente tra logo e fondo */}
      <div style={{
        position:       'absolute',
        top:            210,
        left:           72,
        right:          72,
        bottom:         110,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}>

        {/* Titolo (prezzoLabel come heading principale) */}
        {prezzoLabel && (
          <div style={{
            fontFamily:   "'Alga', 'Georgia', serif",
            fontSize:      titleSize,
            fontWeight:   600,
            lineHeight:   0.95,
            color:        BRAND_GOLD,
            textAlign:    'left',
            wordBreak:    'break-word',
            width:        '100%',
            marginBottom: 48,
          }}>
            {prezzoLabel}
          </div>
        )}

        {/* Separatore */}
        <div style={{ width: '100%', height: 1, background: 'rgba(238,206,157,0.25)', marginBottom: 44 }} />

        {/* Voci incluse */}
        {voci.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', marginBottom: 44 }}>
            <div style={{
              fontSize:      24,
              fontWeight:    600,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color:         BRAND_GOLD,
              marginBottom:  10,
            }}>
              Cosa è incluso
            </div>
            {voci.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 22, fontSize: 34, lineHeight: 1.35 }}>
                <span style={{ color: BRAND_GOLD, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.88)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Separatore */}
        <div style={{ width: '100%', height: 1, background: 'rgba(238,206,157,0.25)', marginBottom: 36 }} />

        {/* Importo — allineato a destra */}
        <div style={{
          fontFamily:    "'Alga', 'Georgia', serif",
          fontSize:      prezzoSize * 0.58,
          fontWeight:    600,
          lineHeight:    1,
          color:         BRAND_GOLD,
          letterSpacing: -0.5,
          textAlign:     'right',
          width:         '100%',
        }}>
          {prezzoImporto}
        </div>

      </div>

      {/* Data + ora — pill in basso */}
      {dataOra && (
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display:       'inline-block',
            padding:       '10px 34px',
            border:        `1.5px solid rgba(238,206,157,0.4)`,
            borderRadius:  999,
            fontSize:      30,
            fontWeight:    400,
            color:         BRAND_GOLD,
            letterSpacing: 0.4,
            whiteSpace:    'nowrap',
          }}>
            {dataOra}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Template Storia Evento (9:16 — 1080×1920) ───────────────────────────────

const W_STORIA = 1080
const H_STORIA = 1920

export function TemplateStoriaEvento({ titolo = 'Titolo Evento', data = '', ora = '', imageUrl = '', mostraIndirizzo = false, indirizzo = BRAND_ADDRESS }) {
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

      <LogoBlock top={110} logoW={130} mostraIndirizzo={mostraIndirizzo} indirizzo={indirizzo} />

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

// ─── Template Prezzo Evento Story (9:16 — 1080×1920) ─────────────────────────
// Versione verticale del template prezzo: foto sfumata in alto, contenuto in basso.

export function TemplatePrezzoStoriaEvento({
  titolo          = 'Titolo Evento',
  data            = '',
  ora             = '',
  imageUrl        = '',
  prezzoImporto   = '26€',
  prezzoLabel     = 'Apericena',
  voci            = [],
  mostraIndirizzo = false,
  indirizzo       = BRAND_ADDRESS,
}) {
  const labelSize  = prezzoLabel.length > 22 ? 90 : prezzoLabel.length > 14 ? 112 : 130
  const prezzoSize = prezzoImporto.length > 5 ? 150 : prezzoImporto.length > 3 ? 180 : 210
  const dataOra    = [formatDataIT(data), ora ? `ore ${ora}` : ''].filter(Boolean).join(' · ')

  return (
    <div style={{
      position:        'relative',
      width:           W_STORIA,
      height:          H_STORIA,
      backgroundColor: DARK_BG,
      overflow:        'hidden',
      fontFamily:      "'SofiaPro', 'Helvetica Neue', sans-serif",
    }}>
      {/* Foto di sfondo */}
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          position:   'absolute',
          inset:      0,
          background: [
            'radial-gradient(ellipse at 25% 30%, rgba(200,130,40,0.32) 0%, transparent 45%)',
            'radial-gradient(ellipse at 75% 55%, rgba(140,70,15,0.25) 0%, transparent 42%)',
            'linear-gradient(160deg, #2e1c08 0%, #1a0f06 45%, #080503 100%)',
          ].join(', '),
        }} />
      )}

      {/* Gradient overlay: quasi trasparente in alto, scuro solo in basso per il testo */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to bottom, rgba(12,6,0,0.15) 0%, rgba(12,6,0,0.2) 35%, rgba(12,6,0,0.65) 58%, rgba(12,6,0,0.80) 75%, rgba(12,6,0,0.88) 100%)',
      }} />

      <LogoBlock top={110} logoW={130} mostraIndirizzo={mostraIndirizzo} indirizzo={indirizzo} />

      {/* Blocco contenuto — occupa la metà inferiore */}
      <div style={{
        position:      'absolute',
        top:           H_STORIA * 0.44,
        left:          90,
        right:         90,
        bottom:        160,
        display:       'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>

        {/* prezzoLabel — titolo principale */}
        {prezzoLabel && (
          <div style={{
            fontFamily:   "'Alga', 'Georgia', serif",
            fontSize:      labelSize,
            fontWeight:   600,
            lineHeight:   0.95,
            color:        BRAND_GOLD,
            wordBreak:    'break-word',
            marginBottom: 52,
          }}>
            {prezzoLabel}
          </div>
        )}

        {/* Separatore */}
        <div style={{ width: '100%', height: 1, background: 'rgba(238,206,157,0.25)', marginBottom: 48 }} />

        {/* Voci incluse */}
        {voci.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', marginBottom: 48 }}>
            <div style={{
              fontSize:      26,
              fontWeight:    600,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color:         BRAND_GOLD,
              marginBottom:  8,
            }}>
              Cosa è incluso
            </div>
            {voci.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, fontSize: 36, lineHeight: 1.35 }}>
                <span style={{ color: BRAND_GOLD, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.88)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Separatore */}
        <div style={{ width: '100%', height: 1, background: 'rgba(238,206,157,0.25)', marginBottom: 40 }} />

        {/* Importo — allineato a destra */}
        <div style={{
          fontFamily:    "'Alga', 'Georgia', serif",
          fontSize:      prezzoSize * 0.58,
          fontWeight:    600,
          lineHeight:    1,
          color:         BRAND_GOLD,
          letterSpacing: -0.5,
          textAlign:     'right',
          width:         '100%',
        }}>
          {prezzoImporto}
        </div>
      </div>

      {/* Data + ora in basso */}
      {dataOra && (
        <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display:       'inline-block',
            padding:       '10px 36px',
            border:        `1.5px solid rgba(238,206,157,0.4)`,
            borderRadius:  999,
            fontSize:      32,
            fontWeight:    400,
            color:         BRAND_GOLD,
            letterSpacing: 0.4,
            whiteSpace:    'nowrap',
          }}>
            {dataOra}
          </div>
        </div>
      )}

      {/* Linea brand */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: BRAND_GOLD }} />
    </div>
  )
}

// ─── Template Chiusura (4:5 — 1080×1350) ─────────────────────────────────────
// Slide finale con foto locale + invito a prenotare con contatti.

const BRAND_PHONE = '+39 346 581 3309'
const BRAND_SITE  = 'boogiebistrot.com'

export function TemplateChiusura({
  nomeSerata      = 'Nome Serata',
  imageUrl        = '',
  mostraIndirizzo = false,
  indirizzo       = BRAND_ADDRESS,
}) {
  const nameSize = nomeSerata.length > 20 ? 76 : nomeSerata.length > 12 ? 92 : 110

  return (
    <div style={{
      position:        'relative',
      width:           W_COVER,
      height:          H_COVER,
      backgroundColor: DARK_BG,
      overflow:        'hidden',
      fontFamily:      "'SofiaPro', 'Helvetica Neue', sans-serif",
    }}>
      {/* Foto full-bleed */}
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          position:   'absolute',
          inset:      0,
          background: [
            'radial-gradient(ellipse at 30% 40%, rgba(180,110,30,0.35) 0%, transparent 50%)',
            'radial-gradient(ellipse at 72% 25%, rgba(120,60,10,0.22) 0%, transparent 45%)',
            'linear-gradient(160deg, #2a1a08 0%, #160e05 55%, #0a0603 100%)',
          ].join(', '),
        }} />
      )}

      {/* Leggero scuro in cima per leggibilità logo */}
      <div style={{
        position:   'absolute',
        top:        0, left: 0, right: 0,
        height:     260,
        background: 'linear-gradient(to bottom, rgba(10,5,0,0.55) 0%, transparent 100%)',
      }} />

      {/* Sfumatura scura solo in basso, dove c'è il testo */}
      <div style={{
        position:   'absolute',
        bottom:     0, left: 0, right: 0,
        height:     600,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(10,5,0,0.82) 40%, rgba(10,5,0,0.97) 70%, rgba(10,5,0,1) 100%)',
      }} />

      {/* Logo */}
      <LogoBlock top={72} logoW={120} mostraIndirizzo={mostraIndirizzo} indirizzo={indirizzo} />

      {/* Testo in basso */}
      <div style={{
        position:      'absolute',
        bottom:        90,
        left:          72,
        right:         72,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-start',
        gap:           0,
      }}>
        {/* Intro */}
        <div style={{
          fontSize:    36,
          fontWeight:  400,
          lineHeight:  1.4,
          color:       'rgba(255,255,255,0.75)',
          marginBottom: 10,
        }}>
          Puoi prenotare
        </div>

        {/* Nome serata — in evidenza */}
        <div style={{
          fontFamily:   "'Alga', 'Georgia', serif",
          fontSize:      nameSize,
          fontWeight:   600,
          lineHeight:   1.0,
          color:        BRAND_GOLD,
          wordBreak:    'break-word',
          marginBottom: 28,
        }}>
          {nomeSerata}
        </div>

        {/* Testo contatti */}
        <div style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>
          su <span style={{ color: '#ffffff', fontWeight: 500 }}>{BRAND_SITE}</span>, nel link in bio
        </div>
        <div style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>
          oppure chiamaci al <span style={{ color: BRAND_GOLD, fontWeight: 500 }}>{BRAND_PHONE}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Mappa template ───────────────────────────────────────────────────────────

export const TEMPLATES = {
  cover: {
    label: 'Cover evento', Component: TemplateCover, bgDark: true, size: '4:5',
    demoProps: { titolo: 'Aperitivo Jazz', data: '2026-05-10', descrizione: 'Musica live e cocktail d\'autore' },
  },
  prezzo_evento: {
    label: 'Prezzo evento', Component: TemplatePrezzoEvento, bgDark: true, size: '4:5',
    demoProps: {
      data:          '2026-05-10',
      ora:           '19:30',
      prezzoImporto: '26€',
      prezzoLabel:   'Menù Paella',
      voci:          ['Stuzzichini misti', 'Primo dello chef', 'Drink a scelta'],
    },
  },
  chiusura: {
    label: 'Chiusura', Component: TemplateChiusura, bgDark: true, size: '4:5',
    demoProps: { nomeSerata: 'Serata Paella' },
  },
  foto_11: {
    label: 'Foto 1:1', Component: TemplateFoto, bgDark: true, size: '1:1',
  },
  foto_45: {
    label: 'Foto 4:5', Component: TemplateFoto, bgDark: true, size: '4:5',
  },
  foto_916: {
    label: 'Foto Story', Component: TemplateFoto, bgDark: true, size: '9:16',
  },
  storia_evento: {
    label: 'Story Evento', Component: TemplateStoriaEvento, bgDark: true, size: '9:16',
    demoProps: { titolo: 'Aperitivo Jazz', data: '2026-05-10', ora: '20:00' },
  },
  prezzo_storia: {
    label: 'Prezzo Story', Component: TemplatePrezzoStoriaEvento, bgDark: true, size: '9:16',
    demoProps: {
      data:          '2026-05-10',
      ora:           '19:30',
      prezzoImporto: '26€',
      prezzoLabel:   'Menù Paella',
      voci:          ['Stuzzichini misti', 'Primo dello chef', 'Drink a scelta'],
    },
  },
}

// ─── Componente generico che sceglie il template giusto ────────────────────────

export function SlideRenderer({ slide, style }) {
  const { template, data: d = {} } = slide
  const T = TEMPLATES[template]
  if (!T) return null
  const { Component } = T
  return <Component {...d} style={style} />
}
