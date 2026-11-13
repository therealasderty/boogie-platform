#!/usr/bin/env node
/**
 * Script per aggiornare il menu Specialità alla Carta su Airtable.
 * 1. Disattiva tutti i piatti attuali di "Specialità alla Carta"
 * 2. Crea i nuovi piatti del menu invernale
 *
 * Uso: node scripts/aggiorna-menu-inverno.mjs
 * Richiede: .env con AIRTABLE_TOKEN e AIRTABLE_BASE_ID
 */
import { readFileSync } from 'fs';
// Parse .env manually (no dotenv dependency)
const envContent = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = 'Menu';
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// --- NUOVO MENU ---
const nuovoMenu = [
  // ANTIPASTI
  {
    nome: 'Polpo arrostito su crostoni di polenta, cavolo nero e le sue chips',
    prezzo: 20,
    allergeni: '4,7,14',
    sottocategoria: 'Antipasti',
    ordine: 1,
  },
  {
    nome: 'Sarde impanate con maionese al lime',
    prezzo: 14,
    allergeni: '1,3,4,5,6,8,10',
    note: 'da condividere',
    sottocategoria: 'Antipasti',
    ordine: 2,
  },
  {
    nome: 'Affettato del territorio con gnocco fritto e Casera',
    prezzo: 18,
    allergeni: '1,5,6,7,10',
    note: 'da condividere',
    sottocategoria: 'Antipasti',
    ordine: 3,
  },
  {
    nome: 'Sciatt del Boogie e bresaola',
    prezzo: 15,
    allergeni: '1,5,6,7,10',
    note: 'da condividere',
    sottocategoria: 'Antipasti',
    ordine: 4,
  },
  {
    nome: 'Flan ai funghi con fonduta al parmigiano e porcini trifolati',
    prezzo: 12,
    allergeni: '3,7',
    sottocategoria: 'Antipasti',
    ordine: 5,
  },

  // PRIMI
  {
    nome: 'Risotto alla parmigiana con filetti di pesce persico panato',
    prezzo: 21,
    allergeni: '1,3,4,6,7,8,9,10',
    sottocategoria: 'Primi',
    ordine: 6,
  },
  {
    nome: 'Gnocchetti al nero di seppia con rana pescatrice, datterini e crumble profumato al limone',
    prezzo: 17,
    allergeni: '1,2,3,4,7,9,10,14',
    sottocategoria: 'Primi',
    ordine: 7,
  },
  {
    nome: 'Tagliatelle ai mirtilli con ragù di cervo',
    prezzo: 18,
    allergeni: '1,2,3,4,6,7,8,9,10,11,14',
    sottocategoria: 'Primi',
    ordine: 8,
  },
  {
    nome: 'Risotto zucca, zola e amaretti',
    prezzo: 14,
    allergeni: '1,3,5,7,8,12',
    sottocategoria: 'Primi',
    ordine: 9,
  },
  {
    nome: 'Carbonara al tartufo',
    prezzo: 23,
    allergeni: '1,3,9',
    sottocategoria: 'Primi',
    ordine: 10,
  },

  // SECONDI
  {
    nome: 'Filetto di trota salmonata con panure di uvetta e pinoli, in crema di carota allo zenzero',
    prezzo: 15,
    allergeni: '1,2,3,4,5,6,8,9,10,11,14',
    sottocategoria: 'Secondi',
    ordine: 11,
  },
  {
    nome: 'Gran fritto di paranza',
    descrizione: 'Calamari, gamberi, ciuffetti, triglie, sogliole, merluzzo, gobbetti, carote e zucchine',
    prezzo: 23,
    allergeni: '1,2,4,5,6,8,10,14',
    sottocategoria: 'Secondi',
    ordine: 12,
  },
  {
    nome: 'Tagliata su crema di carciofi e patate al forno',
    prezzo: 23,
    allergeni: '7',
    sottocategoria: 'Secondi',
    ordine: 13,
  },
  {
    nome: 'Punta di vitello al forno con scarola ripassata',
    prezzo: 19,
    allergeni: '5,6,8,9,10,11',
    sottocategoria: 'Secondi',
    ordine: 14,
  },
  {
    nome: 'Ossobuco di maiale con purè di patate',
    prezzo: 18,
    allergeni: '1,7,9',
    sottocategoria: 'Secondi',
    ordine: 15,
  },

  // DOLCI (tutti €7)
  {
    nome: 'Brownie al cioccolato con mousse al caramello salato',
    prezzo: 7,
    allergeni: '1,3,5,6,7,8,10',
    sottocategoria: 'Dolci',
    ordine: 16,
  },
  {
    nome: 'Cioccolata calda fondente marshmallow e frollini',
    prezzo: 7,
    allergeni: '1,3,7', // ⚠️ DA VERIFICARE
    sottocategoria: 'Dolci',
    ordine: 17,
  },
  {
    nome: 'Tortino tiepido di mele e cannella con gelato al fior di latte',
    prezzo: 7,
    allergeni: '3,7',
    sottocategoria: 'Dolci',
    ordine: 18,
  },
  {
    nome: 'Tiramisù',
    prezzo: 7,
    allergeni: '1,3,6,7,8',
    sottocategoria: 'Dolci',
    ordine: 19,
  },
  {
    nome: 'Cannoli siciliani ripieni di ricotta di pecora, pistacchi e frutta candita',
    prezzo: 7,
    allergeni: '1,3,5,6,7,8',
    sottocategoria: 'Dolci',
    ordine: 20,
  },
  {
    nome: 'Dolce del giorno',
    prezzo: 7,
    allergeni: '',
    sottocategoria: 'Dolci',
    ordine: 21,
  },
];

