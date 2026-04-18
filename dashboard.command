#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Boogie Dashboard ==="
echo ""
echo "▶ Avvio Netlify Functions su :8888..."
cd "$ROOT" && netlify functions:serve --port 8888 &
NETLIFY_PID=$!

sleep 4

echo ""
echo "▶ Avvio Dashboard Vite su :5173..."
cd "$ROOT/dashboard" && npm run dev

# Se la dashboard si chiude, ferma anche netlify
kill $NETLIFY_PID 2>/dev/null
