/**
 * SlideTemplates.jsx
 * Tre template 1080×1080 per il Post Builder.
 * Rendono inline style per compatibilità con html-to-image.
 * Usati sia per l'anteprima scalata che per la cattura full-res.
 */

// ─── Costanti brand ────────────────────────────────────────────────────────────
const BRAND_GOLD   = '#eece9d'
const DARK_BG      = '#13100a'
const WARM_BG      = '#faf8f4'
const TEXT_DARK    = '#1A1208'
const TEXT_MUTED   = 'rgba(255,255,255,0.75)'

const SIZE = 1080

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDataIT(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch {
    return dateStr
  }
}

function Stelle({ n = 5, color = BRAND_GOLD, size = 36 }) {
  return (
    <span style={{ color, fontSize: size, letterSpacing: 4, lineHeight: 1 }}>
      {'★'.repeat(Math.min(5, Math.max(0, n)))}{'☆'.repeat(Math.max(0, 5 - n))}
    </span>
  )
}

// ─── Template Evento ──────────────────────────────────────────────────────────
// Sfondo: immagine + overlay dark gradient.
// Titolo con font IvyMode. Data in brand gold.

export function TemplateEvento({ titolo = 'Titolo Evento', data = '', ora = '', imageUrl = '' }) {
  return (
    <div
      style={{
        position:        'relative',
        width:           SIZE,
        height:          SIZE,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
      }}
    >
      {/* Foto di sfondo */}
      {imageUrl && (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            display:    'block',
          }}
        />
      )}

      {/* Overlay gradient */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'linear-gradient(to top, rgba(18,12,3,0.92) 0%, rgba(18,12,3,0.5) 50%, rgba(18,12,3,0.2) 100%)',
        }}
      />

      {/* Logo / nome ristorante in alto */}
      <div
        style={{
          position:      'absolute',
          top:           64,
          left:          0,
          right:         0,
          textAlign:     'center',
          fontFamily:    "'IvyMode', 'Georgia', serif",
          fontSize:       28,
          fontWeight:    300,
          letterSpacing: 8,
          textTransform: 'uppercase',
          color:         BRAND_GOLD,
        }}
      >
        Boogie Bistrot
      </div>

      {/* Contenuto centrale */}
      <div
        style={{
          position:   'absolute',
          bottom:     120,
          left:       80,
          right:      80,
        }}
      >
        {/* Badge tipo evento */}
        <div
          style={{
            display:       'inline-block',
            padding:       '6px 20px',
            border:        `1px solid ${BRAND_GOLD}`,
            borderRadius:  999,
            fontSize:      18,
            fontWeight:    600,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color:         BRAND_GOLD,
            marginBottom:  32,
          }}
        >
          Evento
        </div>

        {/* Titolo */}
        <div
          style={{
            fontFamily:  "'IvyMode', 'Georgia', serif",
            fontSize:     titolo.length > 30 ? 72 : 90,
            fontWeight:  400,
            lineHeight:  1.1,
            color:       '#ffffff',
            marginBottom: 32,
          }}
        >
          {titolo}
        </div>

        {/* Data e ora */}
        {(data || ora) && (
          <div
            style={{
              fontSize:      26,
              fontWeight:    500,
              color:         BRAND_GOLD,
              letterSpacing: 1,
              textTransform: 'capitalize',
            }}
          >
            {formatDataIT(data)}{ora ? ` — ${ora}` : ''}
          </div>
        )}
      </div>

      {/* Linea brand in basso */}
      <div
        style={{
          position:        'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          6,
          backgroundColor: BRAND_GOLD,
        }}
      />
    </div>
  )
}

// ─── Template Menu ────────────────────────────────────────────────────────────
// Sfondo caldo. Lista piatti stilizzata.

