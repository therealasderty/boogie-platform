import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_LIST_ID = process.env.BREVO_LIST_ID_EVENTI

export async function POST(req: NextRequest) {
  if (!BREVO_API_KEY || !BREVO_LIST_ID) {
    return NextResponse.json({ error: 'Configurazione Brevo mancante' }, { status: 500 })
  }

  const { nome, cognome, email, telefono, dataNascita, eventoTitolo } = await req.json()

  if (!email || !nome) {
    return NextResponse.json({ error: 'Email e nome sono obbligatori' }, { status: 400 })
  }

  const attributes: Record<string, string> = {
    NOME:    nome,
    COGNOME: cognome || '',
    SMS:     telefono || '',
    EVENTO:  eventoTitolo || '',
  }
  if (dataNascita) attributes.DATE_NAISSANCE = dataNascita

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true,
      }),
    })

    // 201 = creato, 204 = già esistente aggiornato — entrambi ok
    if (!res.ok && res.status !== 204) {
      const err = await res.text()
      console.error('Brevo error:', err)
      return NextResponse.json({ error: 'Errore Brevo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Brevo fetch error:', e)
    return NextResponse.json({ error: 'Errore di rete' }, { status: 500 })
  }
}
