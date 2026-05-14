// netlify/functions/_email.js
// Mini design system per le email transazionali di Boogie Bistrot.
// Importa con: const { shell, btnDark, btnLight, btnBrand, riquadro } = require('./_email');

// ── Costanti ─────────────────────────────────────────────────────────────────
const FONT_STACK = "'Raleway',Arial,sans-serif";
const COLOR_GOLD = '#C4913A';
const COLOR_DARK = '#1A1610';
const COLOR_BODY = '#4A4030';
const COLOR_MUTED = '#8B6F47';
const COLOR_BG = '#F5F0E8';
const COLOR_LINE = '#D4C9B0';
const COLOR_FOOT = '#B0A898';
const LOGO_URL = 'https://boogiebistrot.com/logo-email.png';

// ── Pulsanti ─────────────────────────────────────────────────────────────────
// Sfondo scuro (#1A1610), testo bianco — azione principale notifica interna
function btnDark(href, label, extra = '') {
  return `<a href="${href}" ${extra}style="display:inline-block;background:${COLOR_DARK};color:white;text-decoration:none;padding:12px 24px;font-family:${FONT_STACK};font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">${label}</a>`;
}

// Sfondo chiaro (#F5F0E8), bordo sottile — azione secondaria (es. Apple Calendar)
function btnLight(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${COLOR_BG};color:${COLOR_DARK};text-decoration:none;padding:12px 24px;font-family:${FONT_STACK};font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;border:1px solid ${COLOR_LINE};">${label}</a>`;
}

// Sfondo oro (#C4913A), testo scuro — CTA primaria verso il cliente
function btnBrand(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${COLOR_GOLD};color:${COLOR_DARK};text-decoration:none;padding:12px 24px;font-family:${FONT_STACK};font-size:13px;font-weight:600;letter-spacing:0.05em;border-radius:4px;">${label}</a>`;
}

// ── Riquadro evidenziato (box con bordo oro a sinistra) ───────────────────────
function riquadro(content) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background:${COLOR_BG};border-left:3px solid ${COLOR_GOLD};margin-bottom:28px;"><tr><td style="padding:20px 24px;">${content}</td></tr></table>`;
}

// ── Riga dati (label sopra, valore sotto) ─────────────────────────────────────
function row(label, value) {
  return `<p style="margin:0 0 12px;font-size:13px;"><span style="color:${COLOR_MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:3px;">${label}</span><strong style="color:${COLOR_DARK};">${value}</strong></p>`;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function logo() {
  return `<img src="${LOGO_URL}" alt="Boogie Bistrot" width="80" height="65" style="display:block;margin:0 auto 8px;border:0;">`;
}

// ── Firma ────────────────────────────────────────────────────────────────────
function firma() {
  return `<p style="font-size:15px;color:${COLOR_BODY};line-height:1.6;margin:24px 0 0;">A presto,<br><span style="font-weight:500;">Alessandra &amp; Chiara</span></p>`;
}

// ── Shell email completa ───────────────────────────────────────────────────────
// label: stringa piccola sopra il titolo (es. "Prenotazione", "Fidelity") — opzionale
function shell({ label = '', body = '', footer = 'Boogie Bistrot — Via Europa, 2, Colle Brianza (LC)' } = {}) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${COLOR_BG};font-family:${FONT_STACK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-top:3px solid ${COLOR_GOLD};">
        <tr><td style="padding:40px 40px 20px;font-family:${FONT_STACK};">
          ${logo()}
          ${label ? `<p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${COLOR_MUTED};margin:0 0 12px;text-align:center;">${label}</p>` : ''}
          ${body}
        </td></tr>
        <tr><td style="padding:20px 40px 30px;border-top:1px solid ${COLOR_LINE};font-family:${FONT_STACK};">
          <p style="font-size:11px;color:${COLOR_FOOT};margin:0;line-height:1.7;">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = { shell, btnDark, btnLight, btnBrand, riquadro, row, logo, firma, COLOR_GOLD, COLOR_DARK, COLOR_BODY, COLOR_MUTED, COLOR_BG, COLOR_LINE };
