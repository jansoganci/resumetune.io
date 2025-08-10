/**
 * ================================================================
 * LIMITS SERVICE - SUPABASE VERSION
 * ================================================================
 * Redis'ten Supabase'e geçiş yapılmış yeni limit sistemi
 * Tüm rate limiting, quota tracking ve concurrency lock
 * işlemlerini Supabase RPC fonksiyonları ile yapar
 */

import { getSupabaseClient } from '../../../api/stripe/supabase-integration';

// Types (orijinalden korunmuş)
export type RateResult = { 
  ok: boolean; 
  limit?: number; 
  remaining?: number; 
  reset?: number;
  error?: string;
};

export type LockResult = { 
  ok: boolean; 
  slot?: string;
  error?: string;
};

export type QuotaResult = {
  ok: boolean;
  count: number;
  error?: string;
};

const isProd = (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production');
const LIMITS_ENABLED = (process.env.LIMITS_ENABLED ?? 'true') !== 'false';

// In-memory fallback (Redis'teki gibi, Supabase bağlantısı yoksa)
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

// ================================================================
// SUPABASE CLIENT - GRACEFUL FALLBACK
// ================================================================

async function getSupabase() {
  try {
    return getSupabaseClient();
  } catch (error) {
    console.warn('⚠️ Supabase client unavailable, using fallback:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// ================================================================
// UTILITY FUNCTIONS (UNCHANGED)
// ================================================================

export function allowOrigins(): string[] {
  return isProd ? ['https://resumetune.io'] : ['http://localhost:5173'];
}

export function getAnonId(ip: string, headers: Record<string, any>): string {
  const uid = headers['x-user-id'] as string | undefined;
  if (uid && typeof uid === 'string') return uid;
  const anon = (headers['x-anon-id'] as string | undefined) || '';
  if (anon) return anon;
  return ip || 'unknown';
}

export function checkSize(
  contentLengthHeader: string | string[] | undefined, 
  bodyString: string | null, 
  maxBytes: number
): { ok: boolean; bytes: number } {
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
    return res;
  } finally {
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

// ================================================================
// IP RATE LIMITING - SUPABASE VERSION
// ================================================================

export async function ipRateLimit(ip: string): Promise<RateResult> {
  if (!LIMITS_ENABLED) return { ok: true };
  
  const perMin = 30; // 30 requests per minute
  const burst10s = 10; // 10 requests per 10 seconds
  
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 IP rate limit fallback to memory');
    const c1 = memIncr(`rate:ip:${ip}:m`, 60_000);
    const c2 = memIncr(`rate:ip:${ip}:10s`, 10_000);
    const ok = c1 <= perMin && c2 <= burst10s;
    return { 
      ok, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c1), 
      reset: Math.ceil(memTTLms(`rate:ip:${ip}:m`) / 1000) 
    };
  }

  try {
    // 1-minute window check
    const { data: result1, error: error1 } = await supabase
      .rpc('check_and_increment_rate_limit', {
        p_identifier: ip,
        p_limit_type: 'ip',
        p_endpoint: null,
        p_max_requests: perMin,
        p_window_minutes: 1
      });

    if (error1) {
      console.error('❌ IP rate limit error (1min):', error1);
      return { ok: false, error: 'Rate limit check failed' };
    }

    // 10-second burst window check
    const currentTime = new Date();
    const burst10Key = `${ip}:10s:${Math.floor(currentTime.getTime() / 10000)}`;
    
    const { data: result2, error: error2 } = await supabase
      .rpc('check_and_increment_rate_limit', {
        p_identifier: burst10Key,
        p_limit_type: 'ip_burst',
        p_endpoint: null,
        p_max_requests: burst10s,
        p_window_minutes: 1 // Will be overridden by window calculation
      });

    if (error2) {
      console.error('❌ IP rate limit error (10s):', error2);
      return { ok: false, error: 'Burst limit check failed' };
    }

    const allowed1 = result1?.allowed || false;
    const allowed2 = result2?.allowed || false;
    const currentCount = result1?.current_count || 0;

    return {
      ok: allowed1 && allowed2,
      limit: perMin,
      remaining: Math.max(0, perMin - currentCount),
      reset: Math.ceil((new Date(result1?.window_end || new Date()).getTime() - Date.now()) / 1000)
    };

  } catch (error) {
    console.error('❌ IP rate limit Supabase error:', error);
    // Graceful fallback to memory
    const c1 = memIncr(`rate:ip:${ip}:m`, 60_000);
    const c2 = memIncr(`rate:ip:${ip}:10s`, 10_000);
    const ok = c1 <= perMin && c2 <= burst10s;
    return { 
      ok, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c1), 
      reset: Math.ceil(memTTLms(`rate:ip:${ip}:m`) / 1000),
      error: 'Fallback to memory'
    };
  }
}

// ================================================================
// USER RATE LIMITING - SUPABASE VERSION
// ================================================================

export async function userRateLimit(id: string, perMin = 30): Promise<RateResult> {
  if (!LIMITS_ENABLED) return { ok: true };
  
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 User rate limit fallback to memory');
    const c = memIncr(`rate:user:${id}:m`, 60_000);
    return { 
      ok: c <= perMin, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c), 
      reset: Math.ceil(memTTLms(`rate:user:${id}:m`) / 1000) 
    };
  }

  try {
    const { data: result, error } = await supabase
      .rpc('check_and_increment_rate_limit', {
        p_identifier: id,
        p_limit_type: 'user',
        p_endpoint: null,
        p_max_requests: perMin,
        p_window_minutes: 1
      });

    if (error) {
      console.error('❌ User rate limit error:', error);
      return { ok: false, error: 'User rate limit check failed' };
    }

    const allowed = result?.allowed || false;
    const currentCount = result?.current_count || 0;

    return {
      ok: allowed,
      limit: perMin,
      remaining: Math.max(0, perMin - currentCount),
      reset: Math.ceil((new Date(result?.window_end || new Date()).getTime() - Date.now()) / 1000)
    };

  } catch (error) {
    console.error('❌ User rate limit Supabase error:', error);
    // Graceful fallback to memory
    const c = memIncr(`rate:user:${id}:m`, 60_000);
    return { 
      ok: c <= perMin, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c), 
      reset: Math.ceil(memTTLms(`rate:user:${id}:m`) / 1000),
      error: 'Fallback to memory'
    };
  }
}

