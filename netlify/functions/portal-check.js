// netlify/functions/portal-check.js
// GET — verifica cookie boogie_guest e restituisce { returning, name, visits }

const crypto = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID  = process.env.AIRTABLE_BASE_ID;
  const PORTAL_COOKIE_SECRET = process.env.PORTAL_COOKIE_SECRET;

  if (!PORTAL_COOKIE_SECRET) {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }

  // ── Leggi cookie boogie_guest ──────────────────────────────────────
  const cookieHeader = event.headers['cookie'] || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)boogie_guest=([^;]+)/);
  if (!cookieMatch) {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(decodeURIComponent(cookieMatch[1]), 'base64').toString('utf8'));
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }

  const { h: storedHash, e: email } = payload || {};
  if (!storedHash || !email) {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }

  // ── Verifica HMAC ──────────────────────────────────────────────────
  const expectedHash = crypto
    .createHmac('sha256', PORTAL_COOKIE_SECRET)
    .update(email)
    .digest('hex');

  if (storedHash !== expectedHash) {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }

  // ── Cerca su Airtable ──────────────────────────────────────────────
  try {
    const filter = encodeURIComponent(`{Email} = '${email.replace(/'/g, "\\'")}'`);
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti?filterByFormula=${filter}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );

    if (!res.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
    }

    const data = await res.json();
    const record = data.records?.[0];

    if (!record) {
      return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        returning: true,
        name: record.fields['Nome'] || '',
        visits: record.fields['Contatore visite'] || 1,
      }),
    };
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ returning: false }) };
  }
};
