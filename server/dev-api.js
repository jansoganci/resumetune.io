/* Local dev API server to avoid requiring `vercel login` during development.
   Production uses `api/ai/proxy.js` (Vercel Functions).
*/
import http from 'node:http';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  // Extract client IP (best-effort for dev)
  const fwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  // Rate limit check
  {
    const now = Date.now();
    const arr = (rateStore.get(ip) || []).filter((t) => now - t < WINDOW_MS);
    if (arr.length >= RATE_LIMIT_PER_MIN) {
      res.statusCode = 429;
      res.setHeader('Retry-After', '60');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'rate_limited', message: 'Too many requests, please try again later.' } }));
      return;
    }
    arr.push(now);
    rateStore.set(ip, arr);
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
    let body = '';
    for await (const chunk of req) body += chunk;
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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      // basic safety: avoid very long prompts in dev
    });
    const text = result.response.text();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ text }));
  } catch (error) {
    console.error('Local AI proxy failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'ai_failed', message: (error && (error.message || String(error))) || 'AI proxy failed' } }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[dev-api] listening on http://localhost:${PORT}`);
});