// ================================================================
// ENDPOINT RATE LIMITING - SUPABASE VERSION
// ================================================================

export async function endpointLimit(key: string, id: string, perMin = 5): Promise<RateResult> {
  if (!LIMITS_ENABLED) return { ok: true };
  
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 Endpoint rate limit fallback to memory');
    const c = memIncr(`ep:${key}:${id}:m`, 60_000);
    return { 
      ok: c <= perMin, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c), 
      reset: Math.ceil(memTTLms(`ep:${key}:${id}:m`) / 1000) 
    };
  }

  try {
    const { data: result, error } = await supabase
      .rpc('check_and_increment_rate_limit', {
        p_identifier: id,
        p_limit_type: 'endpoint',
        p_endpoint: key,
        p_max_requests: perMin,
        p_window_minutes: 1
      });

    if (error) {
      console.error('❌ Endpoint rate limit error:', error);
      return { ok: false, error: 'Endpoint rate limit check failed' };
    }

    const allowed = result?.allowed || false;
    const currentCount = result?.current_count || 0;

    return {
      ok: allowed,
      limit: perMin,
      remaining: Math.max(0, perMin - currentCount),
      reset: Math.ceil((new Date(result?.window_end || new Date()).getTime() - Date.now()) / 1000)
    };

  } catch (error) {
    console.error('❌ Endpoint rate limit Supabase error:', error);
    // Graceful fallback to memory
    const c = memIncr(`ep:${key}:${id}:m`, 60_000);
    return { 
      ok: c <= perMin, 
      limit: perMin, 
      remaining: Math.max(0, perMin - c), 
      reset: Math.ceil(memTTLms(`ep:${key}:${id}:m`) / 1000),
      error: 'Fallback to memory'
    };
  }
}

// ================================================================
// QUOTA MANAGEMENT - SUPABASE VERSION
// ================================================================

export async function incrQuota(id: string): Promise<number> {
  if (!LIMITS_ENABLED) return 0;
  
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 Quota increment fallback to memory');
    const today = new Date().toISOString().slice(0, 10);
    const key = `quota:${id}:${today}`;
    return memIncr(key, 86_400_000);
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    
    const { data: newCount, error } = await supabase
      .rpc('increment_daily_usage', {
        p_user_id: id,
        p_usage_date: today
      });

    if (error) {
      console.error('❌ Quota increment error:', error);
      // Fallback to memory
      const key = `quota:${id}:${today}`;
      return memIncr(key, 86_400_000);
    }

    return newCount || 1;

  } catch (error) {
    console.error('❌ Quota increment Supabase error:', error);
    // Fallback to memory
    const today = new Date().toISOString().slice(0, 10);
    const key = `quota:${id}:${today}`;
    return memIncr(key, 86_400_000);
  }
}

