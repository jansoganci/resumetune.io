// Vercel Serverless Function (Production AI proxy with Upstash rate limiting)
// Runtime: Node.js (ESM)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis (set in Vercel env)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

// Sliding window: default 60 req/min
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 60);
const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_MIN, '1 m') })
  : null;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0].trim();
  return ip || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } });
    return;
  }

  // Rate limit (if Upstash configured)
  try {
    if (ratelimit) {
      const ip = getClientIp(req);
      const { success, pending, limit, remaining, reset } = await ratelimit.limit(`ai-proxy:${ip}`);
      if (!success) {
        if (pending) await pending; // ensure token state resolved
        res.setHeader('RateLimit-Limit', String(limit));
        res.setHeader('RateLimit-Remaining', String(Math.max(0, remaining)));
        if (reset) res.setHeader('RateLimit-Reset', String(reset));
        res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests, please try again later.' } });
        return;
      }
    }
  } catch (_) {
    // fail-open on rate limiter issues
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    res.status(500).json({ error: { code: 'ai_failed', message: 'Missing API key. Set GEMINI_API_KEY' } });
    return;
  }

  try {
    const { history, message, model } = (typeof req.body === 'object' && req.body) || {};
    if (!message || !Array.isArray(history)) {
      res.status(400).json({ error: { code: 'invalid_input', message: 'Invalid payload' } });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const mdl = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

    const historyText = history
      .map((h) => (h?.parts && h.parts[0] ? h.parts[0].text : ''))
      .filter(Boolean)
      .join('\n\n');
    const fullPrompt = [historyText, message].filter(Boolean).join('\n\n');

    const result = await mdl.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });
    const text = result.response.text();
    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: { code: 'ai_failed', message: (error && (error.message || String(error))) || 'AI proxy failed' } });
  }
}

// Minimal Vercel function (ESM) for proxying Gemini requests
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing GEMINI_API_KEY' });
    return;
  }

  try {
    const { history, message, model: modelName } = req.body || {};

    if (!message || !Array.isArray(history)) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-flash' });

    const historyText = history
      .map((h) => (h.parts && h.parts[0] ? h.parts[0].text : ''))
      .filter(Boolean)
      .join('\n\n');
    const fullPrompt = [historyText, message].filter(Boolean).join('\n\n');

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: fullPrompt }] }] });
    const text = result.response.text();

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: 'AI proxy failed' });
  }
}


