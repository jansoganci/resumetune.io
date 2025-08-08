# API Abuse-Prevention (MVP-safe) – Implementation Plan

## 1) Scope & Endpoints
- Current endpoints
  - Production: `api/ai/proxy` (Vercel Function) – prompts Gemini
  - Development: `server/dev-api.js` exposes `/api/ai/proxy` (local proxy)
- Not in scope (today): export endpoints (PDF/DOCX are client-side)
- Traffic assumptions
  - Anonymous traffic from Ads, bursty patterns
  - Majority first‑time users; no login yet

## 2) Current State (from audit)
- Exists now
  - Global per‑minute rate limit: Dev (in‑memory), Prod (Upstash sliding window)
  - API key server‑only (no client exposure)
  - Optional Sentry wiring available
- Missing
  - Per‑user daily quota / counters
  - Concurrency lock (max parallel AI calls)
  - Tight CORS/Origin allowlist (prod domain only)
  - Body size limits (413), input parsing caps
  - Timeout + (bounded) retry for model call
  - Bot protection (hCaptcha/Turnstile)
  - Budget safety (hourly soft global cap / alert)

## 3) Decisions & Limits (final numbers)
- IP rate limit (global): 30 req / 60s, burst 10 (token bucket via Upstash REST)
- Per‑user daily quota: 50/day (userId if present; else anon cookie or IP‑hash)
- Endpoint caps: `/api/ai/proxy` → extra 5 req / 60s (over the global limit)
- Concurrency: max 2 concurrent AI calls per user/IP (TTL lock 45s)
- Body size: text ≤ 50 KB; images (future) ≤ 5 MB → return 413 on exceed
- Timeout: 30s around Gemini call; retry max 1 with small backoff (e.g., 300ms)
- CORS/Origin: allow only `https://resumetune.io` (prod) and `http://localhost:5173` (dev)
- Budget safety: soft global cap N calls/hour (e.g., 5,000) → 503 + Sentry warn when exceeded

## 4) Redis Keys & TTLs
- `rate:ip:{ip}` – sliding/bucket metadata (Upstash provides internal keying)
- `rate:user:{id}` – per‑user sliding/bucket (60s TTL windows)
- `quota:{id}:{yyyy-mm-dd}` – INCR per day, TTL: 24h
- `lock:{id}:{slot}` – SETNX lock to cap concurrency, TTL: 45s (auto release on TTL)
- `global:ai:count:{yyyy-mm-dd:HH}` – hourly counter, TTL: 2h

## 5) Middleware Flow (request pipeline)
1. Parse input stream with guard
   - Count bytes while reading; if > 50 KB (text) → `413 Payload Too Large` `{ error: 'payload_too_large' }`
2. Origin/CORS check
   - If `Origin`/`Host` not in allowlist → `403 Forbidden` `{ error: 'invalid_origin' }`
3. IP rate limit (global)
   - If over 30/min (burst 10) → `429 Too Many Requests` `{ error: 'rate_limited' }` (+ RateLimit headers)
4. User quota (daily)
   - If counter > 50/day → `429 Too Many Requests` `{ error: 'quota_exceeded' }`
5. Endpoint cap (`/api/ai/proxy`)
   - Extra 5/min per user/IP → `429` `{ error: 'endpoint_throttled' }`
6. Concurrency lock
   - Acquire `lock:{id}:{slot}` up to 2 slots; if not available → `429` `{ error: 'too_many_concurrent' }`
7. Call model with timeout + retry
   - Use AbortController(30s). On timeout → optional single retry; if still failing → `504 Gateway Timeout` `{ error: 'upstream_timeout' }`
8. Release lock (finally)
9. Budget safety
   - INCR hourly counter; if exceeded N → `503 Service Unavailable` `{ error: 'budget_exceeded' }` and Sentry warn

HTTP responses – summary
- 403: invalid origin
- 413: payload too large
- 429: rate_limited / quota_exceeded / endpoint_throttled / too_many_concurrent
- 503: budget_exceeded (soft global cap)
- 504: upstream_timeout

## 6) Env & Config
- Reuse: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- New helper module (next step): `src/server/lib/limits.ts`
  - `allowOrigins` (DEV/PROD)
  - `checkSize(req, maxBytes)`
  - `ipRateLimit(ip)`, `userRateLimit(id)`, `endpointLimit(key)`
  - `incrQuota(id)`, `getQuota(id)`
  - `acquireLock(id, slots=2, ttl=45s)`, `releaseLock(id)`
  - `withTimeout(promise, 30_000)` and `retryOnce(fn)`
  - `incrGlobalHour()`
- Config by env
  - DEV: allow `http://localhost:5173`, in‑memory fallback if Redis missing
  - PROD: require Redis; strict origins; full limits

## 7) Testing Plan (manual)
- 429 (rate)
  - `for i in {1..40}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<vercel>/api/ai/proxy -H 'Origin: https://resumetune.io' -d '{"message":"x"}'; done`
- 413 (size)
  - Send >50KB body: `dd if=/dev/zero bs=1024 count=60 | base64 | curl -X POST ... -d @-` → expect 413
- 403 (origin)
  - `curl -H 'Origin: https://evil.example' ...` → expect 403
- 504 (timeout)
  - Temporarily force tiny timeout (DEV) or stub model to delay → expect 504
- Quota exhaustion
  - Call endpoint 51 times within a day using same anon id (cookie/IP) → last call 429 `quota_exceeded`
- Concurrency
  - Fire 3 parallel requests for same id → one should get 429 `too_many_concurrent`

## 8) Rollout Plan
1. Add `src/server/lib/limits.ts` helper (pure functions + Upstash REST) **(DONE)**
2. Wrap `/api/ai/proxy` in order: size → origin → ip limit → quota → endpoint cap → lock → timeout/retry → release **(DONE)**
3. Add budget counter and Sentry warn in the same function **(DONE)**
4. (Dev parity) Add lightweight equivalents to `server/dev-api.js` **(DONE)**
5. Feature flag: `LIMITS_ENABLED=true` (env) to bypass quickly if needed **(DONE)**
6. Deploy to Preview → manual test → promote to Production **(DONE)**

## 9) Open Questions
- Auth roadmap: replace anon (cookie/IP‑hash) with real userId when login arrives (quotas per user, not IP)
- Bot protection: add Cloudflare Turnstile/Google reCAPTCHA Enterprise timing
- Hourly global cap value (N): set initial (e.g., 5,000/hour), confirm after first week of traffic


