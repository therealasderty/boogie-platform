// netlify/functions/portal-submit.js
// POST — salva dati cliente, sincronizza Brevo, autorizza su Omada Cloud, imposta cookie
// OMADA_CONTROLLER_URL deve puntare al cloud controller (es. https://euw1-omada-cloud.tplinkcloud.com)
// NON usare IP locale — le Netlify Functions non raggiungono la LAN del ristorante.

const crypto = require('crypto');

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
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const AIRTABLE_TOKEN       = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID     = process.env.AIRTABLE_BASE_ID;
  const BREVO_API_KEY        = process.env.BREVO_API_KEY;
  const BREVO_WIFI_LIST_ID   = parseInt(process.env.BREVO_WIFI_LIST_ID) || 0;
  const BREVO_DOI_TEMPLATE   = parseInt(process.env.BREVO_DOI_TEMPLATE_ID) || 0;
  const OMADA_CONTROLLER_URL = process.env.OMADA_CONTROLLER_URL;   // es. https://192.168.1.X:8043
  const OMADA_CONTROLLER_ID  = process.env.OMADA_CONTROLLER_ID;
  const OMADA_OPERATOR_USER  = process.env.OMADA_OPERATOR_USERNAME;
  const OMADA_OPERATOR_PASS  = process.env.OMADA_OPERATOR_PASSWORD;
  const PORTAL_COOKIE_SECRET = process.env.PORTAL_COOKIE_SECRET;

  // ── Parse body ──────────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const {
    returning, nome, email: rawEmail, consenso,
    clientMac, apMac, ssidName, radioId, site, redirectUrl,
  } = body;

  const isReturning = returning === true;

  // ── Validazione (solo per nuovi utenti) ───────────────────────────
  let resolvedEmail = '';
  let resolvedName  = '';

  if (!isReturning) {
    if (!rawEmail || !nome) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nome e email obbligatori.' }) };
    }
    resolvedEmail = normalizeEmail(rawEmail);
    resolvedName  = String(nome).trim();
    if (!isValidEmail(resolvedEmail)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email non valida.' }) };
    }
    if (!resolvedName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nome non valido.' }) };
    }
  } else {
    // Per il ritorno leggiamo email dal cookie
    const cookieHeader = event.headers['cookie'] || '';
    const cookieMatch  = cookieHeader.match(/(?:^|;\s*)boogie_guest=([^;]+)/);
    if (!cookieMatch) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Cookie non trovato.' }) };
    }
    try {
      const payload = JSON.parse(Buffer.from(decodeURIComponent(cookieMatch[1]), 'base64').toString('utf8'));
      const expectedHash = crypto
        .createHmac('sha256', PORTAL_COOKIE_SECRET)
        .update(payload.e)
        .digest('hex');
      if (payload.h !== expectedHash) throw new Error('hash mismatch');
      resolvedEmail = payload.e;
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Cookie non valido.' }) };
    }
  }

  const now = new Date().toISOString();

  // ── Cerca record Airtable ──────────────────────────────────────────
  const filter = encodeURIComponent(`{Email} = '${resolvedEmail.replace(/'/g, "\\'")}'`);
  const searchRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti?filterByFormula=${filter}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
  );

  if (!searchRes.ok) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Errore database. Riprova.' }) };
  }

  const searchData = await searchRes.json();
  const existing   = searchData.records?.[0];

  let airtableRecordId = null;
  let visitCount = 1;

  // Aggiorna lista MAC (iOS/Android usano MAC randomizzati ma li salviamo comunque)
  function mergeMacs(current, newMac) {
    if (!newMac) return current || '';
    const list = (current || '').split(',').map(m => m.trim()).filter(Boolean);
    if (!list.includes(newMac)) list.push(newMac);
    return list.join(', ');
  }

  if (existing) {
    // ── Aggiorna record esistente ────────────────────────────────────
    airtableRecordId = existing.id;
    resolvedName     = resolvedName || existing.fields['Nome'] || '';
    visitCount       = (existing.fields['Contatore visite'] || 0) + 1;

    const macList = mergeMacs(existing.fields['MAC addresses'], clientMac);

    const patchFields = {
      'Ultima visita':      now,
      'Contatore visite':   visitCount,
      'MAC addresses':      macList,
    };
    // Aggiorna il consenso solo se è stato esplicitamente concesso ora
    if (!isReturning && consenso && !existing.fields['Consenso marketing']) {
      patchFields['Consenso marketing']  = true;
      patchFields['Consenso timestamp']  = now;
    }

    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti/${airtableRecordId}`,
      {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields: patchFields }),
      }
    );
  } else {
    // ── Crea nuovo record ────────────────────────────────────────────
    const createFields = {
      'Email':              resolvedEmail,
      'Nome':               resolvedName,
      'Prima visita':       now,
      'Ultima visita':      now,
      'Contatore visite':   1,
      'Consenso marketing': consenso === true,
      'Fonte':              'WiFi Portal',
      'MAC addresses':      clientMac || '',
    };
    if (consenso) createFields['Consenso timestamp'] = now;

    const createRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fields: createFields }),
      }
    );
    const createData = await createRes.json();
    airtableRecordId = createData.id;
  }

  // ── Brevo ──────────────────────────────────────────────────────────
  if (BREVO_API_KEY) {
    const brevoAttrs = {
      NOME:              resolvedName,
      LAST_WIFI_VISIT:   now,
      WIFI_VISIT_COUNT:  visitCount,
    };

    if (!isReturning && consenso && BREVO_WIFI_LIST_ID && BREVO_DOI_TEMPLATE && !existing) {
      // Nuovo utente con consenso → Double Opt-In
      await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
        method:  'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:          resolvedEmail,
          attributes:     brevoAttrs,
          includeListIds: [BREVO_WIFI_LIST_ID],
          templateId:     BREVO_DOI_TEMPLATE,
          redirectionUrl: 'https://boogiebistrot.it',
        }),
      }).catch(() => {}); // non blocchiamo il flusso se Brevo fallisce
    } else {
      // Tutti gli altri casi → upsert base (aggiorna attributi senza aggiungere a lista)
      await fetch('https://api.brevo.com/v3/contacts', {
        method:  'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:         resolvedEmail,
          updateEnabled: true,
          attributes:    brevoAttrs,
        }),
      }).catch(() => {});
    }
  }

  // ── Autorizzazione Omada via Cloud API ────────────────────────────
  // OMADA_CONTROLLER_URL = es. https://euw1-omada-cloud.tplinkcloud.com
  // Il cloud controller espone le stesse API v2 del controller locale ma con SSL valido
  // e raggiungibile da Netlify (nessun IP locale).
  if (OMADA_CONTROLLER_URL && OMADA_CONTROLLER_ID && clientMac) {
    try {
      // Step 1: Login come Hotspot Operator
      const loginUrl = `${OMADA_CONTROLLER_URL}/${OMADA_CONTROLLER_ID}/api/v2/hotspot/login`;
      console.log('[Omada] login URL:', loginUrl);

      const loginRes = await fetch(loginUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: OMADA_OPERATOR_USER, password: OMADA_OPERATOR_PASS }),
      });

      const loginBody = await loginRes.text();
      console.log('[Omada] login status:', loginRes.status, 'body:', loginBody);

      if (loginRes.ok) {
        const loginData     = JSON.parse(loginBody);
        const csrfToken     = loginData?.result?.token;
        const sessionCookie = loginRes.headers.get('set-cookie') || '';

        console.log('[Omada] csrfToken:', csrfToken ? 'OK' : 'MISSING');

        // Step 2: Autorizza MAC dispositivo (8 ore = 28800000 ms)
        if (csrfToken) {
          const authRes = await fetch(
            `${OMADA_CONTROLLER_URL}/${OMADA_CONTROLLER_ID}/api/v2/hotspot/extPortal/auth`,
            {
              method:  'POST',
              headers: {
                'Content-Type': 'application/json',
                'Csrf-Token':   csrfToken,
                'Cookie':       sessionCookie,
              },
              body: JSON.stringify({
                clientMac,
                apMac,
                ssidName,
                radioId:  radioId ? parseInt(radioId) : 1,
                site:     site || '',
                time:     28800000,
                authType: 4,
              }),
            }
          );
          const authBody = await authRes.text();
          console.log('[Omada] auth status:', authRes.status, 'body:', authBody);
        }
      }
    } catch (err) {
      console.error('[Omada] errore:', err?.message || err);
      // Auth Omada non blocca il flusso principale (Airtable/Brevo già salvati)
    }
  }

  // ── Cookie boogie_guest ────────────────────────────────────────────
  let setCookieHeader = '';
  if (PORTAL_COOKIE_SECRET) {
    const emailHash = crypto
      .createHmac('sha256', PORTAL_COOKIE_SECRET)
      .update(resolvedEmail)
      .digest('hex');

    const cookieValue = encodeURIComponent(
      Buffer.from(JSON.stringify({ h: emailHash, e: resolvedEmail })).toString('base64')
    );

    const maxAge = 60 * 60 * 24 * 90; // 90 giorni
    setCookieHeader = `boogie_guest=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
  }

  return {
    statusCode: 200,
    headers: {
      ...headers,
      ...(setCookieHeader ? { 'Set-Cookie': setCookieHeader } : {}),
    },
    body: JSON.stringify({
      success:     true,
      name:        resolvedName,
      redirectUrl: redirectUrl || 'https://boogiebistrot.it',
    }),
  };
};
