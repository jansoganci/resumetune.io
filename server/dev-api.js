/* Local dev API server to avoid requiring `vercel login` during development.
   Production uses `api/ai/proxy.js` (Vercel Functions).
*/
import http from 'node:http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  allowOrigins,
  ipRateLimit,
  endpointLimit,
  incrQuota,
  acquireLock,
  releaseLock,
  checkSize,
  withTimeout,
  retryOnce,
  incrGlobalHour,
  getAnonId,
} from '../src/server/lib/limits.js';
import dotenv from 'dotenv';
// Load from both .env.local and .env (order matters: local overrides)
try {
  // @ts-ignore: dotenv v17 supports path array
  dotenv.config({ path: ['.env.local', '.env'] });
} catch {
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}

const server = http.createServer(async (req, res) => {
  // Very simple per-IP sliding window rate limit (dev only)
  // Defaults: 20 req / minute. Override via RATE_LIMIT_PER_MIN env.
  const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 20);
  const WINDOW_MS = 60_000;
  // In-memory store: ip -> array of request timestamps (ms)
  // Note: reset when process restarts; sufficient for dev.
  globalThis.__rateStore = globalThis.__rateStore || new Map();
  const rateStore = globalThis.__rateStore;

  if (req.method === 'GET' && req.url === '/api/health') {
    const hasKey = Boolean((process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, hasKey }));
    return;
  }
  // Only handle POST /api/ai/proxy
  if (req.method !== 'POST' || req.url !== '/api/ai/proxy') {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  const LIMITS_ENABLED = (process.env.LIMITS_ENABLED ?? 'true') !== 'false';

  // Read raw body
  let body = '';
  for await (const chunk of req) body += chunk;

  // 1) Size check
  if (LIMITS_ENABLED) {
    const s = checkSize(req.headers['content-length'], body, 50 * 1024);
    if (!s.ok) {
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'payload_too_large', message: 'Payload too large' } }));
      return;
    }
  }

  // 2) Origin check (DEV allow localhost only)
  if (LIMITS_ENABLED) {
    const origin = req.headers['origin'] || '';
    const allowed = allowOrigins();
    const ok = typeof origin === 'string' ? allowed.includes(origin) : true;
    if (!ok) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'invalid_origin', message: 'Forbidden origin' } }));
      return;
    }
  }

  // Extract client IP (best-effort for dev)
  const fwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const anonId = getAnonId(ip, req.headers);

  // 3) Global IP rate limit (DEV fallback: keep simple counter)
  if (LIMITS_ENABLED) {
    const rr = await ipRateLimit(ip);
    if (!rr.ok) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'rate_limited', message: 'Too many requests, please try again later.' } }));
      return;
    }
  }

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'ai_failed', message: 'Missing API key. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env.local or .env' } }));
    return;
  }

  try {
    const parsed = JSON.parse(body || '{}');
    const { history, message, model: modelName } = parsed;
    if (!message || !Array.isArray(history)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'invalid_input', message: 'Invalid payload' } }));
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-flash' });

    const historyText = history
      .map((h) => (h.parts && h.parts[0] ? h.parts[0].text : ''))
      .filter(Boolean)
      .join('\n\n');
    const fullPrompt = [historyText, message].filter(Boolean).join('\n\n');

    // 4) Daily quota
    if (LIMITS_ENABLED) {
      const q = await incrQuota(anonId);
      if (q > 50) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { code: 'quota_exceeded', message: 'Daily quota exceeded' } }));
        return;
      }
    }

    // 5) Endpoint cap 5/min
    if (LIMITS_ENABLED) {
      const er = await endpointLimit('ai_proxy', anonId, 5);
      if (!er.ok) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { code: 'endpoint_throttled', message: 'Endpoint is throttled' } }));
        return;
      }
    }

    // 6) Concurrency lock
    let acquiredSlot;
    if (LIMITS_ENABLED) {
      const l = await acquireLock(anonId, 2, 45);
      if (!l.ok) {
        res.statusCode = 429;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { code: 'too_many_concurrent', message: 'Too many concurrent requests' } }));
        return;
      }
      acquiredSlot = l.slot;
    }

    const exec = () => model.generateContent({ contents: [{ role: 'user', parts: [{ text: fullPrompt }] }] });
    const result = await withTimeout(retryOnce(exec), 30_000);
    const text = result.response.text();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ text }));
  } catch (error) {
    console.error('Local AI proxy failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'ai_failed', message: (error && (error.message || String(error))) || 'AI proxy failed' } }));
  } finally {
    try { await releaseLock(anonId, undefined); } catch {}
    await incrGlobalHour(5000);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
});


