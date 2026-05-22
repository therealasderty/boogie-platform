// netlify/functions/get-configurazione.js
// Pubblica — restituisce le impostazioni come { chiave: valore }

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const AIRTABLE_TOKEN   = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = 'Configurazione';

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE)}`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };

    const json = await res.json();
    const config = {};
    for (const record of (json.records || [])) {
      const chiave = record.fields['Chiave'];
      const valore = record.fields['Valore'];
      if (chiave) config[chiave] = valore ?? '';
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, config }) };
  } catch (err) {
    console.error('get-configurazione error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};