export function TemplateMenu({ piatti = [], titoloPagina = 'Dal nostro menu' }) {
  const piattiVisibili = piatti.slice(0, 6)

  return (
    <div
      style={{
        position:        'relative',
        width:           SIZE,
        height:          SIZE,
        backgroundColor: WARM_BG,
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:         '80px 100px 60px',
          borderBottom:    `2px solid ${BRAND_GOLD}`,
        }}
      >
        <div
          style={{
            fontSize:      22,
            fontWeight:    700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color:         BRAND_GOLD,
            marginBottom:  20,
          }}
        >
          Boogie Bistrot
        </div>
        <div
          style={{
            fontFamily:  "'IvyMode', 'Georgia', serif",
            fontSize:     80,
            fontWeight:  300,
            lineHeight:  1,
            color:       TEXT_DARK,
          }}
        >
          {titoloPagina}
        </div>
      </div>

      {/* Lista piatti */}
      <div
        style={{
          flex:          1,
          padding:       '60px 100px',
          display:       'flex',
          flexDirection: 'column',
          gap:           0,
        }}
      >
        {piattiVisibili.map((piatto, i) => (
          <div
            key={i}
            style={{
              display:       'flex',
              alignItems:    'baseline',
              justifyContent: 'space-between',
              paddingTop:    i === 0 ? 0 : 36,
              paddingBottom: 36,
              borderBottom:  i < piattiVisibili.length - 1 ? `1px solid rgba(18,12,3,0.1)` : 'none',
            }}
          >
            <div style={{ flex: 1, paddingRight: 40 }}>
              <div
                style={{
                  fontFamily:  "'IvyMode', 'Georgia', serif",
                  fontSize:     38,
                  fontWeight:  400,
                  color:       TEXT_DARK,
                  lineHeight:  1.2,
                }}
              >
                {piatto.nome}
              </div>
              {piatto.descrizione && (
                <div
                  style={{
                    fontSize:   22,
                    color:      'rgba(26,18,8,0.55)',
                    marginTop:  6,
                    lineHeight: 1.4,
                  }}
                >
                  {piatto.descrizione}
                </div>
              )}
            </div>
            {piatto.prezzo && (
              <div
                style={{
                  fontSize:   32,
                  fontWeight: 700,
                  color:      TEXT_DARK,
                  whiteSpace: 'nowrap',
                }}
              >
                {piatto.prezzo}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer brand */}
      <div
        style={{
          padding:       '0 100px 60px',
          display:       'flex',
          alignItems:    'center',
          gap:           16,
        }}
      >
        <div style={{ flex: 1, height: 2, backgroundColor: BRAND_GOLD }} />
        <div
          style={{
            fontSize:      18,
            fontWeight:    600,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color:         'rgba(26,18,8,0.4)',
          }}
        >
          boogiebistrot.it
        </div>
      </div>
    </div>
  )
}

// ─── Template Recensione ──────────────────────────────────────────────────────
// Sfondo scuro. Citazione in evidenza.

export function TemplateRecensione({ nome = 'Cliente', stelle = 5, testo = '', piattaforma = 'Google' }) {
  const testoBreve = testo.length > 220 ? testo.slice(0, 217) + '…' : testo

  return (
    <div
      style={{
        position:        'relative',
        width:           SIZE,
        height:          SIZE,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '100px',
      }}
    >
      {/* Decorazione angoli */}
      <div style={{ position: 'absolute', top: 48, left: 48, width: 60, height: 60, borderTop: `3px solid ${BRAND_GOLD}`, borderLeft: `3px solid ${BRAND_GOLD}` }} />
      <div style={{ position: 'absolute', top: 48, right: 48, width: 60, height: 60, borderTop: `3px solid ${BRAND_GOLD}`, borderRight: `3px solid ${BRAND_GOLD}` }} />
      <div style={{ position: 'absolute', bottom: 48, left: 48, width: 60, height: 60, borderBottom: `3px solid ${BRAND_GOLD}`, borderLeft: `3px solid ${BRAND_GOLD}` }} />
      <div style={{ position: 'absolute', bottom: 48, right: 48, width: 60, height: 60, borderBottom: `3px solid ${BRAND_GOLD}`, borderRight: `3px solid ${BRAND_GOLD}` }} />

      {/* Logo in alto */}
      <div
        style={{
          fontFamily:    "'IvyMode', 'Georgia', serif",
          fontSize:       22,
          fontWeight:    300,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color:         BRAND_GOLD,
          marginBottom:  60,
        }}
      >
        Boogie Bistrot
      </div>

      {/* Virgolette decorative */}
      <div
        style={{
          fontFamily:   'Georgia, serif',
          fontSize:      160,
          lineHeight:    0.7,
          color:         BRAND_GOLD,
          opacity:       0.3,
          marginBottom: 40,
          alignSelf:    'flex-start',
        }}
      >
        "
      </div>

      {/* Testo recensione */}
      <div
        style={{
          fontSize:   36,
          fontWeight: 400,
          lineHeight: 1.6,
          color:      '#ffffff',
          textAlign:  'center',
          fontStyle:  'italic',
          flex:       1,
          display:    'flex',
          alignItems: 'center',
        }}
      >
        {testoBreve}
      </div>

      {/* Stelle */}
      <div style={{ marginTop: 60, marginBottom: 24 }}>
        <Stelle n={stelle} size={44} />
      </div>

      {/* Autore e piattaforma */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        20,
        }}
      >
        <div
          style={{
            fontSize:   24,
            fontWeight: 700,
            color:      TEXT_MUTED,
          }}
        >
          {nome}
        </div>
        <div
          style={{
            width:           6,
            height:          6,
            borderRadius:    '50%',
            backgroundColor: BRAND_GOLD,
          }}
        />
        <div
          style={{
            fontSize:      20,
            fontWeight:    600,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color:         BRAND_GOLD,
          }}
        >
          {piattaforma}
        </div>
      </div>
    </div>
  )
}

// ─── Template Serata (4:5 — 1080×1350) ───────────────────────────────────────
// Replica fedele del template Figma:
// sfondo foto + overlay scuro + data (Vibur) + nome serata (Phosphate) +
// messaggio sottotitolo (Vibur) + indirizzo in basso.

const W_SERATA = 1080
const H_SERATA = 1350
const SERATA_GOLD = '#ffcd7e'

export function TemplateSerata({
  titolo          = 'NOME SERATA',
  data            = '',
  messaggio       = '',
  imageUrl        = '',
  indirizzo       = 'Via Europa, 2 — Colle Brianza (LC)',
  mostraIndirizzo = false,
}) {
  const dataFormattata = data
    ? new Date(data + 'T12:00:00')
        .toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
        .toUpperCase()
    : ''

  // Adatta la dimensione del titolo alla lunghezza
  const titoloFontSize = titolo.length > 14 ? 120 : titolo.length > 10 ? 145 : 164

  return (
    <div
      style={{
        position:        'relative',
        width:           W_SERATA,
        height:          H_SERATA,
        backgroundColor: '#110e07',
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
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

      {/* Overlay scuro — come in Figma rgba(18,12,3,0.6) */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'rgba(18,12,3,0.62)',
        }}
      />

      {/* Colonna contenuto centrata — larghezza 965px come in Figma */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '80px 57px',       // (1080-965)/2 ≈ 57px laterale
          gap:            54,
          textAlign:      'center',
        }}
      >
        {/* Logo Boogie */}
        <img
          src="/Logo-Serata.svg"
          alt="Boogie Bistrot"
          style={{ width: 200, height: 'auto', opacity: 0.92 }}
        />

        {/* Data — Vibur, bianco */}
        {dataFormattata && (
          <div
            style={{
              fontFamily:  "'Vibur', cursive",
              fontSize:    76,
              fontWeight:  500,
              lineHeight:  1.1,
              color:       '#ffffff',
              width:       '100%',
            }}
          >
            {dataFormattata}
          </div>
        )}

        {/* Nome serata — Phosphate Solid, oro */}
        <div
          style={{
            fontFamily:  "'PhosphateSolid', 'Impact', sans-serif",
            fontSize:    titoloFontSize,
            fontWeight:  400,
            lineHeight:  0.95,
            color:       SERATA_GOLD,
            width:       '100%',
            wordBreak:   'break-word',
            whiteSpace:  'pre-line',
          }}
        >
          {titolo.toUpperCase()}
        </div>

        {/* Messaggio / sottotitolo — Vibur, bianco */}
        {messaggio && (
          <div
            style={{
              fontFamily:  "'Vibur', cursive",
              fontSize:    146,
              fontWeight:  500,
              lineHeight:  0.9,
              color:       '#ffffff',
              width:       '100%',
              whiteSpace:  'pre-line',
            }}
          >
            {messaggio}
          </div>
        )}
      </div>

      {/* Indirizzo in basso */}
      {mostraIndirizzo && indirizzo && (
        <div
          style={{
            position:      'absolute',
            bottom:        60,
            left:          0,
            right:         0,
            textAlign:     'center',
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      28,
            fontWeight:    500,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.60)',
          }}
        >
          {indirizzo}
        </div>
      )}

      {/* Linea gold in basso */}
      <div
        style={{
          position:        'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          height:          6,
          backgroundColor: SERATA_GOLD,
        }}
      />
    </div>
  )
}

// ─── Template Prezzo (4:5 — 1080×1350) ───────────────────────────────────────
// Mostra i dati del blocco "prezzo" di un appuntamento:
// titolo evento, importo in evidenza, elenco voci incluse.

export function TemplatePrezzo({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 8)

  return (
    <div
      style={{
        position:        'relative',
        width:           W_SERATA,
        height:          H_SERATA,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* Foto sfondo (opzionale) con overlay pesante */}
      {imageUrl && (
        <>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,12,3,0.82)' }} />
        </>
      )}

      {/* Striscia brand in alto */}
      <div
        style={{
          position:        'relative',
          height:          8,
          backgroundColor: BRAND_GOLD,
          flexShrink:      0,
        }}
      />

      {/* Contenuto */}
      <div
        style={{
          position:      'relative',
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          padding:       '72px 90px 80px',
        }}
      >
        {/* Nome ristorante */}
        <div
          style={{
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      30,
            fontWeight:    300,
            letterSpacing: 7,
            textTransform: 'uppercase',
            color:         BRAND_GOLD,
            marginBottom:  48,
          }}
        >
          Boogie Bistrot
        </div>

        {/* Titolo evento */}
        <div
          style={{
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      34,
            fontWeight:    700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.45)',
            marginBottom:  16,
          }}
        >
          {titoloEvento}
        </div>

        {/* Titolo sezione prezzo */}
        <div
          style={{
            fontFamily:  "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:    110,
            fontWeight:  300,
            lineHeight:  0.95,
            color:       '#ffffff',
            marginBottom: 48,
          }}
        >
          {titoloPagina}
        </div>

        {/* Divisore */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 48 }} />

        {/* Lista voci */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {vociVisibili.map((voce, i) => (
            <div
              key={i}
              style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        24,
              }}
            >
              {/* Bullet gold */}
              <div
                style={{
                  width:           10,
                  height:          10,
                  borderRadius:    '50%',
                  backgroundColor: BRAND_GOLD,
                  flexShrink:      0,
                  marginTop:       10,
                }}
              />
              <div
                style={{
                  fontSize:   46,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color:      'rgba(255,255,255,0.88)',
                }}
              >
                {voce}
              </div>
            </div>
          ))}
        </div>

        {/* Importo */}
        {importo && (
          <div
            style={{
              marginTop:     48,
              display:       'flex',
              alignItems:    'baseline',
              gap:           16,
            }}
          >
            <div style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <div
              style={{
                fontFamily:  "'BasisGrotesque', 'Raleway', sans-serif",
                fontSize:    100,
                fontWeight:  400,
                lineHeight:  1,
                color:       BRAND_GOLD,
              }}
            >
              {importo}
            </div>
            <div
              style={{
                fontSize:   36,
                fontWeight: 500,
                color:      'rgba(255,255,255,0.45)',
                alignSelf:  'flex-end',
                paddingBottom: 12,
              }}
            >
              a persona
            </div>
          </div>
        )}

        {/* Indirizzo */}
        {indirizzo && (
          <div
            style={{
              marginTop:     32,
              fontSize:      30,
              fontWeight:    500,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.40)',
              textAlign:     'center',
            }}
          >
            {indirizzo}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Template Prezzo Alt A: Split (4:5 — 1080×1350) ─────────────────────────
// Foto visibile e respirante nella metà alta, pannello scuro con info nella metà bassa.

export function TemplatePrezzoSplit({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 6)
  const PHOTO_H = 700

  return (
    <div
      style={{
        position:        'relative',
        width:           W_SERATA,
        height:          H_SERATA,
        backgroundColor: DARK_BG,
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
        display:         'flex',
        flexDirection:   'column',
      }}
    >
      {/* ── Metà alta: foto ── */}
      <div style={{ position: 'relative', height: PHOTO_H, flexShrink: 0, overflow: 'hidden' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            crossOrigin="anonymous"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#2a2018' }} />
        )}

        {/* Gradient sottile solo al fondo della foto */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: `linear-gradient(to bottom, transparent, ${DARK_BG})`,
        }} />

        {/* Logo in alto a sinistra sopra la foto */}
        <div style={{
          position:      'absolute',
          top:           56,
          left:          72,
          fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize:      28,
          fontWeight:    300,
          letterSpacing: 7,
          textTransform: 'uppercase',
          color:         BRAND_GOLD,
        }}>
          Boogie Bistrot
        </div>

        {/* Tag evento in alto a destra */}
        {titoloEvento && (
          <div style={{
            position:      'absolute',
            top:           56,
            right:         72,
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      24,
            fontWeight:    700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.50)',
          }}>
            {titoloEvento}
          </div>
        )}
      </div>

      {/* ── Divisore gold ── */}
      <div style={{ height: 5, backgroundColor: BRAND_GOLD, flexShrink: 0 }} />

      {/* ── Metà bassa: contenuto ── */}
      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        padding:       '52px 80px 56px',
        position:      'relative',
      }}>
        {/* Titolo sezione */}
        <div style={{
          fontFamily:   "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize:      96,
          fontWeight:   300,
          lineHeight:   0.95,
          color:        '#ffffff',
          marginBottom: 40,
        }}>
          {titoloPagina}
        </div>

        {/* Lista voci */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {vociVisibili.map((voce, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: BRAND_GOLD, flexShrink: 0, marginTop: 11,
              }} />
              <div style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.3, color: 'rgba(255,255,255,0.85)' }}>
                {voce}
              </div>
            </div>
          ))}
        </div>

        {/* Importo — in basso */}
        {importo && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 32 }}>
            <div style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <div style={{
              fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
              fontSize:   96, fontWeight: 400, lineHeight: 1, color: BRAND_GOLD,
            }}>
              {importo}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 500,
              color: 'rgba(255,255,255,0.40)',
              alignSelf: 'flex-end', paddingBottom: 9,
            }}>
              a persona
            </div>
          </div>
        )}

        {indirizzo && (
          <div style={{
            marginTop: 20, fontSize: 28, fontWeight: 500, letterSpacing: 3,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', textAlign: 'center',
          }}>
            {indirizzo}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Template Prezzo Alt B: Immersivo (4:5 — 1080×1350) ──────────────────────
// Foto full-bleed con overlay leggero, prezzo HUGE in Phosphate come hero,
// strip scura in basso con voci incluse.

export function TemplatePrezzoImmersivo({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 5)
  // Dimensione importo adattiva
  const importoSize = importo.length > 5 ? 150 : importo.length > 3 ? 180 : 210

  return (
    <div
      style={{
        position:        'relative',
        width:           W_SERATA,
        height:          H_SERATA,
        backgroundColor: '#0d0b05',
        overflow:        'hidden',
        fontFamily:      "'BasisGrotesque', 'Raleway', sans-serif",
      }}
    >
      {/* ── Foto full-bleed ── */}
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a1408 0%, #0d0a05 100%)' }} />
      )}

      {/* Overlay leggero — foto respira */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,12,3,0.42)' }} />

      {/* Gradient scuro sul fondo per la strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 520,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(18,12,3,0.92) 50%, rgba(18,12,3,0.98) 100%)',
      }} />

      {/* ── Logo + evento in cima ── */}
      <div style={{
        position:       'absolute',
        top:            0, left: 0, right: 0,
        padding:        '60px 72px 0',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
      }}>
        <div style={{
          fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize:      28,
          fontWeight:    300,
          letterSpacing: 7,
          textTransform: 'uppercase',
          color:         BRAND_GOLD,
        }}>
          Boogie Bistrot
        </div>
        {titoloEvento && (
          <div style={{
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      22,
            fontWeight:    700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.45)',
            paddingTop:    4,
          }}>
            {titoloEvento}
          </div>
        )}
      </div>

      {/* ── Hero importo centrato sopra la foto ── */}
      {importo && (
        <div style={{
          position:       'absolute',
          top:            0, bottom: 460,
          left:           0, right: 0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            0,
        }}>
          {/* Sottotitolo sopra il prezzo */}
          <div style={{
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      46,
            fontWeight:    300,
            letterSpacing: 3,
            color:         'rgba(255,255,255,0.70)',
            marginBottom:  16,
            fontStyle:     'italic',
          }}>
            {titoloPagina}
          </div>

          {/* Prezzo hero */}
          <div style={{
            fontFamily:    "'PhosphateSolid', 'Impact', sans-serif",
            fontSize:      importoSize,
            fontWeight:    400,
            lineHeight:    0.9,
            color:         BRAND_GOLD,
            letterSpacing: -2,
          }}>
            {importo}
          </div>

          {/* A persona */}
          <div style={{
            fontFamily:    "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize:      34,
            fontWeight:    500,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.45)',
            marginTop:     18,
          }}>
            a persona
          </div>
        </div>
      )}

      {/* ── Strip scura in basso con voci ── */}
      <div style={{
        position:      'absolute',
        bottom:        0, left: 0, right: 0,
        height:        460,
        padding:       '44px 80px 52px',
        display:       'flex',
        flexDirection: 'column',
        justifyContent:'flex-end',
        gap:           0,
      }}>
        {/* Linea gold */}
        <div style={{ height: 1, backgroundColor: BRAND_GOLD, opacity: 0.5, marginBottom: 36 }} />

        {/* Voci incluse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {vociVisibili.map((voce, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: BRAND_GOLD, flexShrink: 0,
              }} />
              <div style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.2, color: 'rgba(255,255,255,0.82)' }}>
                {voce}
              </div>
            </div>
          ))}
        </div>

        {/* Indirizzo */}
        {indirizzo && (
          <div style={{
            marginTop:     24,
            fontSize:      26,
            fontWeight:    500,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.32)',
            textAlign:     'center',
          }}>
            {indirizzo}
          </div>
        )}
      </div>

      {/* Striscia gold in basso */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, backgroundColor: BRAND_GOLD }} />
    </div>
  )
}

