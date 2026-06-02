// netlify/functions/gestisci-chiusure.js

async function revalidaChiusure() {
  const sitoUrl = process.env.SITO_URL || 'https://boogiebistrot.com';
  const secret  = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  try {
    await fetch(`${sitoUrl}/api/revalidate?tag=chiusure&secret=${secret}`, { method: 'POST' });
  } catch {
    // fire-and-forget, non blocca la risposta
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const { verifyToken } = require('./verifyToken');
  if (!verifyToken(event)) return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Non autorizzato' }) };

  const AIRTABLE_TOKEN    = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID  = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_CHIUSURE = process.env.AIRTABLE_CHIUSURE || 'Chiusure';

  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_CHIUSURE)}?sort[0][field]=Tipo&sort[0][direction]=asc`,
        { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
      );
      if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
      const json = await res.json();
      const chiusure = (json.records || []).map(r => ({
        id:           r.id,
        descrizione:  r.fields['Descrizione'] || '',
        tipo:         r.fields['Tipo'] || '',
        tipoApertura: r.fields['Tipo apertura'] || 'Chiusura',
        giorno:       r.fields['Giorno'] !== undefined ? r.fields['Giorno'] : null,
        dataInizio:   r.fields['Data inizio'] || '',
        dataFine:     r.fields['Data fine'] || '',
        fasce:        Array.isArray(r.fields['Fascia']) ? r.fields['Fascia'] : (r.fields['Fascia'] ? [r.fields['Fascia']] : []),
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, chiusure }) };
    } catch (err) {
      console.error('Error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
    }
  }

  if (event.httpMethod === 'DELETE') {
    const { id } = event.queryStringParameters || {};
    if (!id) return { statusCode: 400, headers, body: 'ID mancante' };
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_CHIUSURE)}/${id}`,
      { method: 'DELETE', headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (res.ok) await revalidaChiusure();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) };
  }

  if (event.httpMethod === 'POST') {
    let data;
    try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const { descrizione, tipo, tipoApertura, giorno, dataInizio, dataFine, fasce } = data;
    if (!tipo) return { statusCode: 400, headers, body: 'Tipo obbligatorio' };

    const fields = {
      'Descrizione':   descrizione || '',
      'Tipo':          tipo,
      'Tipo apertura': tipoApertura || 'Chiusura',
    };

    if (tipo === 'Ricorrente' && giorno !== undefined && giorno !== null) fields['Giorno'] = parseInt(giorno);
    if (tipo === 'Data specifica') {
      if (dataInizio) fields['Data inizio'] = dataInizio;
      if (dataFine)   fields['Data fine']   = dataFine;
    }
    if (Array.isArray(fasce) && fasce.length > 0) fields['Fascia'] = fasce;

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_CHIUSURE)}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
    const result = await res.json();
    if (res.ok) await revalidaChiusure();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok, id: result.id }) };
  }

  if (event.httpMethod === 'PATCH') {
    let data;
    try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

    const { id, descrizione, tipo, tipoApertura, giorno, dataInizio, dataFine, fasce } = data;
    if (!id) return { statusCode: 400, headers, body: 'ID mancante' };

    const fields = {
      'Descrizione':   descrizione || '',
      'Tipo apertura': tipoApertura || 'Chiusura',
    };

    if (tipo) fields['Tipo'] = tipo;
    if (tipo === 'Ricorrente' && giorno !== undefined && giorno !== null) fields['Giorno'] = parseInt(giorno);
    if (dataInizio) fields['Data inizio'] = dataInizio;
    if (dataFine)   fields['Data fine']   = dataFine;
    fields['Fascia'] = Array.isArray(fasce) && fasce.length > 0 ? fasce : [];

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_CHIUSURE)}/${id}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
    if (res.ok) await revalidaChiusure();
    return { statusCode: res.ok ? 200 : 500, headers, body: JSON.stringify({ success: res.ok }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
};
