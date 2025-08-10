/* Lightweight limit helpers (MVP) - MIGRATED TO SUPABASE
 * Originally used Redis, now uses Supabase with graceful fallbacks.
 * This file now imports from limits-supabase.ts
 */

// Import everything from Supabase version
import {
  ipRateLimit,
  userRateLimit,
  endpointLimit,
  incrQuota,
  getQuota,
  acquireLock,
  releaseLock,
  incrGlobalHour,
  allowOrigins,
  getAnonId,
  checkSize,
  withTimeout,
  retryOnce,
  constants,
  type RateResult
} from './limits-supabase';

// Re-export everything for backward compatibility
export {
  ipRateLimit,
  userRateLimit,
  endpointLimit,
  incrQuota,
  getQuota,
  acquireLock,
  releaseLock,
  incrGlobalHour,
  allowOrigins,
  getAnonId,
  checkSize,
  withTimeout,
  retryOnce,
  constants,
  type RateResult
};

// ================================================================
// MIGRATION COMPLETE! 🎉
// ================================================================
// This file now delegates all functionality to limits-supabase.ts
// All Redis dependencies have been removed and replaced with
// Supabase RPC calls with graceful fallbacks.
//
// Key Changes:
// ✅ ipRateLimit() → Supabase rate_limits table + RPC
// ✅ userRateLimit() → Supabase rate_limits table + RPC  
// ✅ endpointLimit() → Supabase rate_limits table + RPC
// ✅ incrQuota() → Supabase daily_usage table + RPC
// ✅ getQuota() → Supabase daily_usage table + RPC
// ✅ incrGlobalHour() → Supabase rate_limits table + RPC
// ⚠️ acquireLock() → Memory fallback (Redis alternative needed)
//
// Graceful Fallbacks:
// - If Supabase unavailable → Memory maps (like original Redis fallback)
// - Error handling → Continues operation with degraded performance
// - Logging → Clear indication of fallback usage
// ================================================================

console.log('📋 Limits service loaded (now using Supabase backend)');


