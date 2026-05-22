// netlify/functions/gestisci-configurazione.js
// Auth — GET legge tutte le config, PATCH aggiorna una voce per chiave

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = 'Configurazione';
  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`;
  const AT_HEADERS = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };

  // ── GET — restituisce tutte le config ────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(BASE_URL, { headers: AT_HEADERS });
      if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
      const json = await res.json();
      const config = {};
      const ids = {};
      for (const record of (json.records || [])) {
        const chiave = record.fields['Chiave'];
        const valore = record.fields['Valore'];
        if (chiave) { config[chiave] = valore ?? ''; ids[chiave] = record.id; }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, config, ids }) };
    } catch (err) {
      console.error('gestisci-configurazione GET error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    }
  }

  // ── PATCH — aggiorna o crea una voce ────────────────────────────
  if (event.httpMethod === 'PATCH') {
    let body;
    try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const { chiave, valore, id } = body;
    if (!chiave) return { statusCode: 400, headers, body: 'Chiave mancante' };

    try {
      let res;
      if (id) {
        // Aggiorna record esistente
        res = await fetch(`${BASE_URL}/${id}`, {
          method: 'PATCH',
          headers: AT_HEADERS,
          body: JSON.stringify({ fields: { 'Chiave': chiave, 'Valore': String(valore ?? '') } }),
        });
      } else {
        // Crea nuovo record
        res = await fetch(BASE_URL, {
          method: 'POST',
          headers: AT_HEADERS,
          body: JSON.stringify({ fields: { 'Chiave': chiave, 'Valore': String(valore ?? '') } }),
        });
      }
      const result = await res.json();
      return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok, id: result.id }) };
    } catch (err) {
      console.error('gestisci-configurazione PATCH error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
