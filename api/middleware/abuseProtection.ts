// ================================================================
// ABUSE PROTECTION MIDDLEWARE - PHASE 2.4
// ================================================================
// This middleware integrates IP rate limiting with anonymous abuse detection
// Provides comprehensive protection for all API endpoints

import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkIPRateLimit, RateLimitResult } from './rateLimit.js';
import { 
  checkRequestAnonymousAbuse, 
  trackRequestAnonymousUser,
  AnonymousAbuseResult,
  shouldBlockAnonymousUser,
  requiresCaptcha 
} from './anonymousAbuseDetection.js';
import { getSupabaseClient } from '../stripe/supabase-integration.js';

export interface AbuseProtectionResult {
  allowed: boolean;
  rateLimitResult?: RateLimitResult;
  anonymousAbuseResult?: AnonymousAbuseResult;
  captchaRequired: boolean;
  blockReason?: string;
  retryAfter?: number;
}

export interface AbuseProtectionOptions {
  enableRateLimiting?: boolean;
  enableAnonymousTracking?: boolean;
  enableAbuseDetection?: boolean;
  requireCaptcha?: boolean;
  logAbuseAttempts?: boolean;
}

/**
 * Comprehensive abuse protection middleware
 * Combines IP rate limiting with anonymous abuse detection
 */
export async function checkAbuseProtection(
  req: VercelRequest,
  res: VercelResponse,
  options: AbuseProtectionOptions = {}
): Promise<AbuseProtectionResult> {
  const {
    enableRateLimiting = true,
    enableAnonymousTracking = true,
    enableAbuseDetection = true,
    requireCaptcha = false,
    logAbuseAttempts = true
  } = options;

  try {
    // Step 1: Check IP rate limiting
    let rateLimitResult: RateLimitResult | undefined;
    if (enableRateLimiting) {
      rateLimitResult = await checkIPRateLimit(req, res);
      
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          rateLimitResult,
          captchaRequired: false,
          blockReason: `Rate limit exceeded: ${rateLimitResult.limitExceeded}`,
          retryAfter: rateLimitResult.retryAfter
        };
      }
    }

    // Step 2: Check anonymous abuse detection
    let anonymousAbuseResult: AnonymousAbuseResult | undefined;
    if (enableAnonymousTracking && enableAbuseDetection) {
      anonymousAbuseResult = await checkRequestAnonymousAbuse(req);
      
      // Check if user should be blocked due to abuse
      if (shouldBlockAnonymousUser(anonymousAbuseResult)) {
        if (logAbuseAttempts) {
          console.warn(`Abuse detected from IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
        }
        
        return {
          allowed: false,
          rateLimitResult,
          anonymousAbuseResult,
          captchaRequired: false,
          blockReason: `Abuse detected: ${anonymousAbuseResult.anonymousIdCount} anonymous IDs in 24h`
        };
      }
      
      // Check if CAPTCHA is required
      if (requiresCaptcha(anonymousAbuseResult)) {
        return {
          allowed: true,
          rateLimitResult,
          anonymousAbuseResult,
          captchaRequired: true,
          blockReason: `CAPTCHA required: ${anonymousAbuseResult.anonymousIdCount} anonymous IDs in 24h`
        };
      }
    }

    // Step 3: If all checks pass, allow the request
    return {
      allowed: true,
      rateLimitResult,
      anonymousAbuseResult,
      captchaRequired: false
    };

  } catch (error) {
    console.error('Abuse protection middleware error:', error);
    
    // On error, allow the request to proceed (fail open for safety)
    return {
      allowed: true,
      captchaRequired: false
    };
  }
}

/**
 * Track anonymous user creation with abuse detection
 * Should be called whenever a new anonymous ID is generated
 */
export async function trackAnonymousUserCreation(
  req: VercelRequest,
  anonymousId: string
): Promise<AnonymousAbuseResult> {
  try {
    return await trackRequestAnonymousUser(req, anonymousId);
  } catch (error) {
    console.error('Failed to track anonymous user creation:', error);
    
    // Return safe defaults on error
    return {
      isAbuse: false,
      anonymousIdCount: 1,
      captchaRequired: false,
      ipAddressHash: 'error',
      abuseThreshold: 3,
      captchaThreshold: 5,
      abuseScore: 0,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Apply abuse protection headers to response
 */
export function setAbuseProtectionHeaders(
  res: VercelResponse,
  result: AbuseProtectionResult
): void {
  // Set rate limit headers if available
  if (result.rateLimitResult) {
    res.setHeader('X-RateLimit-Limit', result.rateLimitResult.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', result.rateLimitResult.windowEnd);
  }
  
  // Set abuse protection headers
  res.setHeader('X-Abuse-Protection', 'enabled');
  res.setHeader('X-Abuse-Detected', result.blockReason ? 'true' : 'false');
  
  if (result.captchaRequired) {
    res.setHeader('X-Captcha-Required', 'true');
  }
  
  if (result.retryAfter) {
    res.setHeader('Retry-After', result.retryAfter);
  }
}

/**
 * Log abuse attempt for monitoring
 */
export function logAbuseAttempt(
  req: VercelRequest,
  result: AbuseProtectionResult
): void {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();
  
  const logData = {
    timestamp,
    clientIP,
    userAgent,
    endpoint: req.url,
    method: req.method,
    rateLimitExceeded: result.rateLimitResult?.limitExceeded || false,
    abuseDetected: result.anonymousAbuseResult?.isAbuse || false,
    captchaRequired: result.captchaRequired,
    blockReason: result.blockReason,
    anonymousIdCount: result.anonymousAbuseResult?.anonymousIdCount || 0
  };
  
  console.warn('Abuse attempt detected:', JSON.stringify(logData, null, 2));
}

/**
 * Get abuse protection status for monitoring
 */
export async function getAbuseProtectionStatus(): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    
    // Get system health
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_system_health');
    
    if (healthError) {
      console.error('Failed to get system health:', healthError);
      return { error: 'Failed to get system health' };
    }
    
    // Get abuse statistics
    const { data: abuseData, error: abuseError } = await supabase
      .rpc('get_abuse_statistics', { p_hours_back: 24 });
    
    if (abuseError) {
      console.error('Failed to get abuse statistics:', abuseError);
      return { error: 'Failed to get abuse statistics' };
    }
    
    return {
      systemHealth: healthData,
      abuseStatistics: abuseData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Failed to get abuse protection status:', error);
    return { error: 'Failed to get abuse protection status' };
  }
}

/**
 * Middleware factory for easy integration
 */
export function createAbuseProtectionMiddleware(options: AbuseProtectionOptions = {}) {
  return async (req: VercelRequest, res: VercelResponse, next?: () => void) => {
    const result = await checkAbuseProtection(req, res, options);
    
    // Set abuse protection headers
    setAbuseProtectionHeaders(res, result);
    
    // Log abuse attempts if enabled
    if (options.logAbuseAttempts && !result.allowed) {
      logAbuseAttempt(req, result);
    }
    
    // If request is blocked, return error response
    if (!result.allowed) {
      const statusCode = result.rateLimitResult?.limitExceeded ? 429 : 403;
      const message = result.blockReason || 'Access denied';
      
      res.status(statusCode).json({
        error: 'Access denied',
        message,
        retryAfter: result.retryAfter,
        captchaRequired: result.captchaRequired
      });
      return;
    }
    
    // If CAPTCHA is required, add header but allow request
    if (result.captchaRequired) {
      res.setHeader('X-Captcha-Required', 'true');
    }
    
    // Call next middleware if provided
    if (next) {
      next();
    }
  };
}