// ─── Template Prezzo D: Focus Trasparente (4:5 — 1080×1350) ─────────────────
// Foto full-bleed leggera (overlay 0.3) + blocco centrale frosted con importo
// e voci. Massima leggibilità senza sacrificare l'impatto della foto.

export function TemplatePrezzoFocus({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 6)
  const importoSize  = importo.length > 5 ? 130 : importo.length > 3 ? 160 : 190

  return (
    <div style={{
      position: 'relative', width: W_SERATA, height: H_SERATA,
      backgroundColor: '#0d0b05', overflow: 'hidden',
      fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
    }}>
      {/* Foto full-bleed */}
      {imageUrl ? (
        <img src={imageUrl} crossOrigin="anonymous" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #2a1f0e 0%, #0d0a05 100%)' }} />
      )}
      {/* Overlay leggero — foto respira */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,12,3,0.30)' }} />

      {/* ── Logo + nome evento in alto ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '60px 72px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <img src="/Logo-Gold.svg" alt="Boogie Bistrot"
          style={{ width: 64, height: 'auto', opacity: 0.90 }} />
        {titoloEvento && (
          <div style={{
            fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize: 22, fontWeight: 700, letterSpacing: 4,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', paddingTop: 4,
          }}>
            {titoloEvento}
          </div>
        )}
      </div>

      {/* ── Blocco centrale frosted ── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 880,
        background: 'rgba(18,12,3,0.75)',
        borderRadius: 20,
        padding: '64px 72px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 0,
      }}>
        {/* Titolo sezione */}
        <div style={{
          fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize: 42, fontWeight: 300, fontStyle: 'italic',
          letterSpacing: 2, color: 'rgba(255,255,255,0.60)',
          marginBottom: 20,
        }}>
          {titoloPagina}
        </div>

        {/* Importo */}
        {importo && (
          <div style={{
            fontFamily: "'PhosphateSolid', 'Impact', sans-serif",
            fontSize: importoSize, fontWeight: 400, lineHeight: 0.9,
            color: BRAND_GOLD, marginBottom: 10,
          }}>
            {importo}
          </div>
        )}

        {/* A persona */}
        <div style={{
          fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize: 30, fontWeight: 500, letterSpacing: 4,
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)',
          marginBottom: 44,
        }}>
          a persona
        </div>

        {/* Linea gold */}
        <div style={{ width: '100%', height: 1, backgroundColor: BRAND_GOLD, opacity: 0.4, marginBottom: 36 }} />

        {/* Voci */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {vociVisibili.map((voce, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: BRAND_GOLD, flexShrink: 0, marginTop: 10,
              }} />
              <div style={{
                fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
                fontSize: 40, fontWeight: 400, lineHeight: 1.3,
                color: 'rgba(255,255,255,0.88)',
              }}>
                {voce}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indirizzo in basso */}
      {indirizzo && (
        <div style={{
          position: 'absolute', bottom: 48, left: 0, right: 0, textAlign: 'center',
          fontSize: 26, fontWeight: 500, letterSpacing: 3,
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)',
        }}>
          {indirizzo}
        </div>
      )}
    </div>
  )
}

