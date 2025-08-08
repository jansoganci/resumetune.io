/* Lightweight limit helpers (MVP)
 * Works with Upstash Redis if env exists, otherwise falls back to in-memory maps (DEV).
 */

// Types kept minimal to avoid external deps
type RateResult = { ok: boolean; limit?: number; remaining?: number; reset?: number };

const isProd = (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production');
const LIMITS_ENABLED = (process.env.LIMITS_ENABLED ?? 'true') !== 'false';

// Upstash REST client (dynamic import to keep this file framework-agnostic)
let redis: any = null;
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
  counts: new Map<string, { value: number; exp: number }>(),
  locks: new Map<string, { exp: number }>(),
};

function now() { return Date.now(); }

function memIncr(key: string, ttlMs: number): number {
  const r = mem.counts.get(key);
  const t = now();
  if (!r || r.exp < t) {
    mem.counts.set(key, { value: 1, exp: t + ttlMs });
    return 1;
  }
  r.value += 1;
  return r.value;
}

function memGet(key: string): number {
  const r = mem.counts.get(key);
  if (!r || r.exp < now()) return 0;
  return r.value;
}

function memTTLms(key: string): number {
  const r = mem.counts.get(key);
  if (!r) return 0;
  const remain = r.exp - now();
  return remain > 0 ? remain : 0;
}

export function allowOrigins(): string[] {
  return isProd ? ['https://resumetune.io'] : ['http://localhost:5173'];
}

export async function ipRateLimit(ip: string): Promise<RateResult> {
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
  // minute window
  const c1 = await r.incr(`rate:ip:${ip}:m`);
  if (c1 === 1) await r.expire(`rate:ip:${ip}:m`, 60);
  // 10s burst window
  const c2 = await r.incr(`rate:ip:${ip}:10s`);
  if (c2 === 1) await r.expire(`rate:ip:${ip}:10s`, 10);
  const ok = c1 <= perMin && c2 <= burst10s;
  const ttl = await r.ttl(`rate:ip:${ip}:m`);
  return { ok, limit: perMin, remaining: Math.max(0, perMin - c1), reset: ttl };
}

export async function userRateLimit(id: string, perMin = 30): Promise<RateResult> {
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

export async function endpointLimit(key: string, id: string, perMin = 5): Promise<RateResult> {
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

export async function incrQuota(id: string): Promise<number> {
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
  return val as number;
}

export async function getQuota(id: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `quota:${id}:${today}`;
  const r = await getRedis();
  if (!r) return memGet(key) || 0;
  const v = await r.get(key);
  return Number(v || 0);
}

export async function acquireLock(id: string, slots = 2, ttlSec = 45): Promise<{ ok: boolean; slot?: string }>
{
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

export async function releaseLock(id: string, slot?: string): Promise<void> {
  if (!slot) return;
  const k = `lock:${id}:${slot}`;
  const r = await getRedis();
  if (!r) {
    mem.locks.delete(k);
    return;
  }
  await r.del(k);
}

export function checkSize(contentLengthHeader: string | string[] | undefined, bodyString: string | null, maxBytes: number): { ok: boolean; bytes: number }
{
  const fromHeader = typeof contentLengthHeader === 'string' ? parseInt(contentLengthHeader, 10) : 0;
  let size = 0;
  if (fromHeader > 0) {
    size = fromHeader;
  } else if (bodyString != null) {
    size = Buffer.byteLength(bodyString, 'utf8');
  }
  return { ok: size <= maxBytes, bytes: size };
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    to = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    const res = await Promise.race([p, timeout]);
    // @ts-ignore
    return res;
  } finally {
    // @ts-ignore
    clearTimeout(to!);
  }
}

export async function retryOnce<T>(fn: () => Promise<T>, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    await new Promise((r) => setTimeout(r, delayMs));
    return await fn();
  }
}

export async function incrGlobalHour(limitPerHour = 5000): Promise<{ ok: boolean; count: number }>{
  const key = `global:ai:count:${new Date().toISOString().slice(0,13)}`; // YYYY-MM-DDTHH
  const r = await getRedis();
  if (!r) {
    const c = memIncr(key, 2 * 60 * 60 * 1000);
    return { ok: c <= limitPerHour, count: c };
  }
  const c = await r.incr(key);
  if (c === 1) await r.expire(key, 2 * 60 * 60);
  return { ok: (c as number) <= limitPerHour, count: c as number };
}

export function getAnonId(ip: string, headers: Record<string, any>): string {
  // Prefer explicit user id if comes later, else anon cookie or IP-hash placeholder
  const uid = headers['x-user-id'] as string | undefined;
  if (uid && typeof uid === 'string') return uid;
  const anon = (headers['x-anon-id'] as string | undefined) || '';
  if (anon) return anon;
  // simple fallback: IP as id (MVP)
  return ip || 'unknown';
}

export const constants = {
  LIMITS_ENABLED,
  isProd,
};


