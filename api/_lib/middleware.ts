// ================================================================
// ISOLATED MIDDLEWARE FUNCTIONS FOR API ENDPOINTS
// ================================================================
// This module contains all middleware functions needed by API endpoints
// Isolated from src/ to avoid cross-boundary import issues

import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getSupabaseClient } from './supabase.js';
import { extractClientIP } from './utils.js';

// ================================================================
// RATE LIMITING INTERFACES & FUNCTIONS
// ================================================================

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

// ================================================================
// ANONYMOUS ABUSE DETECTION INTERFACES & FUNCTIONS
// ================================================================

export interface AnonymousAbuseResult {
  isAbuse: boolean;
  anonymousIdCount: number;
  captchaRequired: boolean;
  ipAddressHash: string;
  abuseThreshold: number;
  captchaThreshold: number;
  abuseScore: number;
  checkedAt: string;
}

/**
 * Track anonymous user creation and detect abuse patterns
 * This function should be called whenever a new anonymous ID is generated
 */
export async function trackAnonymousUser(
  ip: string, 
  anonymousId: string
): Promise<AnonymousAbuseResult> {
  try {
    const supabase = getSupabaseClient();
    
    // Call the database function to track and detect abuse
    const { data, error } = await supabase
      .rpc('track_anonymous_user', {
        p_ip_address: ip,
        p_anonymous_id: anonymousId
      });
    
    if (error) {
      console.error('Anonymous user tracking failed:', error);
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
    
    // Parse the result from the database function
    const result = data as any;
    
    return {
      isAbuse: result.is_abuse || false,
      anonymousIdCount: result.anonymous_id_count || 1,
      captchaRequired: result.captcha_required || false,
      ipAddressHash: result.ip_address_hash || 'unknown',
      abuseThreshold: result.abuse_threshold || 3,
      captchaThreshold: result.captcha_threshold || 5,
      abuseScore: result.abuse_score || 0,
      checkedAt: result.tracked_at || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Anonymous abuse detection error:', error);
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
 * Check if an IP address has abuse patterns
 * This function can be used to check abuse status without tracking
 */
export async function checkAnonymousAbuse(
  ip: string
): Promise<AnonymousAbuseResult> {
  try {
    const supabase = getSupabaseClient();
    
    // Call the database function to check abuse status
    const { data, error } = await supabase
      .rpc('check_anonymous_abuse', {
        p_ip_address: ip
      });
    
    if (error) {
      console.error('Anonymous abuse check failed:', error);
      // Return safe defaults on error
      return {
        isAbuse: false,
        anonymousIdCount: 0,
        captchaRequired: false,
        ipAddressHash: 'error',
        abuseThreshold: 3,
        captchaThreshold: 5,
        abuseScore: 0,
        checkedAt: new Date().toISOString()
      };
    }
    
    // Parse the result from the database function
    const result = data as any;
    
    return {
      isAbuse: result.is_abuse || false,
      anonymousIdCount: result.anonymous_id_count || 0,
      captchaRequired: result.captcha_required || false,
      ipAddressHash: result.ip_address_hash || 'unknown',
      abuseThreshold: result.abuse_threshold || 3,
      captchaThreshold: result.captcha_threshold || 5,
      abuseScore: result.abuse_score || 0,
      checkedAt: result.checked_at || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Anonymous abuse check error:', error);
    // Return safe defaults on error
    return {
      isAbuse: false,
      anonymousIdCount: 0,
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
 * Check anonymous abuse for the current request
 * Extracts IP from request and checks abuse status
 */
export async function checkRequestAnonymousAbuse(
  req: VercelRequest
): Promise<AnonymousAbuseResult> {
  const clientIP = extractClientIP(req);
  return await checkAnonymousAbuse(clientIP);
}

/**
 * Track anonymous user creation for the current request
 * Extracts IP from request and tracks the anonymous ID
 */
export async function trackRequestAnonymousUser(
  req: VercelRequest,
  anonymousId: string
): Promise<AnonymousAbuseResult> {
  const clientIP = extractClientIP(req);
  return await trackAnonymousUser(clientIP, anonymousId);
}

/**
 * Check if an anonymous user should be blocked due to abuse
 * Returns true if the user should be blocked
 */
export function shouldBlockAnonymousUser(abuseResult: AnonymousAbuseResult): boolean {
  return abuseResult.isAbuse;
}

/**
 * Check if an anonymous user requires CAPTCHA due to abuse
 * Returns true if CAPTCHA should be shown
 */
export function requiresCaptcha(abuseResult: AnonymousAbuseResult): boolean {
  return abuseResult.captchaRequired;
}

// ================================================================
// CAPTCHA SERVICE FUNCTIONS (SIMPLIFIED)
// ================================================================

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  challengeId?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

/**
 * Simple CAPTCHA service for API endpoints
 * Minimal version without heavy dependencies
 */
export class CaptchaService {
  private readonly secretKey: string;
  private readonly siteKey: string;
  private readonly verifyUrl = 'https://hcaptcha.com/siteverify';

  constructor() {
    this.secretKey = process.env.HCAPTCHA_SECRET_KEY || '';
    this.siteKey = process.env.HCAPTCHA_SITE_KEY || '';
    
    if (!this.secretKey) {
      console.warn('HCAPTCHA_SECRET_KEY not set - CAPTCHA verification will fail');
    }
    
    if (!this.siteKey) {
      console.warn('HCAPTCHA_SITE_KEY not set - CAPTCHA frontend will not work');
    }
  }

  /**
   * Verify hCaptcha token from frontend
   */
  async verifyCaptchaToken(token: string, clientIP?: string): Promise<CaptchaVerificationResult> {
    try {
      if (!this.secretKey) {
        return {
          success: false,
          error: 'CAPTCHA service not configured'
        };
      }

      if (!token) {
        return {
          success: false,
          error: 'No CAPTCHA token provided'
        };
      }

      // Prepare verification request
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      
      if (clientIP) {
        formData.append('remoteip', clientIP);
      }

      // Send verification request to hCaptcha
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`hCaptcha API request failed: ${response.status}`);
      }

      const result = await response.json() as any;

      if (result.success) {
        return {
          success: true,
          challengeId: result.challenge_ts,
          verifiedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        };
      } else {
        // hCaptcha verification failed
        const errorCodes = result['error-codes'] || [];
        const errorMessage = this.getErrorMessage(errorCodes);
        
        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      
      return {
        success: false,
        error: 'CAPTCHA verification failed'
      };
    }
  }

  /**
   * Get human-readable error message from hCaptcha error codes
   */
  private getErrorMessage(errorCodes: string[]): string {
    const errorMessages: Record<string, string> = {
      'missing-input-secret': 'Missing secret key',
      'invalid-input-secret': 'Invalid secret key',
      'missing-input-response': 'Missing CAPTCHA response',
      'invalid-input-response': 'Invalid CAPTCHA response',
      'bad-request': 'Bad request',
      'timeout-or-duplicate': 'CAPTCHA expired or duplicate',
      'invalid-remoteip': 'Invalid remote IP address',
      'sitekey-secret-mismatch': 'Site key and secret mismatch'
    };

    if (errorCodes.length === 0) {
      return 'Unknown CAPTCHA error';
    }

    const messages = errorCodes.map(code => errorMessages[code] || code);
    return messages.join(', ');
  }

  /**
   * Check if CAPTCHA service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.secretKey && this.siteKey);
  }

  /**
   * Get public site key for frontend
   */
  getSiteKey(): string {
    return this.siteKey;
  }

  /**
   * Generate a unique challenge ID using cryptographically secure random
   */
  generateChallengeId(): string {
    return `captcha_${Date.now()}_${randomUUID()}`;
  }

  /**
   * Validate CAPTCHA token format (basic validation)
   */
  validateTokenFormat(token: string): boolean {
    // hCaptcha tokens are typically long alphanumeric strings
    return !!(token && token.length > 20 && /^[a-zA-Z0-9_-]+$/.test(token));
  }
}

// Export singleton instance
export const captchaService = new CaptchaService();

// ================================================================
// ENHANCED ABUSE PROTECTION (SIMPLIFIED)
// ================================================================

export interface EnhancedAbuseProtectionResult {
  allowed: boolean;
  captchaRequired: boolean;
  bypassAllowed: boolean;
  abuseScore: number;
  reason: string;
  challengeId?: string;
  siteKey?: string;
  expiresAt?: string;
  retryAfter?: number;
  blockReason?: string;
}

/**
 * Create a CAPTCHA challenge when required
 * Generates challenge and tracks it for verification
 */
export async function createEnhancedCaptchaChallenge(
  req: VercelRequest
): Promise<{
  challengeId: string;
  siteKey: string;
  expiresAt: string;
  abuseScore: number;
} | null> {
  try {
    // Check if CAPTCHA is actually required
    const conditionalResult = await checkRequestAnonymousAbuse(req);
    
    if (!conditionalResult.captchaRequired) {
      return null; // No CAPTCHA needed
    }
    
    // Create the challenge
    const challengeId = captchaService.generateChallengeId();
    
    return {
      challengeId,
      siteKey: captchaService.getSiteKey(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      abuseScore: conditionalResult.abuseScore
    };
    
  } catch (error) {
    console.error('Failed to create enhanced CAPTCHA challenge:', error);
    return null;
  }
}

/**
 * Check if user can bypass CAPTCHA based on their history
 */
export async function checkCaptchaBypass(
  req: VercelRequest
): Promise<{ allowed: boolean; reason: string; abuseScore: number; expiresAt?: string }> {
  try {
    // Check current abuse status
    const abuseResult = await checkRequestAnonymousAbuse(req);
    
    // Bypass allowed for users with minimal abuse (score < 20)
    const bypassAllowed = abuseResult.abuseScore < 20 || abuseResult.anonymousIdCount <= 2;
    
    return {
      allowed: bypassAllowed,
      reason: bypassAllowed ? 'Low abuse score, bypass allowed' : 'Abuse detected, bypass denied',
      abuseScore: abuseResult.abuseScore || 0,
      expiresAt: bypassAllowed ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined // 1 hour
    };
    
  } catch (error) {
    console.error('CAPTCHA bypass check error:', error);
    
    // On error, deny bypass (fail closed for security)
    return {
      allowed: false,
      reason: 'Error occurred during bypass check',
      abuseScore: 100
    };
  }
}

/**
 * Check conditional CAPTCHA requirement
 */
export async function checkConditionalCaptcha(
  req: VercelRequest
): Promise<{
  captchaRequired: boolean;
  bypassAllowed: boolean;
  abuseScore: number;
  reason: string;
  challengeType: 'hcaptcha' | null;
  siteKey?: string;
  expiresAt?: string;
}> {
  try {
    // Check IP rate limiting
    const rateLimitResult = await checkIPRateLimit(req, {} as any);
    
    // Check anonymous abuse detection
    const abuseResult = await checkRequestAnonymousAbuse(req);
    
    // Determine if CAPTCHA is required
    const captchaRequired = !rateLimitResult.allowed || 
                           abuseResult.abuseScore >= 80 || 
                           abuseResult.anonymousIdCount >= 5 || 
                           abuseResult.captchaRequired;
    
    // Check if bypass is allowed for legitimate users
    const bypassAllowed = rateLimitResult.allowed && 
                         abuseResult.abuseScore < 20 && 
                         abuseResult.anonymousIdCount <= 2;
    
    let reason = 'No CAPTCHA required';
    if (!rateLimitResult.allowed) {
      reason = `Rate limit exceeded: ${rateLimitResult.limitExceeded}`;
    } else if (abuseResult.abuseScore >= 80) {
      reason = `Critical abuse score: ${abuseResult.abuseScore}/100`;
    } else if (abuseResult.anonymousIdCount >= 5) {
      reason = `Multiple anonymous IDs: ${abuseResult.anonymousIdCount} in 24h`;
    }
    
    return {
      captchaRequired,
      bypassAllowed,
      abuseScore: abuseResult.abuseScore || 0,
      reason,
      challengeType: captchaRequired ? 'hcaptcha' : null,
      siteKey: captchaRequired ? captchaService.getSiteKey() : undefined,
      expiresAt: captchaRequired ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : undefined // 30 minutes
    };
    
  } catch (error) {
    console.error('Conditional CAPTCHA check error:', error);
    
    // On error, allow request to proceed (fail open for safety)
    return {
      captchaRequired: false,
      bypassAllowed: true,
      abuseScore: 0,
      reason: 'Error occurred during CAPTCHA check',
      challengeType: null
    };
  }
}

// ================================================================
// ABUSE PROTECTION STATUS (SIMPLIFIED)
// ================================================================

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

// ================================================================
// AUTHENTICATION & CORS MIDDLEWARE
// ================================================================

/**
 * Type for Vercel API handler function
 */
export type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

/**
 * Extended request with authenticated user
 */
export interface AuthenticatedRequest extends VercelRequest {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * Extended request with user (authenticated or anonymous)
 */
export interface UserRequest extends VercelRequest {
  userId: string;
  isAnonymous: boolean;
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  } | null;
}

/**
 * CORS middleware - handles CORS headers for allowed origins
 *
 * @param handler - The API handler to wrap
 * @returns Wrapped handler with CORS support
 *
 * @example
 * ```typescript
 * export default withCORS(async (req, res) => {
 *   // Your API logic here
 * });
 * ```
 */
export function withCORS(handler: ApiHandler): ApiHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const origin = req.headers.origin || '';

    // List of allowed origins
    const allowedOrigins = [
      'https://resumetune.io',
      'https://www.resumetune.io',
      'http://localhost:5173',
      'http://localhost:5174', // Alternate dev port
      'http://localhost:3000'  // Alternate dev port
    ];

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Captcha-Token, X-User-Id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Call the actual handler
    return handler(req, res);
  };
}

/**
 * Authentication middleware - validates JWT token and attaches user to request
 * Returns 401 if authentication fails
 *
 * @param handler - The API handler to wrap
 * @returns Wrapped handler with authentication
 *
 * @example
 * ```typescript
 * export default withAuth(async (req: AuthenticatedRequest, res) => {
 *   const userId = req.user.id;
 *   // Your API logic here
 * });
 * ```
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void> | void): ApiHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const { validateSession } = await import('./auth.js');
    const { user, error } = await validateSession(req);

    if (error || !user) {
      return res.status(error?.status || 401).json({
        error: {
          code: error?.code || 'UNAUTHENTICATED',
          message: error?.message || 'Authentication required'
        }
      });
    }

    // Attach user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    // Call the actual handler with authenticated request
    return handler(authenticatedReq, res);
  };
}

/**
 * Flexible authentication middleware - validates JWT token but allows anonymous users
 * Attaches userId and user to request (user will be null for anonymous)
 *
 * @param handler - The API handler to wrap
 * @returns Wrapped handler with user context
 *
 * @example
 * ```typescript
 * export default withOptionalAuth(async (req: UserRequest, res) => {
 *   if (req.isAnonymous) {
 *     // Handle anonymous user
 *   } else {
 *     // Handle authenticated user
 *   }
 * });
 * ```
 */
export function withOptionalAuth(handler: (req: UserRequest, res: VercelResponse) => Promise<void> | void): ApiHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const { validateSessionOrAnonymous } = await import('./auth.js');
    const { userId, isAnonymous, user, error } = await validateSessionOrAnonymous(req);

    // If there's an error and no userId (not even anonymous), return 401
    if (error && !userId) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    // Attach user context to request
    const userReq = req as UserRequest;
    userReq.userId = userId;
    userReq.isAnonymous = isAnonymous;
    userReq.user = user;

    // Call the actual handler with user context
    return handler(userReq, res);
  };
}

/**
 * Method validation middleware - ensures only specified HTTP methods are allowed
 *
 * @param methods - Array of allowed HTTP methods
 * @param handler - The API handler to wrap
 * @returns Wrapped handler with method validation
 *
 * @example
 * ```typescript
 * export default withMethods(['POST'], async (req, res) => {
 *   // Only POST requests will reach here
 * });
 * ```
 */
export function withMethods(methods: string[], handler: ApiHandler): ApiHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (!methods.includes(req.method || '')) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed. Allowed methods: ${methods.join(', ')}`
        }
      });
    }

    return handler(req, res);
  };
}

/**
 * Compose multiple middleware functions
 * Applies middleware from left to right
 *
 * @param middlewares - Array of middleware functions
 * @returns Composed middleware function
 *
 * @example
 * ```typescript
 * export default compose([
 *   withCORS,
 *   withAuth,
 *   (handler) => withMethods(['POST'], handler)
 * ])(async (req: AuthenticatedRequest, res) => {
 *   // Your API logic here
 * });
 * ```
 */
export function compose(middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Validation middleware using Zod schemas
 * Validates request body against a Zod schema and returns structured errors
 *
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates req.body
 *
 * @example
 * ```typescript
 * export default compose([
 *   withCORS,
 *   withAuth,
 *   withValidation(consumeCreditSchema),
 *   (handler) => withMethods(['POST'], handler)
 * ])(handler);
 * ```
 */
export function withValidation<T extends z.ZodType>(schema: T) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: VercelRequest, res: VercelResponse) => {
      try {
        // Parse and validate request body
        const validationResult = schema.safeParse(req.body);

        if (!validationResult.success) {
          // Extract validation errors
          const errors = validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }));

          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: errors
            }
          });
        }

        // Attach validated data to request for type safety
        (req as any).validatedBody = validationResult.data;

        // Continue to next handler
        return handler(req, res);
      } catch (error) {
        console.error('Validation middleware error:', error);
        return res.status(500).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Failed to validate request'
          }
        });
      }
    };
  };
}

/**
 * Helper to send standardized error responses
 *
 * @param res - Response object
 * @param status - HTTP status code
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional additional error details
 */
export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  details?: any
): void {
  const response: ErrorResponse = {
    error: {
      code,
      message
    }
  };

  if (details) {
    response.error.details = details;
  }

  res.status(status).json(response);
}
