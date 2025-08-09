/* Lightweight limit helpers (MVP)
 * Works with Upstash Redis if env exists, otherwise falls back to in-memory maps (DEV).
 */

const isProd = (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production');
const LIMITS_ENABLED = (process.env.LIMITS_ENABLED ?? 'true') !== 'false';

// Upstash REST client (dynamic import to keep this file framework-agnostic)
let redis = null;
async function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import('@upstash/redis');
  redis = new Redis({ url, token });
  return redis;
}

// In-memory fallback (DEV only)
const mem = {
  counts: new Map(),
  locks: new Map(),
};

function now() { return Date.now(); }

function memIncr(key, ttlMs) {
  const r = mem.counts.get(key);
  const t = now();
  if (!r || r.exp < t) {
    mem.counts.set(key, { value: 1, exp: t + ttlMs });
    return 1;
  }
  r.value += 1;
  return r.value;
}

function memGet(key) {
  const r = mem.counts.get(key);
  if (!r || r.exp < now()) return 0;
  return r.value;
}

function memTTLms(key) {
  const r = mem.counts.get(key);
  if (!r) return 0;
  const remain = r.exp - now();
  return remain > 0 ? remain : 0;
}

export function allowOrigins() {
  return isProd ? ['https://resumetune.io'] : ['http://localhost:5173'];
}

export async function ipRateLimit(ip) {
  if (!LIMITS_ENABLED) return { ok: true };
  const perMin = 30; // 30 / 60s
  const burst10s = 10; // 10 / 10s

  const r = await getRedis();
  if (!r) {
    const c1 = memIncr(`rate:ip:${ip}:m`, 60_000);
    const c2 = memIncr(`rate:ip:${ip}:10s`, 10_000);
    const ok = c1 <= perMin && c2 <= burst10s;
    return { ok, limit: perMin, remaining: Math.max(0, perMin - c1), reset: Math.ceil(memTTLms(`rate:ip:${ip}:m`) / 1000) };
  }
  const c1 = await r.incr(`rate:ip:${ip}:m`);
  if (c1 === 1) await r.expire(`rate:ip:${ip}:m`, 60);
  const c2 = await r.incr(`rate:ip:${ip}:10s`);
  if (c2 === 1) await r.expire(`rate:ip:${ip}:10s`, 10);
  const ok = c1 <= perMin && c2 <= burst10s;
  const ttl = await r.ttl(`rate:ip:${ip}:m`);
  return { ok, limit: perMin, remaining: Math.max(0, perMin - c1), reset: ttl };
}

export async function userRateLimit(id, perMin = 30) {
  if (!LIMITS_ENABLED) return { ok: true };
  const r = await getRedis();
  if (!r) {
    const c = memIncr(`rate:user:${id}:m`, 60_000);
    return { ok: c <= perMin, limit: perMin, remaining: Math.max(0, perMin - c), reset: Math.ceil(memTTLms(`rate:user:${id}:m`) / 1000) };
  }
  const c = await r.incr(`rate:user:${id}:m`);
  if (c === 1) await r.expire(`rate:user:${id}:m`, 60);
  const ttl = await r.ttl(`rate:user:${id}:m`);
  return { ok: c <= perMin, limit: perMin, remaining: Math.max(0, perMin - c), reset: ttl };
}

export async function endpointLimit(key, id, perMin = 5) {
  if (!LIMITS_ENABLED) return { ok: true };
  const r = await getRedis();
  if (!r) {
    const c = memIncr(`ep:${key}:${id}:m`, 60_000);
    return { ok: c <= perMin, limit: perMin, remaining: Math.max(0, perMin - c), reset: Math.ceil(memTTLms(`ep:${key}:${id}:m`) / 1000) };
  }
  const c = await r.incr(`ep:${key}:${id}:m`);
  if (c === 1) await r.expire(`ep:${key}:${id}:m`, 60);
  const ttl = await r.ttl(`ep:${key}:${id}:m`);
  return { ok: c <= perMin, limit: perMin, remaining: Math.max(0, perMin - c), reset: ttl };
}

export async function incrQuota(id) {
  if (!LIMITS_ENABLED) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const key = `quota:${id}:${today}`;
  const r = await getRedis();
  if (!r) {
    const val = memIncr(key, 86_400_000);
    return val;
  }
  const val = await r.incr(key);
  if (val === 1) await r.expire(key, 86_400);
  return val;
}

export async function getQuota(id) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `quota:${id}:${today}`;
  const r = await getRedis();
  if (!r) return memGet(key) || 0;
  const v = await r.get(key);
  return Number(v || 0);
}

export async function acquireLock(id, slots = 2, ttlSec = 45) {
  if (!LIMITS_ENABLED) return { ok: true };
  const r = await getRedis();
  const trySlots = Array.from({ length: slots }, (_, i) => String(i + 1));
  for (const s of trySlots) {
    const k = `lock:${id}:${s}`;
    if (!r) {
      const L = mem.locks.get(k);
      const t = now();
      if (!L || L.exp < t) {
        mem.locks.set(k, { exp: t + ttlSec * 1000 });
        return { ok: true, slot: s };
      }
      continue;
    }
    const ok = await r.set(k, '1', { nx: true, ex: ttlSec });
    if (ok === 'OK') return { ok: true, slot: s };
  }
  return { ok: false };
}

export async function releaseLock(id, slot) {
  if (!slot) return;
  const k = `lock:${id}:${slot}`;
  const r = await getRedis();
  if (!r) {
    mem.locks.delete(k);
    return;
  }
  await r.del(k);
}

export function checkSize(contentLengthHeader, bodyString, maxBytes) {
  const fromHeader = typeof contentLengthHeader === 'string' ? parseInt(contentLengthHeader, 10) : 0;
  let size = 0;
  if (fromHeader > 0) {
    size = fromHeader;
  } else if (bodyString != null) {
    size = Buffer.byteLength(bodyString, 'utf8');
  }
  return { ok: size <= maxBytes, bytes: size };
}

export async function withTimeout(p, ms) {
  let to;
  const timeout = new Promise((_, reject) => {
    to = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    const res = await Promise.race([p, timeout]);
    return res;
  } finally {
    clearTimeout(to);
  }
}

export async function retryOnce(fn, delayMs = 300) {
  try {
    return await fn();
  } catch (e) {
    await new Promise((r) => setTimeout(r, delayMs));
    return await fn();
  }
}

export async function incrGlobalHour(limitPerHour = 5000) {
  const key = `global:ai:count:${new Date().toISOString().slice(0,13)}`; // YYYY-MM-DDTHH
  const r = await getRedis();
  if (!r) {
    const c = memIncr(key, 2 * 60 * 60 * 1000);
    return { ok: c <= limitPerHour, count: c };
  }
  const c = await r.incr(key);
  if (c === 1) await r.expire(key, 2 * 60 * 60);
  return { ok: c <= limitPerHour, count: c };
}

export function getAnonId(ip, headers) {
  const uid = headers['x-user-id'];
  if (uid && typeof uid === 'string') return uid;
  const anon = headers['x-anon-id'] || '';
  if (anon) return anon;
  return ip || 'unknown';
}

export const constants = {
  LIMITS_ENABLED,
  isProd,
};


