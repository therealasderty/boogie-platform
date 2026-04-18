// netlify/functions/gestisci-faq.js

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, PATCH, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_FAQ     = process.env.AIRTABLE_FAQ || 'FAQ';
  const AT_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_FAQ)}`;
  const atHeaders = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' };

  if (event.httpMethod === 'DELETE') {
    const { id } = event.queryStringParameters || {};
    if (!id) return { statusCode: 400, headers, body: 'ID mancante' };
    const res = await fetch(`${AT_URL}/${id}`, { method: 'DELETE', headers: atHeaders });
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) };
  }

  let data;
  try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { id, domanda, risposta, ordine, attivo } = data;
  if (!domanda) return { statusCode: 400, headers, body: 'Domanda obbligatoria' };

  const fields = {
    'Domanda':  domanda,
    'Risposta': risposta || '',
    'Ordine':   ordine ?? 0,
    'Attivo':   attivo !== false,
  };

  if (event.httpMethod === 'PATCH') {
    if (!id) return { statusCode: 400, headers, body: 'ID mancante' };
    const res = await fetch(`${AT_URL}/${id}`, {
      method: 'PATCH',
      headers: atHeaders,
      body: JSON.stringify({ fields }),
    });
    const result = await res.json();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok, id: result.id }) };
  }

  if (event.httpMethod === 'POST') {
    const res = await fetch(AT_URL, {
      method: 'POST',
      headers: atHeaders,
      body: JSON.stringify({ fields }),
    });
    const result = await res.json();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok, id: result.id }) };
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
