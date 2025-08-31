// ================================================================
// IP RATE LIMITING MIDDLEWARE
// ================================================================
// This middleware implements IP-based rate limiting using the
// rate_limits table and RPC functions created in the migration

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../stripe/supabase-integration.js';
import { extractClientIP } from '../utils/ipUtils.js';

export interface RateLimitResult {
  allowed: boolean;
  limitExceeded?: 'hourly' | 'daily';
  currentCount: number;
  maxRequests: number;
  remaining: number;
  retryAfter: number;
  windowEnd: string;
}

/**
 * Check IP rate limits for the current request
 * Returns rate limit status and sets appropriate headers
 */
export async function checkIPRateLimit(
  req: VercelRequest, 
  res: VercelResponse
): Promise<RateLimitResult> {
  try {
    // Extract client IP
    const clientIP = extractClientIP(req);
    
    // Get Supabase client
    const supabase = getSupabaseClient();
    
    // Check both hourly and daily limits
    const { data, error } = await supabase
      .rpc('check_ip_rate_limits_both', {
        p_ip_address: clientIP
      });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the request to proceed (fail open for safety)
      return {
        allowed: true,
        currentCount: 0,
        maxRequests: 100,
        remaining: 100,
        retryAfter: 0,
        windowEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };
    }
    
    const result = data as any;
    
    // Set rate limit headers
    setRateLimitHeaders(res, result);
    
    // Return rate limit result
    return {
      allowed: result.allowed,
      limitExceeded: result.limit_exceeded || undefined,
      currentCount: result.hourly?.current_count || 0,
      maxRequests: result.hourly?.max_requests || 100,
      remaining: result.hourly?.remaining || 0,
      retryAfter: result.retry_after || 0,
      windowEnd: result.hourly?.window_end || new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
    
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // On error, allow the request to proceed (fail open for safety)
    return {
      allowed: true,
      currentCount: 0,
      maxRequests: 100,
      remaining: 100,
      retryAfter: 0,
      windowEnd: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
  }
}

/**
 * Set rate limit headers on the response
 */
function setRateLimitHeaders(res: VercelResponse, result: any): void {
  const hourly = result.hourly || {};
  const daily = result.daily || {};
  
  // Set standard rate limit headers
  res.setHeader('X-RateLimit-Limit-Hourly', hourly.max_requests || 100);
  res.setHeader('X-RateLimit-Remaining-Hourly', hourly.remaining || 0);
  res.setHeader('X-RateLimit-Reset-Hourly', Math.floor(new Date(hourly.window_end || Date.now() + 60 * 60 * 1000).getTime() / 1000));
  
  res.setHeader('X-RateLimit-Limit-Daily', daily.max_requests || 300);
  res.setHeader('X-RateLimit-Remaining-Daily', daily.remaining || 0);
  res.setHeader('X-RateLimit-Reset-Daily', Math.floor(new Date(daily.window_end || Date.now() + 24 * 60 * 60 * 1000).getTime() / 1000));
  
  // Set retry-after header if rate limited
  if (!result.allowed && result.retry_after > 0) {
    res.setHeader('Retry-After', result.retry_after.toString());
  }
}

/**
 * Send rate limit exceeded response
 */
export function sendRateLimitResponse(
  res: VercelResponse, 
  result: RateLimitResult
): void {
  setRateLimitHeaders(res, result);
  
  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. ${result.limitExceeded === 'hourly' ? 'Hourly' : 'Daily'} limit of ${result.maxRequests} requests reached.`,
      limitType: result.limitExceeded,
      retryAfter: result.retryAfter,
      windowEnd: result.windowEnd
    }
  });
}

/**
 * Simple rate limit check that can be used inline
 * Returns true if request should be allowed, false if rate limited
 */
export async function isRateLimitAllowed(ip: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .rpc('check_ip_rate_limits_both', {
        p_ip_address: ip
      });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail open on error
    }
    
    return data?.allowed || false;
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Fail open on error
  }
}
