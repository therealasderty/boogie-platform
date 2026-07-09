// netlify/functions/portal-submit.js
// POST — salva dati cliente, sincronizza Brevo, autorizza su Omada Cloud API, imposta cookie
//
// SSID "Boogie Clienti" è di tipo Gateway (ER706W), parametri Omada:
//   clientMac, gatewayMac, vid, t, site, redirectUrl
//
// Omada API (OC200 con Cloud Access, metodo legacy Operator):
//   Base: https://euw1-api-omada-controller.tplinkcloud.com  (NON euw1-omada-cloud)
//   1. POST /{omadacId}/api/v2/hotspot/login  → CSRF token + cookie TPOMADA_SESSIONID
//   2. POST /{omadacId}/api/v2/hotspot/extPortal/auth  → autorizza MAC cliente

const crypto = require('crypto');

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase().replace(/,/g, '.');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Autorizza il client MAC sul controller Omada via API cloud (server-to-server).
// Non blocca il flusso se fallisce — il cliente vedrà il redirect comunque,
// ma l'accesso internet dipende dall'esito dell'autorizzazione Omada.
async function omadaAuthorize({ clientMac, gatewayMac, vid, site }) {
  const CONTROLLER_URL  = process.env.OMADA_CONTROLLER_URL; // https://euw1-api-omada-controller.tplinkcloud.com
  const CONTROLLER_ID   = process.env.OMADA_CONTROLLER_ID;  // dc8234c2e5d318455bab0ba38e3cb374
  const OPERATOR_USER   = process.env.OMADA_OPERATOR_USERNAME;
  const OPERATOR_PASS   = process.env.OMADA_OPERATOR_PASSWORD;

  if (!CONTROLLER_URL || !CONTROLLER_ID || !OPERATOR_USER || !OPERATOR_PASS) {
    console.warn('[portal-submit] Omada env vars mancanti — skip autorizzazione');
    return { ok: false, reason: 'env mancanti' };
  }

  const base = `${CONTROLLER_URL}/${CONTROLLER_ID}/api/v2/hotspot`;

  try {
    // ── Step 1: login Operator ────────────────────────────────────────
    const loginRes = await fetch(`${base}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: OPERATOR_USER, password: OPERATOR_PASS }),
    });

    if (!loginRes.ok) {
      console.error('[portal-submit] Omada login HTTP', loginRes.status);
      return { ok: false, reason: `login HTTP ${loginRes.status}` };
    }

    const loginData = await loginRes.json();
    if (loginData.errorCode !== 0) {
      console.error('[portal-submit] Omada login error', loginData.errorCode, loginData.msg);
      return { ok: false, reason: `login errorCode ${loginData.errorCode}` };
    }

    // Estrai CSRF token e cookie di sessione
    const csrfToken = loginData.result?.token || loginData.result?.csrfToken || '';
    const setCookie = loginRes.headers.get('set-cookie') || '';
    const sessionMatch = setCookie.match(/TPOMADA_SESSIONID=([^;]+)/);
    const sessionCookie = sessionMatch ? `TPOMADA_SESSIONID=${sessionMatch[1]}` : '';

    // ── Step 2: autorizza MAC ─────────────────────────────────────────
    // time = durata sessione in ms (8 ore)
    const sessionMs = 8 * 60 * 60 * 1000;

    const authBody = {
      clientMac,
      gatewayMac,
      vid:      vid || '',
      site:     site || '',
      time:     String(sessionMs),
      authType: '4',  // external portal
    };

    const authHeaders = { 'Content-Type': 'application/json' };
    if (csrfToken)    authHeaders['Csrf-Token'] = csrfToken;
    if (sessionCookie) authHeaders['Cookie']    = sessionCookie;

    const authRes = await fetch(`${base}/extPortal/auth`, {
      method:  'POST',
      headers: authHeaders,
      body:    JSON.stringify(authBody),
      redirect: 'manual', // la risposta può essere 302
    });

    const authStatus = authRes.status;
    let authData = {};
    try { authData = await authRes.json(); } catch {}

    if (authStatus === 200 && authData.errorCode === 0) {
      console.log('[portal-submit] Omada auth OK');
      return { ok: true };
    }
    if (authStatus === 302) {
      // Alcuni firmware rispondono 302 su successo
      console.log('[portal-submit] Omada auth 302 (OK)');
      return { ok: true };
    }

    console.error('[portal-submit] Omada auth fallita', authStatus, authData);
    return { ok: false, reason: `auth ${authStatus} errorCode ${authData.errorCode}` };

  } catch (err) {
    console.error('[portal-submit] Omada exception', err.message);
    return { ok: false, reason: err.message };
  }
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
  const PORTAL_COOKIE_SECRET = process.env.PORTAL_COOKIE_SECRET;

  // ── Parse body ──────────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const {
    returning, nome, cognome, email: rawEmail, compleanno, consenso,
    clientMac, gatewayMac, vid, t, site, redirectUrl,
  } = body;

  const isReturning = returning === true;

  // ── Validazione (solo per nuovi utenti) ────────────────────────────
  let resolvedEmail   = '';
  let resolvedNome    = '';
  let resolvedCognome = '';

  if (!isReturning) {
    if (!rawEmail || !nome || !cognome) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nome, cognome e email obbligatori.' }) };
    }
    resolvedEmail   = normalizeEmail(rawEmail);
    resolvedNome    = String(nome).trim();
    resolvedCognome = String(cognome).trim();
    if (!isValidEmail(resolvedEmail)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email non valida.' }) };
    }
    if (!resolvedNome) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nome non valido.' }) };
    }
    if (!resolvedCognome) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cognome non valido.' }) };
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
  console.log('[portal-submit] Airtable search per:', resolvedEmail, 'base:', AIRTABLE_BASE_ID);
  const searchRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/WiFi_Clienti?filterByFormula=${filter}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    console.error('[portal-submit] Airtable search fallita:', searchRes.status, errText);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Errore database. Riprova.' }) };
  }

  const searchData = await searchRes.json();
  console.log('[portal-submit] Airtable search OK, records trovati:', searchData.records?.length);
  const existing   = searchData.records?.[0];

  let airtableRecordId = null;
  let visitCount = 1;

  function mergeMacs(current, newMac) {
    if (!newMac) return current || '';
    const list = (current || '').split(',').map(m => m.trim()).filter(Boolean);
    if (!list.includes(newMac)) list.push(newMac);
    return list.join(', ');
  }

  if (existing) {
    // ── Aggiorna record esistente ────────────────────────────────────
    airtableRecordId = existing.id;
    resolvedNome     = resolvedNome    || existing.fields['Nome']    || '';
    resolvedCognome  = resolvedCognome || existing.fields['Cognome'] || '';
    visitCount       = (existing.fields['Contatore visite'] || 0) + 1;

    const macList = mergeMacs(existing.fields['MAC addresses'], clientMac);

    const patchFields = {
      'Ultima visita':    now,
      'Contatore visite': visitCount,
      'MAC addresses':    macList,
    };
    if (!isReturning && consenso && !existing.fields['Consenso marketing']) {
      patchFields['Consenso marketing'] = true;
      patchFields['Consenso timestamp'] = now;
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
      'Nome':               resolvedNome,
      'Cognome':            resolvedCognome,
      'Prima visita':       now,
      'Ultima visita':      now,
      'Contatore visite':   1,
      'Consenso marketing': consenso === true,
      'Fonte':              'WiFi Portal',
      'MAC addresses':      clientMac || '',
    };
    if (compleanno) createFields['Compleanno'] = compleanno; // formato YYYY-MM-DD
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
    if (!createRes.ok) {
      console.error('[portal-submit] Airtable create fallito:', createRes.status, JSON.stringify(createData));
    } else {
      console.log('[portal-submit] Airtable create OK, id:', createData.id);
    }
    airtableRecordId = createData.id;
  }

  // ── Brevo ──────────────────────────────────────────────────────────
  if (BREVO_API_KEY) {
    const brevoAttrs = {
      NOME:             resolvedNome,
      LASTNAME:         resolvedCognome,
      LAST_WIFI_VISIT:  now,
      WIFI_VISIT_COUNT: visitCount,
    };
    // Compleanno → Brevo BIRTHDAY (Unix timestamp ms, mezzanotte UTC)
    if (compleanno) {
      const birthdayTs = new Date(compleanno + 'T00:00:00Z').getTime();
      if (!isNaN(birthdayTs)) brevoAttrs.BIRTHDAY = birthdayTs;
    }

    if (!isReturning && consenso && BREVO_WIFI_LIST_ID && BREVO_DOI_TEMPLATE && !existing) {
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
      }).catch(() => {});
    } else {
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

  // ── Autorizza MAC su Omada (server-to-server, non blocca il flusso) ──
  const omadaResult = await omadaAuthorize({ clientMac, gatewayMac, vid, site });
  if (!omadaResult.ok) {
    console.warn('[portal-submit] Omada auth non riuscita:', omadaResult.reason);
    // Non blocchiamo — il cliente riceve comunque il redirect
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
      name:        resolvedNome,
      redirectUrl: redirectUrl || 'https://boogiebistrot.it',
    }),
  };
};
