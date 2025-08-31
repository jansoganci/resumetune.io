// ================================================================
// ENHANCED ABUSE PROTECTION WITH CONDITIONAL CAPTCHA - PHASE 3.2
// ================================================================
// This middleware integrates conditional CAPTCHA logic with abuse protection
// Provides progressive CAPTCHA display based on abuse patterns

import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAbuseProtection, AbuseProtectionResult } from './abuseProtection.js';
import { 
  checkConditionalCaptcha, 
  ConditionalCaptchaResult,
  createCaptchaChallenge,
  checkCaptchaBypass,
  trackCaptchaCompletion
} from './conditionalCaptcha.js';
import { captchaService } from './captchaService.js';

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

export interface EnhancedAbuseProtectionOptions {
  enableRateLimiting?: boolean;
  enableAnonymousTracking?: boolean;
  enableAbuseDetection?: boolean;
  enableConditionalCaptcha?: boolean;
  requireCaptcha?: boolean;
  logAbuseAttempts?: boolean;
  trackCaptchaCompletions?: boolean;
}

/**
 * Enhanced abuse protection with conditional CAPTCHA
 * Combines all protection layers with intelligent CAPTCHA display
 */
export async function checkEnhancedAbuseProtection(
  req: VercelRequest,
  res: VercelResponse,
  options: EnhancedAbuseProtectionOptions = {}
): Promise<EnhancedAbuseProtectionResult> {
  const {
    enableRateLimiting = true,
    enableAnonymousTracking = true,
    enableAbuseDetection = true,
    enableConditionalCaptcha = true,
    requireCaptcha = false,
    logAbuseAttempts = true,
    trackCaptchaCompletions = true
  } = options;

  try {
    // Step 1: Basic abuse protection check
    const basicProtection = await checkAbuseProtection(req, res, {
      enableRateLimiting,
      enableAnonymousTracking,
      enableAbuseDetection,
      requireCaptcha,
      logAbuseAttempts
    });

    // If basic protection blocks the request, return immediately
    if (!basicProtection.allowed) {
      return {
        allowed: false,
        captchaRequired: false,
        bypassAllowed: false,
        abuseScore: 0,
        reason: basicProtection.blockReason || 'Access denied',
        retryAfter: basicProtection.retryAfter,
        blockReason: basicProtection.blockReason
      };
    }

    // Step 2: Conditional CAPTCHA check (if enabled)
    let conditionalCaptcha: ConditionalCaptchaResult | undefined;
    if (enableConditionalCaptcha) {
      conditionalCaptcha = await checkConditionalCaptcha(req);
      
      // If CAPTCHA is required, check if bypass is allowed
      if (conditionalCaptcha.captchaRequired) {
        const bypassCheck = await checkCaptchaBypass(req);
        
        // Update bypass status
        conditionalCaptcha.bypassAllowed = bypassCheck.allowed;
        
        // If bypass is allowed, no CAPTCHA needed
        if (bypassCheck.allowed) {
          conditionalCaptcha.captchaRequired = false;
        }
      }
    }

    // Step 3: Build enhanced result
    const result: EnhancedAbuseProtectionResult = {
      allowed: true, // Request is allowed to proceed
      captchaRequired: conditionalCaptcha?.captchaRequired || false,
      bypassAllowed: conditionalCaptcha?.bypassAllowed || true,
      abuseScore: conditionalCaptcha?.abuseScore || 0,
      reason: conditionalCaptcha?.reason || 'No CAPTCHA required',
      challengeId: conditionalCaptcha?.captchaRequired ? undefined : undefined, // Will be generated when needed
      siteKey: conditionalCaptcha?.siteKey,
      expiresAt: conditionalCaptcha?.expiresAt
    };

    // Step 4: Set appropriate headers
    setEnhancedAbuseProtectionHeaders(res, result);

    return result;

  } catch (error) {
    console.error('Enhanced abuse protection error:', error);
    
    // On error, allow the request to proceed (fail open for safety)
    return {
      allowed: true,
      captchaRequired: false,
      bypassAllowed: true,
      abuseScore: 0,
      reason: 'Error occurred during protection check'
    };
  }
}

/**
 * Create a CAPTCHA challenge when required
 * Generates challenge and tracks it for verification
 */
export async function createEnhancedCaptchaChallenge(
  req: VercelRequest,
  userId?: string
): Promise<{
  challengeId: string;
  siteKey: string;
  expiresAt: string;
  abuseScore: number;
} | null> {
  try {
    // Check if CAPTCHA is actually required
    const conditionalResult = await checkConditionalCaptcha(req);
    
    if (!conditionalResult.captchaRequired) {
      return null; // No CAPTCHA needed
    }
    
    // Create the challenge
    const challenge = await createCaptchaChallenge(req, userId);
    
    return {
      challengeId: challenge.challengeId,
      siteKey: challenge.siteKey,
      expiresAt: challenge.expiresAt,
      abuseScore: challenge.abuseScore
    };
    
  } catch (error) {
    console.error('Failed to create enhanced CAPTCHA challenge:', error);
    return null;
  }
}

/**
 * Verify CAPTCHA completion and track it
 * Integrates verification with completion tracking
 */