// ─── Template Prezzo E: Luce e Ombra (4:5 — 1080×1350) ──────────────────────
// Foto full-bleed che sfuma dal basso scuro all'alto luminoso.
// Importo in Phosphate con bagliore gold come protagonista assoluto.
// Voci nella zona scura in basso, naturalmente leggibili.

export function TemplatePrezzoLuce({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 4)
  const importoSize  = importo.length > 5 ? 150 : importo.length > 3 ? 185 : 220

  return (
    <div style={{
      position: 'relative', width: W_SERATA, height: H_SERATA,
      backgroundColor: '#0d0b05', overflow: 'hidden',
      fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
    }}>
      {/* Foto full-bleed */}
      {imageUrl ? (
        <img src={imageUrl} crossOrigin="anonymous" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #3a2810 0%, #0d0a05 100%)' }} />
      )}

      {/* Gradient "luce e ombra": alto luminoso, basso quasi buio */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(18,12,3,0.15) 0%, rgba(18,12,3,0.30) 35%, rgba(18,12,3,0.72) 65%, rgba(18,12,3,0.95) 100%)',
      }} />

      {/* ── Logo in alto a sinistra — zona luminosa ── */}
      <div style={{
        position: 'absolute', top: 60, left: 72,
        fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
        fontSize: 28, fontWeight: 300, letterSpacing: 7,
        textTransform: 'uppercase', color: BRAND_GOLD,
      }}>
        Boogie Bistrot
      </div>
      {titoloEvento && (
        <div style={{
          position: 'absolute', top: 102, left: 72,
          fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize: 22, fontWeight: 700, letterSpacing: 4,
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
        }}>
          {titoloEvento}
        </div>
      )}

      {/* ── Importo hero con bagliore — centro-destra ── */}
      {importo && (
        <div style={{
          position: 'absolute',
          top: '28%', right: 72,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          {/* Sottotitolo sopra */}
          <div style={{
            fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize: 40, fontWeight: 300, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: 1,
          }}>
            {titoloPagina}
          </div>

          {/* Importo con bagliore gold */}
          <div style={{
            fontFamily: "'PhosphateSolid', 'Impact', sans-serif",
            fontSize: importoSize, fontWeight: 400, lineHeight: 0.88,
            color: BRAND_GOLD,
            textShadow: `0 0 80px rgba(238,206,157,0.55), 0 0 160px rgba(238,206,157,0.25)`,
          }}>
            {importo}
          </div>

          {/* A persona */}
          <div style={{
            fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
            fontSize: 30, fontWeight: 500, letterSpacing: 5,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)',
            marginTop: 14,
          }}>
            a persona
          </div>
        </div>
      )}

      {/* ── Voci in basso — zona scura ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 80px 60px',
      }}>
        {/* Linea gold */}
        <div style={{ height: 1, backgroundColor: BRAND_GOLD, opacity: 0.45, marginBottom: 36 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {vociVisibili.map((voce, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: BRAND_GOLD, flexShrink: 0,
              }} />
              <div style={{
                fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
                fontSize: 42, fontWeight: 400, lineHeight: 1.25,
                color: 'rgba(255,255,255,0.85)',
              }}>
                {voce}
              </div>
            </div>
          ))}
        </div>

        {indirizzo && (
          <div style={{
            marginTop: 28, fontSize: 26, fontWeight: 500, letterSpacing: 3,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', textAlign: 'center',
          }}>
            {indirizzo}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Template Prezzo F: Minimalismo Elegante (4:5 — 1080×1350) ───────────────
// Sfondo quasi buio (foto con overlay 0.9 o dark fisso).
// Solo importo enorme al centro, "a persona" sotto, 3 voci chiave + linea gold.
// Esclusività pura.

export function TemplatePrezzoMinimal({
  titoloEvento = 'Serata speciale',
  titoloPagina  = "L'esperienza",
  importo       = '',
  voci          = [],
  imageUrl      = '',
  indirizzo     = '',
}) {
  const vociVisibili = voci.slice(0, 3)
  const importoSize  = importo.length > 5 ? 160 : importo.length > 3 ? 200 : 240

  return (
    <div style={{
      position: 'relative', width: W_SERATA, height: H_SERATA,
      backgroundColor: '#110e07', overflow: 'hidden',
      fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Foto con overlay molto pesante */}
      {imageUrl && (
        <>
          <img src={imageUrl} crossOrigin="anonymous" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,12,3,0.88)' }} />
        </>
      )}

      {/* Logo angolo in alto a sinistra */}
      <div style={{
        position: 'absolute', top: 60, left: 72,
        fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
        fontSize: 26, fontWeight: 300, letterSpacing: 7,
        textTransform: 'uppercase', color: BRAND_GOLD, opacity: 0.75,
      }}>
        Boogie Bistrot
      </div>

      {/* ── Centro: importo assoluto protagonista ── */}
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        marginTop: -80,
      }}>
        {/* Titolo sezione sopra */}
        <div style={{
          fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize: 44, fontWeight: 300, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 24,
        }}>
          {titoloPagina}
        </div>

        {/* Importo */}
        {importo && (
          <div style={{
            fontFamily: "'PhosphateSolid', 'Impact', sans-serif",
            fontSize: importoSize, fontWeight: 400, lineHeight: 0.88,
            color: BRAND_GOLD,
          }}>
            {importo}
          </div>
        )}

        {/* A persona */}
        <div style={{
          fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
          fontSize: 42, fontWeight: 300, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.40)', letterSpacing: 3, marginTop: 24,
        }}>
          a persona
        </div>
      </div>

      {/* ── Voci in basso — essenziali ── */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        {/* Linea gold */}
        <div style={{ width: 120, height: 1, backgroundColor: BRAND_GOLD, opacity: 0.6, marginBottom: 36 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {vociVisibili.map((voce, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: BRAND_GOLD, flexShrink: 0,
              }} />
              <div style={{
                fontFamily: "'BasisGrotesque', 'Raleway', sans-serif",
                fontSize: 40, fontWeight: 400, lineHeight: 1.3,
                color: 'rgba(255,255,255,0.70)', textAlign: 'center',
              }}>
                {voce}
              </div>
              {i < vociVisibili.length - 1 && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: BRAND_GOLD, opacity: 0.4 }} />
              )}
            </div>
          ))}
        </div>

        {indirizzo && (
          <div style={{
            marginTop: 28, fontSize: 26, fontWeight: 500, letterSpacing: 4,
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
          }}>
            {indirizzo}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Template Panoramica (4:5 — 1080×1350) ────────────────────────────────────
// Un'immagine larga 2160px divisa in due slide: la metà sinistra e quella destra.
// Scorrendo il carosello l'immagine appare continua e senza interruzioni.
// lato: 'sx' | 'dx'

export function TemplatePanoramica({
  imageUrl = '',
  lato     = 'sx',   // 'sx' = prima slide, 'dx' = seconda slide
  testo    = '',      // testo opzionale sovrapposto (solo sulla slide sx)
}) {
  const objectPos = lato === 'sx' ? 'left center' : 'right center'

  return (
    <div style={{
      position: 'relative', width: W_SERATA, height: H_SERATA,
      backgroundColor: '#13100a', overflow: 'hidden',
    }}>
      {/* Immagine: usa object-position per mostrare la metà corretta */}
      {imageUrl ? (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          alt=""
          style={{
            position:        'absolute',
            inset:           0,
            width:           '100%',
            height:          '100%',
            objectFit:       'cover',
            objectPosition:  objectPos,
            display:         'block',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: lato === 'sx'
            ? 'linear-gradient(to right, #2a1f0e, #1a1208)'
            : 'linear-gradient(to right, #1a1208, #0d0b05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 28, fontFamily: "'BasisGrotesque', sans-serif", letterSpacing: 4 }}>
            {lato === 'sx' ? '← foto panoramica' : 'foto panoramica →'}
          </div>
        </div>
      )}

      {/* Testo opzionale — solo sulla slide sinistra */}
      {testo && lato === 'sx' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,12,3,0.45)' }} />
          <div style={{
            position: 'absolute', bottom: 90, left: 72, right: 72,
            fontFamily: "'IvyMode', 'Georgia', serif",
            fontSize: 72, fontWeight: 300, lineHeight: 1.1,
            color: '#fff',
          }}>
            {testo}
          </div>
        </>
      )}

      {/* Indicatore bordo di continuità — sottile linea a destra su sx, a sinistra su dx */}
      <div style={{
        position:        'absolute',
        top:             0,
        bottom:          0,
        [lato === 'sx' ? 'right' : 'left']: 0,
        width:           3,
        background:      lato === 'sx'
          ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.08))'
          : 'linear-gradient(to left,  transparent, rgba(255,255,255,0.08))',
      }} />
    </div>
  )
}

