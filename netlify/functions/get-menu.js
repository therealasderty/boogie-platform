exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_MENU    = process.env.AIRTABLE_MENU || 'Menu';

  const categoria = event.queryStringParameters?.categoria;

  try {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MENU)}?pageSize=100&sort[0][field]=Ordine&sort[0][direction]=asc`;
    if (categoria) url += `&filterByFormula=${encodeURIComponent(`{Categoria}="${categoria}"`)}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    if (!res.ok) {
      const errText = await res.text()
      console.error('[get-menu] Airtable error', res.status, errText)
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, debug: errText }) };
    }

    const json = await res.json();
    const piatti = (json.records || []).map(r => ({
      id:           r.id,
      nome:         r.fields['Nome'] || '',
      descrizione:  r.fields['Descrizione'] || '',
      prezzo:       r.fields['Prezzo'] ?? null,
      formato:      r.fields['Formato'] || '',
      prezzo2:      r.fields['Prezzo2'] ?? null,
      formato2:     r.fields['Formato2'] || '',
      categoria:    r.fields['Categoria'] || '',
      sottocategoria: r.fields['Sottocategoria'] || '',
      attivo:       r.fields['Attivo'] || false,
      senzaGlutine:  r.fields['Senza Glutine'] || false,
      senzaLattosio: r.fields['Senza Lattosio'] || false,
      ordine:       r.fields['Ordine'] ?? 0,
      note:         r.fields['Note'] || '',
      etichetta:    r.fields['Etichetta'] || '',
      produttore:   r.fields['Produttore'] || '',
      regione:      r.fields['Regione'] || '',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, piatti }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};
