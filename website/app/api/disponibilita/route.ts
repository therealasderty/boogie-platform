import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID  = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE    = process.env.AIRTABLE_TABLE    || 'Prenotazioni'
const AIRTABLE_CHIUSURE = process.env.AIRTABLE_CHIUSURE || 'Chiusure'
const AIRTABLE_ORARI    = process.env.AIRTABLE_ORARI    || 'Orari'
const AIRTABLE_AGENDA   = process.env.AIRTABLE_AGENDA   || 'Agenda'

const AT = (table: string) =>
  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`
const atHeaders = { Authorization: `Bearer ${AIRTABLE_TOKEN}` }

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data')
  if (!data) return NextResponse.json({ chiuso: true, fasce: [] }, { status: 400 })

  const giornoSettimana = new Date(data + 'T12:00:00').getDay()

  try {
    // ── 0. Controlla appuntamenti del giorno (bloccaGiorno + banner info) ──
    const agendaFormula = encodeURIComponent(`AND({Stato}!='dormiente',{Slug}!='')`)
    const agendaRes = await fetch(
      `${AT(AIRTABLE_AGENDA)}?filterByFormula=${agendaFormula}` +
      `&fields[]=Titolo&fields[]=Slug&fields[]=BloccaGiorno&fields[]=Data` +
      `&fields[]=Ricorrenza&fields[]=GiorniSettimana&fields[]=GiorniEsclusione&fields[]=FotoHero`,
      { headers: atHeaders }
    )
    const eventiDelGiorno: { titolo: string; slug: string }[] = []
    if (agendaRes.ok) {
      const agendaRecords: { fields: Record<string, unknown> }[] = ((await agendaRes.json()).records ?? [])
      for (const r of agendaRecords) {
        const f = r.fields
        const ricorrente = f['Ricorrenza'] && f['Ricorrenza'] !== 'nessuna'
        let matchDate = false
        if (!ricorrente) {
          matchDate = (f['Data'] as string) === data
        } else if (f['Ricorrenza'] === 'settimanale') {
          const giorniArr = ((f['GiorniSettimana'] as string) || '').split(',').map(s => s.trim()).filter(Boolean)
          matchDate = giorniArr.includes(String(giornoSettimana))
        } else if (f['Ricorrenza'] === 'giornaliera') {
          const esclusi = f['GiorniEsclusione'] ? (f['GiorniEsclusione'] as string).split(',').map(Number) : []
          matchDate = !esclusi.includes(giornoSettimana)
        }
        if (!matchDate) continue
        if (f['BloccaGiorno']) {
          return NextResponse.json({
            chiuso: true,
            bloccatoDaEvento: true,
            eventoTitolo: (f['Titolo'] as string) || '',
            eventoSlug:   (f['Slug'] as string) || '',
          })
        }
        const fotoRaw = f['FotoHero']
        const foto = typeof fotoRaw === 'string'
          ? fotoRaw
          : Array.isArray(fotoRaw) && fotoRaw[0]?.url
            ? (fotoRaw[0].url as string)
            : ''
        eventiDelGiorno.push({
          titolo: (f['Titolo'] as string) || '',
          slug:   (f['Slug'] as string) || '',
          foto,
        })
      }
    }

    // ── 1. Chiusure / aperture straordinarie ─────────────────────────
    const chiusureRes = await fetch(AT(AIRTABLE_CHIUSURE), { headers: atHeaders })
    let aperturaStaordinaria = false
    const fasceAperte  = new Set<string>()
    const fasceChiuse  = new Set<string>()
    let tuttoChiuso    = false

    if (chiusureRes.ok) {
      const records: { fields: Record<string, unknown> }[] =
        ((await chiusureRes.json()).records ?? [])

      // Prima passata: aperture straordinarie per data specifica
      for (const r of records) {
        const f = r.fields
        if (f['Tipo apertura'] !== 'Apertura straordinaria') continue
        if (f['Tipo'] !== 'Data specifica' || !f['Data inizio']) continue
        const fine = (f['Data fine'] as string) || (f['Data inizio'] as string)
        if (data >= (f['Data inizio'] as string) && data <= fine) {
          aperturaStaordinaria = true
          const fascia = f['Fascia']
          if (Array.isArray(fascia) && fascia.length > 0) fascia.forEach(x => fasceAperte.add(x))
          break
        }
      }

      // Seconda passata: chiusure (solo se non c'è apertura straordinaria)
      if (!aperturaStaordinaria) {
        for (const r of records) {
          const f = r.fields
          if (f['Tipo apertura'] === 'Apertura straordinaria') continue
          const tipo = f['Tipo'] as string
          let match = false
          if (tipo === 'Data specifica' && f['Data inizio']) {
            const fine = (f['Data fine'] as string) || (f['Data inizio'] as string)
            match = data >= (f['Data inizio'] as string) && data <= fine
          }
          if (tipo === 'Giorno della settimana' && f['Giorno'] != null) {
            match = Number(f['Giorno']) === giornoSettimana
          }
          if (match) {
            const fascia = f['Fascia']
            if (!fascia || (Array.isArray(fascia) && fascia.length === 0)) {
              tuttoChiuso = true; break
            }
            const arr = Array.isArray(fascia) ? fascia : [fascia]
            arr.forEach((x: string) => fasceChiuse.add(x))
          }
        }
      }
    }

    if (tuttoChiuso) return NextResponse.json({ chiuso: true, fasce: [] })

    // ── 2. Orari e generazione slot ──────────────────────────────────
    const orariRes = await fetch(AT(AIRTABLE_ORARI), { headers: atHeaders })
    const ORDINE_FASCE_DEFAULT = ['Pranzo', 'Aperitivo', 'Cena']
    const fasceSlots: Record<string, Set<string>> = {}
    const fasceOrdine: string[] = []

    if (orariRes.ok) {
      const orari: { fields: Record<string, unknown> }[] =
        ((await orariRes.json()).records ?? []).filter(
          (r: { fields: Record<string, unknown> }) => r.fields['Attivo']
        )

      for (const r of orari) {
        const f         = r.fields
        const giorni    = (f['Giorni'] as string[]) || []
        const oraInizio = f['Ora inizio'] as string
        const oraFine   = f['Ora fine'] as string
        const intervallo = parseInt(f['Intervallo minuti'] as string) || 15
        const fascia    = (f['Fascia'] as string) || 'Cena'

        if (aperturaStaordinaria) {
          if (fasceAperte.size > 0 && !fasceAperte.has(fascia)) continue
        } else {
          if (!giorni.includes(String(giornoSettimana))) continue
          if (fasceChiuse.has(fascia)) continue
        }

        if (!oraInizio || !oraFine) continue

        const [hS, mS] = oraInizio.split(':').map(Number)
        const [hE, mE] = oraFine.split(':').map(Number)
        let min = hS * 60 + mS
        const minFine = hE * 60 + mE

        if (!fasceSlots[fascia]) {
          fasceSlots[fascia] = new Set()
          if (!fasceOrdine.includes(fascia)) fasceOrdine.push(fascia)
        }
        while (min <= minFine) {
          fasceSlots[fascia].add(
            `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
          )
          min += intervallo
        }
      }
    }

    // Ordina le fasce: prima quelle nell'ordine di default, poi eventuali nuove
    const ordine = [
      ...ORDINE_FASCE_DEFAULT.filter(f => fasceOrdine.includes(f)),
      ...fasceOrdine.filter(f => !ORDINE_FASCE_DEFAULT.includes(f)),
    ]

    const tuttiSlots: string[] = []
    for (const f of ordine) {
      if (fasceSlots[f]) [...fasceSlots[f]].sort().forEach(s => tuttiSlots.push(s))
    }

    if (tuttiSlots.length === 0) return NextResponse.json({ chiuso: true, fasce: [] })

    // ── 3. Prenotazioni esistenti ────────────────────────────────────
    const MAX_PER_SLOT = 10
    const formula = encodeURIComponent(
      `AND(DATETIME_FORMAT({Data},'YYYY-MM-DD')="${data}", {Stato}!="Cancellata")`
    )
    const prenRes = await fetch(
      `${AT(AIRTABLE_TABLE)}?filterByFormula=${formula}&fields[]=Ora&fields[]=Persone`,
      { headers: atHeaders }
    )

    const occupazione: Record<string, number> = {}
    tuttiSlots.forEach(s => (occupazione[s] = 0))

    if (prenRes.ok) {
      const records: { fields: Record<string, unknown> }[] =
        ((await prenRes.json()).records ?? [])
      records.forEach(r => {
        const ora = r.fields['Ora'] as string
        const persone = Number(r.fields['Persone']) || 0
        if (ora && occupazione[ora] !== undefined) occupazione[ora] += persone
      })
    }

    const fasce = ordine
      .filter(f => fasceSlots[f])
      .map(f => ({
        fascia: f,
        slots: [...fasceSlots[f]].sort().map(ora => ({
          ora,
          occupati:     occupazione[ora] || 0,
          disponibili:  Math.max(0, MAX_PER_SLOT - (occupazione[ora] || 0)),
          pieno:        (occupazione[ora] || 0) >= MAX_PER_SLOT,
        })),
      }))

    return NextResponse.json({ chiuso: false, fasce, eventiDelGiorno })
  } catch (err) {
    console.error('disponibilita error:', err)
    return NextResponse.json({ chiuso: true, fasce: [] }, { status: 500 })
  }
}
