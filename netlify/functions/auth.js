// netlify/functions/auth.js

const { createToken } = require('./verifyToken')

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const PASSWORD = process.env.DASHBOARD_PASSWORD;

  let data;
  try { data = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { password } = data;

  if (!password || password !== PASSWORD) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: 'Password errata' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, token: createToken() })
  };
};
