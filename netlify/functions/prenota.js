// netlify/functions/prenota.js

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase().replace(/,/g, '.');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const { isRateLimited, clientIp } = require('./rate-limit');
  if (await isRateLimited('prenota', clientIp(event))) {
    return { statusCode: 429, headers, body: 'Troppe richieste. Riprova tra qualche minuto.' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: 'Invalid JSON' };
  }

  const { nome, data: dataPrenotazione, ora, persone, email: emailRaw, telefono, consenso_privacy } = data;
  const email = normalizeEmail(emailRaw);

  if (!nome || !dataPrenotazione || !ora || !persone || !email || !telefono || !consenso_privacy) {
    return { statusCode: 400, headers, body: 'Campi obbligatori mancanti' };
  }

  if (!isValidEmail(email)) {
    return { statusCode: 400, headers, body: 'Indirizzo email non valido' };
  }

  // Entrambi gli indirizzi pubblici passano dalla stessa verifica atomica della capienza.
  try {
    const url = new URL('/api/prenota', process.env.SITO_URL || 'https://boogiebistrot.com')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': clientIp(event) },
      body: JSON.stringify({ ...data, email }),
    })
    return { statusCode: res.status, headers, body: await res.text() }
  } catch {
    return { statusCode: 503, headers, body: JSON.stringify({ success: false, error: 'disponibilita_non_verificabile' }) }
  }
}
