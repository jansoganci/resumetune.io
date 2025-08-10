// Vercel Serverless Function (Production AI proxy) – with MVP abuse protections
// Runtime: Node.js (ESM)
import { GoogleGenerativeAI } from '@google/generative-ai';
// 🚨 TEMPORARILY DISABLED - Migration in progress
const allowOrigins = () => ['http://localhost:5173', 'https://resumetune.io'];
const ipRateLimit = async () => ({ ok: true });
const endpointLimit = async () => ({ ok: true });
const incrQuota = async () => 0;
const acquireLock = async () => true;
const releaseLock = async () => {};
const checkSize = () => ({ ok: true });
const withTimeout = (fn) => fn;
const retryOnce = (fn) => fn;
const incrGlobalHour = async () => {};
const getAnonId = () => 'anon_dev';
const constants = { isProd: false };

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(fwd) ? fwd[0] : (fwd || '').split(',')[0].trim();
  return ip || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  // 🔧 CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method not allowed' } });
    return;
  }

  const LIMITS_ENABLED = false; // 🚨 DISABLED FOR DEBUGGING MIGRATION

  try {
    // Read raw body to allow size/origin/limits before model
    let body = '';
    for await (const chunk of req) body += chunk;

    // 1) Size check (text ≤ 50KB)
    if (LIMITS_ENABLED) {
      const s = checkSize(req.headers['content-length'], body, 50 * 1024);
      if (!s.ok) {
        res.status(413).json({ error: { code: 'payload_too_large', message: 'Payload too large' } });
        return;
      }
    }

    // 2) Origin check
    if (LIMITS_ENABLED) {
      const origin = req.headers['origin'] || '';
      const host = req.headers['host'] || '';
      const allowed = allowOrigins();
      const ok = (typeof origin === 'string' && origin && allowed.includes(origin)) || (constants.isProd ? host?.includes('resumetune.io') : true);
      if (!ok) {
        res.status(403).json({ error: { code: 'invalid_origin', message: 'Forbidden origin' } });
        return;
      }
    }

    const ip = getClientIp(req);
    const anonId = getAnonId(ip, req.headers);

    // 3) Global IP rate limit
    if (LIMITS_ENABLED) {
      const rr = await ipRateLimit(ip);
      if (!rr.ok) {
        if (rr.limit != null) res.setHeader('RateLimit-Limit', String(rr.limit));
        if (rr.remaining != null) res.setHeader('RateLimit-Remaining', String(Math.max(0, rr.remaining)));
        if (rr.reset != null) res.setHeader('RateLimit-Reset', String(rr.reset));
        res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests, please try again later.' } });
        return;
      }
    }

    // 4) Daily quota (50/day)
    if (LIMITS_ENABLED) {
      const q = await incrQuota(anonId);
      if (q > 50) {
        res.status(429).json({ error: { code: 'quota_exceeded', message: 'Daily quota exceeded' } });
        return;
      }
    }

    // 5) Endpoint cap (/api/ai/proxy: 5/min)
    if (LIMITS_ENABLED) {
      const er = await endpointLimit('ai_proxy', anonId, 5);
      if (!er.ok) {
        res.status(429).json({ error: { code: 'endpoint_throttled', message: 'Endpoint is throttled' } });
        return;
      }
    }

    // 6) Concurrency lock (max 2)
    let acquiredSlot;
    if (LIMITS_ENABLED) {
      const l = await acquireLock(anonId, 2, 45);
      if (!l.ok) {
        res.status(429).json({ error: { code: 'too_many_concurrent', message: 'Too many concurrent requests' } });
        return;
      }
      acquiredSlot = l.slot;
    }

    // API key
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    if (!apiKey) {
      res.status(500).json({ error: { code: 'ai_failed', message: 'Missing API key. Set GEMINI_API_KEY' } });
      return;
    }

    try {
      const parsed = JSON.parse(body || '{}');
      const { history, message, model } = parsed || {};
      
      // 🚨 DEBUG - Backend validation check
      console.log('🔍 AI Proxy Backend Debug:', {
        messageExists: !!message,
        messageType: typeof message,
        messageLength: message?.length,
        historyExists: !!history,
        historyIsArray: Array.isArray(history),
        historyLength: history?.length,
        model,
        parsedKeys: Object.keys(parsed)
      });
      
      if (!message || !Array.isArray(history)) {
        console.log('❌ Validation failed:', { message: !!message, historyArray: Array.isArray(history) });
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

      const exec = () => mdl.generateContent({ contents: [{ role: 'user', parts: [{ text: fullPrompt }] }] });
      const result = await withTimeout(retryOnce(exec), 30_000);
      const text = result.response.text();
      res.status(200).json({ text });
    } catch (error) {
      if (String(error).includes('timeout')) {
        res.status(504).json({ error: { code: 'upstream_timeout', message: 'Upstream timeout' } });
      } else {
        res.status(500).json({ error: { code: 'ai_failed', message: (error && (error.message || String(error))) || 'AI proxy failed' } });
      }
    } finally {
      if (LIMITS_ENABLED) {
        try { await releaseLock(anonId, acquiredSlot); } catch {}
        await incrGlobalHour(5000);
      }
    }
  } catch {
    res.status(500).json({ error: { code: 'ai_failed', message: 'AI proxy failed' } });
  }
}