export async function verifyAndTrackCaptcha(
  req: VercelRequest,
  token: string,
  challengeId: string,
  userId?: string
): Promise<{
  success: boolean;
  error?: string;
  challengeId: string;
  verifiedAt: string;
  expiresAt: string;
}> {
  try {
    // Verify the CAPTCHA token
    const verificationResult = await captchaService.verifyCaptchaToken(
      token,
      extractClientIP(req)
    );
    
    // Track completion regardless of success/failure
    await trackCaptchaCompletion(req, challengeId, verificationResult.success, userId);
    
    return {
      ...verificationResult,
      challengeId: challengeId, // Use the passed challengeId parameter
      verifiedAt: verificationResult.verifiedAt || new Date().toISOString(),
      expiresAt: verificationResult.expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    };
    
  } catch (error) {
    console.error('CAPTCHA verification and tracking error:', error);
    
    // Track failed attempt
    await trackCaptchaCompletion(req, challengeId, false, userId);
    
    return {
      success: false,
      error: 'CAPTCHA verification failed',
      challengeId,
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString()
    };
  }
}

/**
 * Set enhanced abuse protection headers
 * Includes CAPTCHA-specific headers
 */
function setEnhancedAbuseProtectionHeaders(
  res: VercelResponse,
  result: EnhancedAbuseProtectionResult
): void {
  // Set basic abuse protection headers
  res.setHeader('X-Abuse-Protection', 'enabled');
  res.setHeader('X-Abuse-Score', result.abuseScore.toString());
  
  // Set CAPTCHA-specific headers
  if (result.captchaRequired) {
    res.setHeader('X-Captcha-Required', 'true');
    res.setHeader('X-Captcha-Bypass-Allowed', result.bypassAllowed.toString());
    
    if (result.expiresAt) {
      res.setHeader('X-Captcha-Expires', result.expiresAt);
    }
  } else {
    res.setHeader('X-Captcha-Required', 'false');
  }
  
  // Set bypass information
  if (result.bypassAllowed) {
    res.setHeader('X-Captcha-Bypass-Eligible', 'true');
  }
}

/**
 * Check if user should see progressive CAPTCHA
 * Implements intelligent CAPTCHA display timing
 */
export async function shouldShowProgressiveCaptcha(
  req: VercelRequest,
  userId?: string
): Promise<{
  show: boolean;
  reason: string;
  abuseScore: number;
  bypassEligible: boolean;
}> {
  try {
    const conditionalResult = await checkConditionalCaptcha(req);
    const bypassCheck = await checkCaptchaBypass(req, userId);
    
    // Progressive CAPTCHA logic:
    // 1. Show immediately for critical abuse (score >= 80)
    // 2. Show after delay for moderate abuse (score 40-79)
    // 3. Show only on specific actions for low abuse (score 20-39)
    // 4. Never show for minimal abuse (score < 20)
    
    let show = false;
    let reason = 'No abuse detected';
    
    if (conditionalResult.abuseScore >= 80) {
      show = true;
      reason = 'Critical abuse detected - immediate CAPTCHA';
    } else if (conditionalResult.abuseScore >= 40) {
      show = true;
      reason = 'Moderate abuse detected - CAPTCHA required';
    } else if (conditionalResult.abuseScore >= 20) {
      show = false; // Show only on specific actions
      reason = 'Low abuse detected - conditional CAPTCHA';
    } else {
      show = false;
      reason = 'Minimal abuse - no CAPTCHA needed';
    }
    
    return {
      show: show && !bypassCheck.allowed,
      reason,
      abuseScore: conditionalResult.abuseScore,
      bypassEligible: bypassCheck.allowed
    };
    
  } catch (error) {
    console.error('Progressive CAPTCHA check error:', error);
    
    // On error, don't show CAPTCHA (fail safe)
    return {
      show: false,
      reason: 'Error occurred during check',
      abuseScore: 0,
      bypassEligible: true
    };
  }
}

/**
 * Get comprehensive abuse protection status
 * Provides detailed information for monitoring and debugging
 */
export async function getEnhancedAbuseProtectionStatus(
  req: VercelRequest
): Promise<{
  basicProtection: any;
  conditionalCaptcha: ConditionalCaptchaResult;
  bypassEligibility: any;
  progressiveCaptcha: any;
  timestamp: string;
}> {
  try {
    // Get all protection statuses
    const basicProtection = await checkAbuseProtection(req, {} as any, {});
    const conditionalCaptcha = await checkConditionalCaptcha(req);
    const bypassEligibility = await checkCaptchaBypass(req);
    const progressiveCaptcha = await shouldShowProgressiveCaptcha(req);
    
    return {
      basicProtection,
      conditionalCaptcha,
      bypassEligibility,
      progressiveCaptcha,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Failed to get enhanced abuse protection status:', error);
    
    return {
      basicProtection: { error: 'Failed to get status' },
      conditionalCaptcha: { error: 'Failed to get status' } as any,
      bypassEligibility: { error: 'Failed to get status' },
      progressiveCaptcha: { error: 'Failed to get status' },
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to extract client IP
function extractClientIP(req: VercelRequest): string {
  return (req.headers['x-forwarded-for'] as string) || 
         (req.headers['x-real-ip'] as string) || 
         req.socket.remoteAddress || 
         'unknown';
}
