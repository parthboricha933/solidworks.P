#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
rm -rf download/.ai-tasks/* 2>/dev/null

while true; do
  echo "[$(date)] Starting Next.js..."
  npx next dev -p 3000 >> server.log 2>&1
  sleep 2
done
