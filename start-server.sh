#!/bin/bash
# Auto-restart supervisor for Next.js production server
# Restarts the server whenever it exits/crashes

DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_CMD="node $DIR/.next/standalone/server.js"
LOG_FILE="$DIR/server-supervisor.log"
RESTART_DELAY=2

echo "[$(date)] Supervisor starting..." > "$LOG_FILE"

while true; do
  echo "[$(date)] Starting Next.js server..." >> "$LOG_FILE"
  $SERVER_CMD >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE" >> "$LOG_FILE"
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Clean exit, supervisor stopping." >> "$LOG_FILE"
    break
  fi
  
  echo "[$(date)] Restarting in ${RESTART_DELAY}s..." >> "$LOG_FILE"
  sleep $RESTART_DELAY
done
