---
Task ID: 1
Agent: Main Agent
Task: Fix 502 Bad Gateway error and server crashes for MechDesign Pro

Work Log:
- Diagnosed 502 as Next.js server dying, not just a timeout issue
- Found AI SDK (z-ai-web-dev-sdk) imports crash Next.js when proxied through Caddy HTTP/2
- Rewrote AI API routes to use child_process (node -e "...") to isolate SDK calls
- Caddy HTTP/2 proxy causes intermittent Next.js server crashes (unfixable without Caddy admin access)
- Implemented polling-based 3D generation with detached worker process
- Created auto-restart supervisor (start.sh) for resilience
- Added retry logic in fetchJSON for 502/503/504 errors
- All endpoints verified working on direct access (port 3000)
- Engineering endpoints: shaft, gear, stress, fatigue, bearing, DFM, manufacturing, BOM — all working
- AI endpoints: design-spec, vba-macro, python-script, modeling-plan — all working
- 3D generation: polling approach with detached worker — working

Stage Summary:
- Root cause: Caddy HTTP/2 proxy intermittently crashes Next.js dev server (cannot fix Caddy config)
- Solution: Auto-restart supervisor + client-side retry logic + polling for long tasks
- Files modified: src/app/api/ai/solidworks/route.ts, src/app/api/ai/generate-3d/route.ts, src/app/page.tsx
- New files: ai-worker.mjs (detached 3D generation worker), start.sh (supervisor), Caddyfile (updated but unused by actual Caddy)
