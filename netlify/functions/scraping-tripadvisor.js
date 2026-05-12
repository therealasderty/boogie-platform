// netlify/functions/scraping-tripadvisor.js

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const API_KEY = process.env.FEEDBACK_API_KEY;
  const requestKey = event.headers['x-api-key'] || event.queryStringParameters?.key;
  if (API_KEY && requestKey !== API_KEY) {
    return { statusCode: 401, headers, body: 'Unauthorized' };
  }

  const SCRAPER_API_KEY     = process.env.SCRAPER_API_KEY;
  const AIRTABLE_TOKEN      = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID    = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_RECENSIONI = process.env.AIRTABLE_RECENSIONI || 'Recensioni';

  const TA_URL = 'https://www.tripadvisor.it/Restaurant_Review-g2717697-d17786536-Reviews-Boogie_Bistrot-Colle_Brianza_Province_of_Lecco_Lombardy.html';

  try {
    // ── 1. Chiama ScraperAPI ─────────────────────────────────────────
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(TA_URL)}&render=true&country_code=it`;
    const res = await fetch(scraperUrl, { timeout: 25000 });
    const html = await res.text();

    let recensioni = null;
    let rating = null;

    const recensioniPatterns = [
      /"reviewCount"\s*:\s*(\d+)/,
      /"reviewCount"\s*:\s*"(\d+)"/,
      /reviewCount["']\s*:\s*["']?(\d+)/i,
      /"aggregateRating"[^}]*"reviewCount"\s*:\s*"?(\d+)"?/,
      /(\d[\d.]*)\s*recensioni/i,
      /(\d[\d.]*)\s*reviews/i,
      /totalCount['":\s]+(\d+)/i,
      /data-reviewcount="(\d+)"/i,
      /"count"\s*:\s*(\d+)/,
    ];

    for (const pattern of recensioniPatterns) {
      const match = html.match(pattern);
      if (match) {
        const val = parseInt(match[1].replace(/\./g, ''));
        if (val > 0) { recensioni = val; break; }
      }
    }

    const ratingPatterns = [
      /"ratingValue"\s*:\s*"?([\d.]+)"?/,
      /ratingValue["']\s*:\s*["']?([\d.]+)/i,
      /"rating"\s*:\s*([\d.]+)/,
      /data-rating="([\d.]+)"/i,
    ];

    for (const pattern of ratingPatterns) {
      const match = html.match(pattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (val > 0 && val <= 5) { rating = val; break; }
      }
    }

    if (!recensioni) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'Dati non trovati' }) };
    }

    const oggi = new Date().toISOString().split('T')[0];

    // ── 2. Cerca record di oggi ──────────────────────────────────────
    const filterFormula = encodeURIComponent(`DATETIME_FORMAT({Data},'YYYY-MM-DD')="${oggi}"`);
    const searchRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_RECENSIONI)}?filterByFormula=${filterFormula}&maxRecords=1`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
    );
    const searchData = await searchRes.json();
    const existing = searchData.records && searchData.records[0];

    if (existing) {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_RECENSIONI)}/${existing.id}`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              'TripAdvisor Recensioni': recensioni,
              'TripAdvisor Rating':     rating,
            }
          })
        }
      );
    } else {
      await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_RECENSIONI)}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              'Data':                   oggi,
              'TripAdvisor Recensioni': recensioni,
              'TripAdvisor Rating':     rating,
            }
          })
        }
      );
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, recensioni, rating, data: oggi }) };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
