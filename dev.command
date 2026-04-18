#!/bin/bash

ROOT="$(dirname "$0")"
echo "Avvio Website (Next.js)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/website' && npm run dev\""