export async function getQuota(id: string): Promise<number> {
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 Quota get fallback to memory');
    const today = new Date().toISOString().slice(0, 10);
    const key = `quota:${id}:${today}`;
    return memGet(key);
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    
    const { data: count, error } = await supabase
      .rpc('get_daily_usage', {
        p_user_id: id,
        p_usage_date: today
      });

    if (error) {
      console.error('❌ Quota get error:', error);
      // Fallback to memory
      const key = `quota:${id}:${today}`;
      return memGet(key);
    }

    return count || 0;

  } catch (error) {
    console.error('❌ Quota get Supabase error:', error);
    // Fallback to memory
    const today = new Date().toISOString().slice(0, 10);
    const key = `quota:${id}:${today}`;
    return memGet(key);
  }
}

// ================================================================
// CONCURRENCY LOCKS - SUPABASE VERSION 
// ================================================================
// NOT: Concurrency locks için özel bir Supabase RPC yazmadık
// çünkü Redis'in atomic NX operasyonu Postgres'te daha kompleks
// Bu MVP için memory fallback kullanıyoruz, production'da
// Redis lock service'i ayrı tutulabilir

export async function acquireLock(
  id: string, 
  slots = 2, 
  ttlSec = 45
): Promise<LockResult> {
  if (!LIMITS_ENABLED) return { ok: true };
  
  // Concurrency locks için şimdilik memory kullanıyoruz
  // Redis'in atomic NX işlemi Postgres'te çok daha kompleks
  console.warn('🔄 Lock acquire using memory (Redis alternative needed for production)');
  
  const trySlots = Array.from({ length: slots }, (_, i) => String(i + 1));
  for (const s of trySlots) {
    const k = `lock:${id}:${s}`;
    const L = mem.locks.get(k);
    const t = now();
    if (!L || L.exp < t) {
      mem.locks.set(k, { exp: t + ttlSec * 1000 });
      return { ok: true, slot: s };
    }
  }
  return { ok: false };
}

export async function releaseLock(id: string, slot?: string): Promise<void> {
  if (!slot) return;
  const k = `lock:${id}:${slot}`;
  mem.locks.delete(k);
}

// ================================================================
// GLOBAL HOURLY LIMITS - SUPABASE VERSION
// ================================================================

export async function incrGlobalHour(limitPerHour = 5000): Promise<QuotaResult> {
  const key = `global:ai:count:${new Date().toISOString().slice(0,13)}`; // YYYY-MM-DDTHH
  const supabase = await getSupabase();
  
  // Fallback to memory if Supabase unavailable
  if (!supabase) {
    console.warn('🔄 Global hour increment fallback to memory');
    const c = memIncr(key, 2 * 60 * 60 * 1000);
    return { ok: c <= limitPerHour, count: c };
  }

  try {
    const currentHour = new Date().toISOString().slice(0,13);
    
    const { data: result, error } = await supabase
      .rpc('check_and_increment_rate_limit', {
        p_identifier: 'global_ai',
        p_limit_type: 'global',
        p_endpoint: currentHour,
        p_max_requests: limitPerHour,
        p_window_minutes: 60
      });

    if (error) {
      console.error('❌ Global hour increment error:', error);
      // Fallback to memory
      const c = memIncr(key, 2 * 60 * 60 * 1000);
      return { ok: c <= limitPerHour, count: c, error: 'Fallback to memory' };
    }

    const allowed = result?.allowed || false;
    const currentCount = result?.current_count || 0;

    return {
      ok: allowed,
      count: currentCount
    };

  } catch (error) {
    console.error('❌ Global hour increment Supabase error:', error);
    // Fallback to memory
    const c = memIncr(key, 2 * 60 * 60 * 1000);
    return { ok: c <= limitPerHour, count: c, error: 'Fallback to memory' };
  }
}

// ================================================================
// CONSTANTS & EXPORTS
// ================================================================

export const constants = {
  LIMITS_ENABLED,
  isProd,
};

// Legacy exports for backward compatibility
export { 
  ipRateLimit as ipRateLimit_v2,
  userRateLimit as userRateLimit_v2,
  endpointLimit as endpointLimit_v2,
  incrQuota as incrQuota_v2,
  getQuota as getQuota_v2
};

console.log('🚀 Limits service initialized (Supabase version)');
