// netlify/functions/gestisci-blocco-prenotazioni.js

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
  const TABLE            = 'BloccoPrenotazioni';
  const AT_URL           = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`;
  const atHeaders        = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };

  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(`${AT_URL}?sort[0][field]=Data inizio&sort[0][direction]=asc`, { headers: atHeaders });
      if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
      const json = await res.json();
      const blocchi = (json.records || []).map(r => ({
        id:          r.id,
        descrizione: r.fields['Descrizione'] || '',
        dataInizio:  r.fields['Data inizio'] || '',
        dataFine:    r.fields['Data fine'] || '',
        fasce:       Array.isArray(r.fields['Fascia']) ? r.fields['Fascia'] : (r.fields['Fascia'] ? [r.fields['Fascia']] : []),
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, blocchi }) };
    } catch (err) {
      console.error('gestisci-blocco-prenotazioni GET error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let data;
    try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const { descrizione, dataInizio, dataFine, fasce } = data;
    if (!descrizione) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Descrizione obbligatoria' }) };

    const fields = { 'Descrizione': descrizione };
    if (dataInizio) fields['Data inizio'] = dataInizio;
    if (dataFine)   fields['Data fine']   = dataFine;
    if (Array.isArray(fasce) && fasce.length > 0) fields['Fascia'] = fasce;

    const res = await fetch(AT_URL, {
      method: 'POST',
      headers: { ...atHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    const result = await res.json();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok, id: result.id }) };
  }

  if (event.httpMethod === 'PATCH') {
    let data;
    try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const { id, descrizione, dataInizio, dataFine, fasce } = data;
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID mancante' }) };

    const fields = { 'Descrizione': descrizione || '' };
    if (dataInizio) fields['Data inizio'] = dataInizio;
    if (dataFine)   fields['Data fine']   = dataFine;
    fields['Fascia'] = Array.isArray(fasce) && fasce.length > 0 ? fasce : [];

    const res = await fetch(`${AT_URL}/${id}`, {
      method: 'PATCH',
      headers: { ...atHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) };
  }

  if (event.httpMethod === 'DELETE') {
    const { id } = event.queryStringParameters || {};
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'ID mancante' }) };
    const res = await fetch(`${AT_URL}/${id}`, { method: 'DELETE', headers: atHeaders });
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
};
