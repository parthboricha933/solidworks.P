#!/bin/bash
cd /home/z/my-project

# Install deps if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin/next" ]; then
  echo "[DEV] Installing dependencies..."
  bun install
fi

# Setup database
if [ -f "prisma/schema.prisma" ]; then
  echo "[DEV] Setting up database..."
  bun run db:push 2>/dev/null || true
fi

# Start the Next.js dev server (foreground - start.sh backgrounds this script)
echo "[DEV] Starting Next.js dev server on port 3000..."
exec npx next dev -p 3000
