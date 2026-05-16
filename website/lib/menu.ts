import { REVALIDATE_AGENDA_S } from '@/lib/revalidate'

export interface VoceMenu {
  nome: string
  descrizione?: string
  prezzo: number | null
  formato?: string
  prezzo2?: number | null
  formato2?: string
  note?: string
  badge?: string
  produttore?: string
  regione?: string
  senzaGlutine?: boolean
  senzaLattosio?: boolean
}

export interface SezioneMenu {
  titolo: string
  voci: VoceMenu[]
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

async function fetchTuttoMenu(): Promise<AirtableRecord[]> {
  const token   = process.env.AIRTABLE_TOKEN
  const baseId  = process.env.AIRTABLE_BASE_ID
  const table   = process.env.AIRTABLE_MENU || 'Menu'

  const filter = encodeURIComponent(`{Attivo}=TRUE()`)
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${filter}&sort[0][field]=Categoria&sort[0][direction]=asc&sort[1][field]=Sottocategoria&sort[1][direction]=asc&sort[2][field]=Ordine&sort[2][direction]=asc&pageSize=100`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE_AGENDA_S },
    })

    if (!res.ok) {
      console.error(`[menu] Airtable error ${res.status}:`, await res.text())
      return []
    }
    const json = await res.json()
    return json.records || []
  } catch (error) {
    console.error('[menu] Airtable fetch failed:', error)
    return []
  }
}

function filtraCategoria(records: AirtableRecord[], categoria: string): AirtableRecord[] {
  return records.filter(r => String(r.fields['Categoria'] || '') === categoria)
}

function toVoce(r: AirtableRecord): VoceMenu {
  const f = r.fields
  return {
    nome:        String(f['Nome'] || ''),
    descrizione: f['Descrizione'] ? String(f['Descrizione']) : undefined,
    prezzo:      f['Prezzo'] != null ? Number(f['Prezzo']) : null,
    formato:     f['Formato'] ? String(f['Formato']) : undefined,
    prezzo2:     f['Prezzo2'] != null ? Number(f['Prezzo2']) : null,
    formato2:    f['Formato2'] ? String(f['Formato2']) : undefined,
    note:        f['Note'] ? String(f['Note']) : undefined,
    badge:       f['Etichetta'] ? String(f['Etichetta']) : undefined,
    produttore:  f['Produttore'] ? String(f['Produttore']) : undefined,
    regione:     f['Regione'] ? String(f['Regione']) : undefined,
    senzaGlutine:  f['Senza Glutine'] === true,
    senzaLattosio: f['Senza Lattosio'] === true,
  }
}

function raggruppaPerSottocategoria(records: AirtableRecord[]): SezioneMenu[] {
  const map = new Map<string, VoceMenu[]>()
  for (const r of records) {
    const sotto = String(r.fields['Sottocategoria'] || '')
    if (!map.has(sotto)) map.set(sotto, [])
    map.get(sotto)!.push(toVoce(r))
  }
  return Array.from(map.entries()).map(([titolo, voci]) => ({ titolo, voci }))
}

export async function fetchMenuSpecialita(): Promise<SezioneMenu[]> {
  const records = filtraCategoria(await fetchTuttoMenu(), 'Specialità alla Carta')
  return raggruppaPerSottocategoria(records)
}

export async function fetchMenuPizza(): Promise<SezioneMenu[]> {
  const records = filtraCategoria(await fetchTuttoMenu(), 'Pizza')
  if (records.length === 0) return []
  return [{ titolo: 'Le Pizze', voci: records.map(toVoce) }]
}

export async function fetchMenuBirre(): Promise<SezioneMenu[]> {
  const records = filtraCategoria(await fetchTuttoMenu(), 'Birre')
  return raggruppaPerSottocategoria(records)
}

export async function fetchMenuVini(): Promise<SezioneMenu[]> {
  const records = filtraCategoria(await fetchTuttoMenu(), 'Vini')
  return raggruppaPerSottocategoria(records)
}

export async function fetchMenuCocktails(): Promise<SezioneMenu[]> {
  const records = filtraCategoria(await fetchTuttoMenu(), 'Cocktails')
  return raggruppaPerSottocategoria(records)
}