// --- HELPERS ---

async function fetchAllRecords(filterFormula) {
  const records = [];
  let offset = null;
  do {
    let url = `${BASE_URL}?pageSize=100&filterByFormula=${encodeURIComponent(filterFormula)}`;
    if (offset) url += `&offset=${offset}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`GET failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    records.push(...(json.records || []));
    offset = json.offset;
  } while (offset);
  return records;
}

async function batchUpdate(records) {
  // Airtable batch: max 10 records per request
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const res = await fetch(BASE_URL, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ records: batch, typecast: true }),
    });
    if (!res.ok) throw new Error(`PATCH batch failed: ${res.status} ${await res.text()}`);
    console.log(`  Disattivati ${Math.min(i + 10, records.length)}/${records.length}`);
  }
}

async function batchCreate(items) {
  const records = items.map(item => ({
    fields: {
      Nome: item.nome,
      Descrizione: item.descrizione || '',
      Prezzo: item.prezzo,
      Categoria: 'Specialità alla Carta',
      Sottocategoria: item.sottocategoria,
      Attivo: true,
      Ordine: item.ordine,
      Note: item.note || '',
      Allergeni: item.allergeni,
    },
  }));

  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ records: batch, typecast: true }),
    });
    if (!res.ok) throw new Error(`POST batch failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    console.log(`  Creati ${Math.min(i + 10, records.length)}/${records.length}`);
  }
}

// --- MAIN ---
async function main() {
  console.log('=== Aggiornamento menu Specialità alla Carta ===\n');

  // 1. Fetch piatti attuali attivi
  console.log('1. Recupero piatti attuali...');
  const current = await fetchAllRecords(`AND({Categoria}="Specialità alla Carta", {Attivo}=TRUE())`);
  console.log(`   Trovati ${current.length} piatti attivi\n`);

  // 2. Disattiva tutti
  if (current.length > 0) {
    console.log('2. Disattivo piatti vecchi...');
    const updates = current.map(r => ({
      id: r.id,
      fields: { Attivo: false },
    }));
    await batchUpdate(updates);
    console.log('   ✓ Piatti vecchi disattivati\n');
  } else {
    console.log('2. Nessun piatto da disattivare\n');
  }

  // 3. Crea nuovi piatti
  console.log('3. Creo nuovi piatti...');
  await batchCreate(nuovoMenu);
  console.log('   ✓ Nuovi piatti creati\n');

  // Warn about missing allergens
  const missing = nuovoMenu.filter(p => p.allergeni === '' && p.nome !== 'Dolce del giorno');
  if (missing.length > 0) {
    console.log('⚠️  ATTENZIONE: allergeni mancanti per:');
    missing.forEach(p => console.log(`   - ${p.nome}`));
    console.log('   Aggiornali dalla dashboard!\n');
  }

  console.log('=== FATTO ===');
}

main().catch(err => {
  console.error('ERRORE:', err.message);
  process.exit(1);
});
