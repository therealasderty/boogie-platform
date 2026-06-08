exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_MENU    = process.env.AIRTABLE_MENU || 'Menu';
  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MENU)}`;
  const AT_HEADERS = { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };

  if (event.httpMethod === 'GET') {
    try {
      const categoria = event.queryStringParameters?.categoria;
      let url = `${BASE_URL}?pageSize=100&sort[0][field]=Ordine&sort[0][direction]=asc`;
      if (categoria) url += `&filterByFormula=${encodeURIComponent(`{Categoria}="${categoria}"`)}`;
      const res = await fetch(url, { headers: AT_HEADERS });
      if (!res.ok) {
        const errText = await res.text();
        console.error('[gestisci-menu] GET Airtable error', res.status, errText);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, debug: errText }) };
      }
      const json = await res.json();
      const piatti = (json.records || []).map(r => ({
        id:            r.id,
        nome:          r.fields['Nome'] || '',
        descrizione:   r.fields['Descrizione'] || '',
        prezzo:        r.fields['Prezzo'] ?? null,
        formato:       r.fields['Formato'] || '',
        prezzo2:       r.fields['Prezzo2'] ?? null,
        formato2:      r.fields['Formato2'] || '',
        categoria:     r.fields['Categoria'] || '',
        sottocategoria: r.fields['Sottocategoria'] || '',
        attivo:        r.fields['Attivo'] || false,
        ordine:        r.fields['Ordine'] ?? 0,
        note:          r.fields['Note'] || '',
        etichetta:     r.fields['Etichetta'] || '',
        produttore:    r.fields['Produttore'] || '',
        regione:       r.fields['Regione'] || '',
        allergeni:     r.fields['Allergeni'] || '',
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, piatti }) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    }
  }

  try {
    // DELETE
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID mancante' }) };
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE', headers: AT_HEADERS });
      const json = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify({ success: !!json.deleted }) };
    }

    const body = JSON.parse(event.body || '{}');

    const toFields = (d) => {
      const fields = {
        'Nome':           d.nome,
        'Descrizione':    d.descrizione,
        'Prezzo':         d.prezzo !== '' ? Number(d.prezzo) : null,
        'Formato':        d.formato,
        'Prezzo2':        d.prezzo2 !== '' && d.prezzo2 != null ? Number(d.prezzo2) : null,
        'Formato2':       d.formato2,
        'Categoria':      d.categoria,
        'Sottocategoria': d.sottocategoria,
        'Attivo':         !!d.attivo,
        'Ordine':         Number(d.ordine) || 0,
        'Note':           d.note,
        'Etichetta':      d.etichetta,
        'Produttore':     d.produttore || '',
        'Regione':        d.regione || '',
        'Allergeni':      Array.isArray(d.allergeni) ? d.allergeni.join(',') : (d.allergeni || ''),
      }
      return fields
    }

    // PATCH (aggiorna)
    if (event.httpMethod === 'PATCH') {
      const { id, ...dati } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID mancante' }) };
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields: toFields(dati), typecast: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('[gestisci-menu] PATCH error:', JSON.stringify(json))
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, debug: json }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: !!json.id, id: json.id }) };
    }

    // POST (crea)
    if (event.httpMethod === 'POST') {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: AT_HEADERS,
        body: JSON.stringify({ fields: toFields(body), typecast: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('[gestisci-menu] POST error:', JSON.stringify(json))
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, debug: json }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: !!json.id, id: json.id }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ success: false }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
