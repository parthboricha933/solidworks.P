---
Task ID: 1
Agent: Main Agent
Task: Fix network error - "Unexpected token '<', is not valid JSON" and 502 Bad Gateway

Work Log:
- Diagnosed root cause: Caddy proxy (port 81) was returning HTML error pages (502 Bad Gateway) when AI API calls exceeded proxy timeouts (30-60s)
- All frontend fetch() calls blindly called res.json() on any response, causing JSON parse error on HTML responses
- Added fetchJSON() helper function with Content-Type validation, HTTP status checking, and configurable AbortController timeout
- Replaced all 12 raw fetch() calls in page.tsx with fetchJSON()
- Reduced AI prompt sizes (max_tokens from 4000→2000, shorter system prompts) to reduce response times
- Changed AI solidworks route to use streaming ReadableStream for keepalive through proxies
- Added Caddy timeout config (read_timeout/write_timeout 180s) in local Caddyfile
- Created .zscripts/dev.sh for persistent dev server startup on session restart
- Verified build passes cleanly

Stage Summary:
- fetchJSON helper properly handles non-JSON responses, showing clear error messages instead of cryptic JSON parse errors
- AI endpoints return faster with optimized prompts
- Client-side timeouts: 30s for calculators, 180s for AI calls
- .zscripts/dev.sh ensures dev server starts as child of init process on restart
- User needs to restart session for dev server to come back online
