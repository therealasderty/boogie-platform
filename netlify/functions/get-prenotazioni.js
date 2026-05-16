// netlify/functions/get-prenotazioni.js
// ?tipo=lista (default) | attesa | giornaliere

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
  const AIRTABLE_TABLE   = process.env.AIRTABLE_TABLE || 'Prenotazioni';
  const AT_BASE = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  const AT_HEADERS = { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` };

  const tipo = event.queryStringParameters?.tipo || 'lista';

  try {
    // --- ATTESA ---
    if (tipo === 'attesa') {
      const filterFormula = encodeURIComponent(`{Stato}="In attesa"`);
      const res = await fetch(
        `${AT_BASE}?filterByFormula=${filterFormula}&sort[0][field]=Data&sort[0][direction]=asc&fields[]=Nome&fields[]=Data&fields[]=Ora&fields[]=Persone&fields[]=Email&fields[]=Telefono&fields[]=Note`,
        { headers: AT_HEADERS }
      );
      if (!res.ok) return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
      const json = await res.json();
      const prenotazioni = (json.records || []).map(r => ({
        id:       r.id,
        nome:     r.fields['Nome'] || '',
        data:     r.fields['Data'] || '',
        ora:      r.fields['Ora'] || '',
        persone:  r.fields['Persone'] || 0,
        email:    r.fields['Email'] || '',
        telefono: r.fields['Telefono'] || '',
        note:     r.fields['Note'] || '',
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, prenotazioni }) };
    }

    // --- GIORNALIERE ---
    if (tipo === 'giornaliere') {
      const oggiStr = new Date().toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
      const [y, m, d] = oggiStr.split('-').map(Number);
      const giorni = [0, 1, 2].map(offset => {
        const date = new Date(y, m - 1, d + offset);
        return date.toLocaleDateString('sv');
      });
      const [dataInizio, dataFine] = [giorni[0], giorni[2]];
      const formula = encodeURIComponent(
        `AND(DATETIME_FORMAT({Data},'YYYY-MM-DD') >= "${dataInizio}", DATETIME_FORMAT({Data},'YYYY-MM-DD') <= "${dataFine}", {Stato} != "Cancellata")`
      );
      const fields = ['Nome','Data','Ora','Persone','Stato','Note','Telefono','Preferenza','Evento']
        .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
      const res = await fetch(
        `${AT_BASE}?filterByFormula=${formula}&${fields}&sort[0][field]=Data&sort[0][direction]=asc&sort[1][field]=Ora&sort[1][direction]=asc`,
        { headers: AT_HEADERS }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const prenotazioni = (json.records || []).map(r => ({
        id:         r.id,
        nome:       r.fields.Nome || '',
        data:       r.fields.Data,
        ora:        r.fields.Ora || '',
        persone:    parseInt(r.fields.Persone) || 0,
        stato:      r.fields.Stato || '',
        note:       r.fields.Note || '',
        telefono:   r.fields.Telefono || '',
        preferenza: r.fields.Preferenza || '',
        evento:     r.fields.Evento || '',
      }));
      const perGiorno = giorni.map(data => {
        const pren = prenotazioni.filter(p => p.data === data);
        const totPersone = pren.reduce((s, p) => s + p.persone, 0);
        const pizza  = pren.filter(p => p.preferenza?.includes('Pizza')).length;
        const cucina = pren.filter(p => p.preferenza?.includes('Cucina')).length;
        return { data, prenotazioni: pren, totPrenotazioni: pren.length, totPersone, pizza, cucina };
      });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, giorni: perGiorno }) };
    }

    // --- LISTA (default) ---
    let allRecords = [];
    let offset = null;
    do {
      const url = new URL(AT_BASE);
      url.searchParams.set('fields[]', 'Nome');
      url.searchParams.append('fields[]', 'Data');
      url.searchParams.append('fields[]', 'Ora');
      url.searchParams.append('fields[]', 'Persone');
      url.searchParams.append('fields[]', 'Stato');
      url.searchParams.append('fields[]', 'Note');
      url.searchParams.append('fields[]', 'Telefono');
      url.searchParams.append('fields[]', 'Evento');
      url.searchParams.set('filterByFormula', "NOT({Stato}='Cancellata')");
      if (offset) url.searchParams.set('offset', offset);
      const res = await fetch(url.toString(), { headers: AT_HEADERS });
      if (!res.ok) {
        const err = await res.text();
        console.error('Airtable error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
      }
      const json = await res.json();
      allRecords = [...allRecords, ...(json.records || [])];
      offset = json.offset;
    } while (offset);

    const prenotazioni = allRecords
      .filter(r => r.fields.Data && r.fields.Ora)
      .map(r => ({
        id:       r.id,
        nome:     r.fields.Nome || '',
        data:     r.fields.Data,
        ora:      r.fields.Ora,
        persone:  r.fields.Persone || 0,
        stato:    r.fields.Stato || '',
        note:     r.fields.Note || '',
        telefono: r.fields.Telefono || '',
        evento:   r.fields.Evento || '',
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, prenotazioni }) };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};
