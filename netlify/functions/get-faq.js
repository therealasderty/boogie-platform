// netlify/functions/get-faq.js

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
  const AIRTABLE_FAQ     = process.env.AIRTABLE_FAQ || 'FAQ';

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_FAQ)}?sort[0][field]=Ordine&sort[0][direction]=asc`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
    );

    if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };

    const json = await res.json();
    const faq = (json.records || []).map(r => ({
      id:       r.id,
      domanda:  r.fields['Domanda'] || '',
      risposta: r.fields['Risposta'] || '',
      ordine:   r.fields['Ordine'] ?? 0,
      attivo:   r.fields['Attivo'] !== false,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, faq }) };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};
