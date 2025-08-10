# CareerBoost AI

AI-powered job matching, cover letter, and resume optimization (React + TypeScript + Gemini 1.5 Flash).

## Features

- 🎯 Smart Job Matching (CV ↔ Job Description)
- 📝 Cover Letter Generation
- 🔧 Resume Optimization (ATS-friendly)
- 💬 AI Career Advisor (chat)
- 📄 Export: PDF / DOCX
- 🌍 i18n: en, tr (+ es, de, zh, ko, ja, ar)

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind, react-i18next, zod
- AI: Google Gemini 1.5 Flash via secure proxy
- Dev Proxy: `server/dev-api.js` (Node http, in-memory rate limit)
- Prod Proxy: `api/ai/proxy.js` (Vercel Functions) + Upstash rate limit (ops.)
- Files: `pdfjs-dist` (PDF), `mammoth` (DOCX)
- Analytics: GA4 (gtag, MI: `G-R2KKQRB75Z`)
- Error monitoring: Sentry (optional)

## Project Structure

```
api/                 # Vercel Functions (production AI proxy)
server/dev-api.js    # Local dev API proxy (http://localhost:3001)
src/
  components/        # UI components
  services/          # AI services and orchestration
  utils/             # helpers (errors, analytics, file processing)
  locales/           # i18n resources
  i18n.ts            # i18n init
public/              # static assets (legal/*.html, robots.txt, sitemap.xml)
```

## Setup (Local Dev)

1) Install deps
```bash
npm install
```

2) Create `.env.local`
```env
GEMINI_API_KEY=your_gemini_api_key
# optional
RATE_LIMIT_PER_MIN=20
VITE_SENTRY_DSN=
# Monetization skeleton (Stripe test keys; not required unless testing skeleton)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

3) Run
```bash
npm run dev
# Web: http://localhost:5173
# API: http://localhost:3001 (proxied via /api)
```

## Deployment (Vercel)

Set project envs:

- `GEMINI_API_KEY`
- (optional) `VITE_SENTRY_DSN`
- (optional) `ADMIN_USAGE_TOKEN` (protects admin usage endpoint)

Push to GitHub → Vercel deploy. Smoke test: CV/Job match/Chat/Export and 429 limit.

## Analytics

GA4 Measurement ID is embedded in `index.html` (`G-R2KKQRB75Z`). Replace if needed.

### Consent/GTM quick test
- Open in a fresh incognito window
- Deny consent in the banner → Network must NOT show analytics/ads requests (e.g., `collect`, DoubleClick)
- Accept consent → Network should start showing `collect`/analytics requests
- Ensure CMP is single-banner via CookieYes; GTM categories mapped; `block-before-consent` ON

## Legal & Privacy (MVP)

- Publish: `public/legal/privacy-policy.html`, `public/legal/terms-of-service.html` (and `public/legal/imprint.html` if DE)
- Cookies/Consent: informational banner if Ads/Analytics in use
- PII logging disabled in production; CSP meta added (use real headers in prod)

## Notes

⚠️ AI content must be reviewed by the user.

🔒 Data is processed locally and sent to Gemini for analysis.

## Monetization Skeleton

- Static pricing page at `public/pricing.html` (CTA buttons disabled; “Payments coming soon (test mode)”).
- Serverless placeholders:
  - `api/stripe/create-checkout-session.ts`: accepts POST with `{ plan: 'credits_50' | 'credits_200' | 'sub_100' | 'sub_300' }`, validates, logs, returns `{ url: '#' }`. If `STRIPE_SECRET_KEY` missing, returns 501.
  - `api/stripe/webhook.ts`: POST only; if `STRIPE_WEBHOOK_SECRET` missing, returns 501. Logs payload length and returns `{ received: true }` without side effects.
- No real Stripe sessions or charges. Move to live by wiring real Stripe SDK calls, price IDs, and secure webhook verification.

## Pricing (approved)
- Hybrid model: 3 free runs/day; Credits: 50/$5, 200/$15; Subscriptions: $12 (100 runs) / $19 (300 runs)
- Primary conversion: `generate_cover_letter` (tracked in GA4 via GTM)

## Environment Variables

| Variable | Purpose | Example Value |
| --- | --- | --- |
| STRIPE_API_KEY | Stripe payment processing | sk_live_xxx |
| SENTRY_DSN | Error monitoring | https://...ingest.sentry.io/... |
| ADMIN_USAGE_TOKEN | Protects /api/admin/usage endpoint | some-strong-secret |

## Admin Usage Endpoint (Daily Quota)

- Endpoint: `GET /api/admin/usage?date=YYYY-MM-DD`
- Auth: send header `x-admin-token: $ADMIN_USAGE_TOKEN`
- Response: `{ date, usage: { [id]: count } }`
- Errors: `401` (unauthorized), `400` (bad date), `501` (Redis not configured)
- Example:

```bash
curl -s https://<your-deploy>/api/admin/usage?date=2025-01-10 \
  -H "x-admin-token: $ADMIN_USAGE_TOKEN" | jq
```

## Release Checklist
- [x] Vercel environment variables up to date
- [x] Preview deploy tests passed
- [x] CSP / consent validation completed
- [x] Redirect rules working as expected
- [x] Security headers applied via `vercel.json`
- [x] GA4 events wired (`start_analysis`, `job_match_done`, `pricing_view`, `select_plan`)
- [x] Admin usage endpoint enabled (`/api/admin/usage`)

## Contributing

1) Fork repo → 2) Branch → 3) Code → 4) Test → 5) PR

## License

MIT License - see LICENSE