// ─── Mappa template ───────────────────────────────────────────────────────────

export const TEMPLATES = {
  evento:          { label: 'Evento',           Component: TemplateEvento,           bgDark: true,  size: '1:1' },
  menu:            { label: 'Menu',             Component: TemplateMenu,             bgDark: false, size: '1:1' },
  recensione:      { label: 'Recensione',       Component: TemplateRecensione,       bgDark: true,  size: '1:1' },
  serata:          { label: 'Serata',           Component: TemplateSerata,           bgDark: true,  size: '4:5' },
  prezzo:          { label: 'Prezzo',           Component: TemplatePrezzo,           bgDark: true,  size: '4:5' },
  prezzo2:         { label: 'Prezzo Split',     Component: TemplatePrezzoSplit,      bgDark: true,  size: '4:5' },
  prezzo3:         { label: 'Prezzo Immersivo', Component: TemplatePrezzoImmersivo,  bgDark: true,  size: '4:5' },
  prezzo4:         { label: 'Prezzo Focus',     Component: TemplatePrezzoFocus,      bgDark: true,  size: '4:5' },
  prezzo5:         { label: 'Prezzo Luce',      Component: TemplatePrezzoLuce,       bgDark: true,  size: '4:5' },
  prezzo6:         { label: 'Prezzo Minimal',   Component: TemplatePrezzoMinimal,    bgDark: true,  size: '4:5' },
  panoramica_sx:   { label: 'Panor. ←',        Component: TemplatePanoramica,        bgDark: true,  size: '4:5', paired: 'panoramica_dx' },
  panoramica_dx:   { label: 'Panor. →',        Component: TemplatePanoramica,        bgDark: true,  size: '4:5', paired: 'panoramica_sx' },
}

// ─── Componente generico che sceglie il template giusto ────────────────────────

export function SlideRenderer({ slide, style }) {
  const { template, data: d = {} } = slide
  const T = TEMPLATES[template]
  if (!T) return null
  const { Component } = T
  return <Component {...d} style={style} />
}
