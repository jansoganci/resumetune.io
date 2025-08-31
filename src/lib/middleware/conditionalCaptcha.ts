// ================================================================
// CONDITIONAL CAPTCHA LOGIC - PHASE 3.2
// ================================================================
// This middleware implements conditional CAPTCHA logic
// Only shows CAPTCHA when abuse patterns are detected

import { VercelRequest } from '@vercel/node';
import { captchaService } from './captchaService.js';
import { checkRequestAnonymousAbuse, AnonymousAbuseResult } from './anonymousAbuseDetection.js';
import { checkIPRateLimit, RateLimitResult } from './rateLimit.js';
import { extractClientIP } from '../utils/ipUtils.js';

export interface ConditionalCaptchaResult {
  captchaRequired: boolean;
  bypassAllowed: boolean;
  abuseScore: number;
  reason: string;
  challengeType: 'hcaptcha' | null;
  siteKey?: string;
  expiresAt?: string;
}

export interface CaptchaBypassResult {
  allowed: boolean;
  reason: string;
  expiresAt?: string;
  abuseScore: number;
}

export interface CaptchaChallengeResult {
  challengeId: string;
  challengeType: 'hcaptcha';
  siteKey: string;
  expiresAt: string;
  abuseScore: number;
}

/**
 * Check if CAPTCHA is required based on abuse patterns
 * Implements the conditional logic: only show CAPTCHA when abuse detected
 */
export async function checkConditionalCaptcha(
  req: VercelRequest
): Promise<ConditionalCaptchaResult> {
  try {
    // Step 1: Check IP rate limiting
    const rateLimitResult = await checkIPRateLimit(req, {} as any);
    
    // Step 2: Check anonymous abuse detection
    const abuseResult = await checkRequestAnonymousAbuse(req);
    
    // Step 3: Determine if CAPTCHA is required
    const captchaRequired = determineCaptchaRequirement(rateLimitResult, abuseResult);
    
    // Step 4: Check if bypass is allowed for legitimate users
    const bypassAllowed = checkBypassEligibility(abuseResult, rateLimitResult);
    
    // Step 5: Build result
    const result: ConditionalCaptchaResult = {
      captchaRequired,
      bypassAllowed,
      abuseScore: abuseResult.abuseScore || 0,
      reason: getCaptchaReason(abuseResult, rateLimitResult),
      challengeType: captchaRequired ? 'hcaptcha' : null,
      siteKey: captchaRequired ? captchaService.getSiteKey() : undefined,
      expiresAt: captchaRequired ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : undefined // 30 minutes
    };
    
    return result;
    
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

/**
 * Determine if CAPTCHA is required based on abuse patterns
 * Implements the 3-5 anonymous IDs per IP threshold logic
 */
function determineCaptchaRequirement(
  rateLimitResult: RateLimitResult,
  abuseResult: AnonymousAbuseResult
): boolean {
  // CAPTCHA required if:
  // 1. Rate limit exceeded (immediate CAPTCHA)
  if (!rateLimitResult.allowed) {
    return true;
  }
  
  // 2. Abuse score is critical (80+)
  if (abuseResult.abuseScore >= 80) {
    return true;
  }
  
  // 3. 5+ anonymous IDs per IP in 24h (as per roadmap)
  if (abuseResult.anonymousIdCount >= 5) {
    return true;
  }
  
  // 4. CAPTCHA explicitly required by abuse detection
  if (abuseResult.captchaRequired) {
    return true;
  }
  
  return false;
}

/**
 * Check if user is eligible for CAPTCHA bypass
 * Legitimate users with low abuse scores can bypass
 */
function checkBypassEligibility(
  abuseResult: AnonymousAbuseResult,
  rateLimitResult: RateLimitResult
): boolean {
  // No bypass if rate limit exceeded
  if (!rateLimitResult.allowed) {
    return false;
  }
  
  // Bypass allowed for users with minimal abuse (score < 20)
  if (abuseResult.abuseScore < 20) {
    return true;
  }
  
  // Bypass allowed for users with very few anonymous IDs (1-2)
  if (abuseResult.anonymousIdCount <= 2) {
    return true;
  }
  
  // No bypass for high-risk users
  return false;
}

/**
 * Get human-readable reason for CAPTCHA requirement
 */
function getCaptchaReason(
  abuseResult: AnonymousAbuseResult,
  rateLimitResult: RateLimitResult
): string {
  if (!rateLimitResult.allowed) {
    return `Rate limit exceeded: ${rateLimitResult.limitExceeded}`;
  }
  
  if (abuseResult.abuseScore >= 80) {
    return `Critical abuse score: ${abuseResult.abuseScore}/100`;
  }
  
  if (abuseResult.anonymousIdCount >= 5) {
    return `Multiple anonymous IDs: ${abuseResult.anonymousIdCount} in 24h`;
  }
  
  if (abuseResult.captchaRequired) {
    return `Abuse pattern detected: ${abuseResult.anonymousIdCount} anonymous IDs`;
  }
  
  return 'No CAPTCHA required';
}

/**
 * Create a new CAPTCHA challenge for the user
 */
export async function createCaptchaChallenge(
  req: VercelRequest
): Promise<CaptchaChallengeResult> {
  try {
    const challengeId = captchaService.generateChallengeId();
    
    const challenge: CaptchaChallengeResult = {
      challengeId,
      challengeType: 'hcaptcha',
      siteKey: captchaService.getSiteKey(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      abuseScore: 0 // Will be updated with actual score
    };
    
    // Get current abuse score for this IP
    const abuseResult = await checkRequestAnonymousAbuse(req);
    challenge.abuseScore = abuseResult.abuseScore || 0;
    
    return challenge;
    
  } catch (error) {
    console.error('Failed to create CAPTCHA challenge:', error);
    throw new Error('Failed to create CAPTCHA challenge');
  }
}

/**
 * Check if a user can bypass CAPTCHA based on their history
 * Implements progressive CAPTCHA display logic
 */
export async function checkCaptchaBypass(
  req: VercelRequest
): Promise<CaptchaBypassResult> {
  try {
    // Check current abuse status
    const abuseResult = await checkRequestAnonymousAbuse(req);
    
    // Determine bypass eligibility
    const bypassAllowed = checkBypassEligibility(abuseResult, {} as any);
    
    const result: CaptchaBypassResult = {
      allowed: bypassAllowed,
      reason: bypassAllowed ? 'Low abuse score, bypass allowed' : 'Abuse detected, bypass denied',
      expiresAt: bypassAllowed ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined, // 1 hour
      abuseScore: abuseResult.abuseScore || 0
    };
    
    return result;
    
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
 * Track CAPTCHA completion for analytics
 * Records successful CAPTCHA completions for monitoring
 */
export async function trackCaptchaCompletion(
  req: VercelRequest,
  challengeId: string,
  success: boolean,
  userId?: string
): Promise<void> {
  try {
    const clientIP = extractClientIP(req);
    const timestamp = new Date().toISOString();
    
    // Log CAPTCHA completion for monitoring
    console.log('CAPTCHA completion tracked:', {
      challengeId,
      success,
      userId,
      clientIP,
      timestamp,
      userAgent: req.headers['user-agent']
    });
    
    // In future phases, this could be stored in database
    // For now, just log for monitoring purposes
    
  } catch (error) {
    console.error('Failed to track CAPTCHA completion:', error);
    // Don't throw - tracking failure shouldn't break the flow
  }
}

/**
 * Get CAPTCHA configuration for frontend
 * Provides necessary settings for CAPTCHA widget
 */
export function getCaptchaConfig(): {
  enabled: boolean;
  siteKey: string;
  challengeType: 'hcaptcha';
  bypassThreshold: number;
} {
  return {
    enabled: captchaService.isConfigured(),
    siteKey: captchaService.getSiteKey(),
    challengeType: 'hcaptcha',
    bypassThreshold: 20 // Abuse score below 20 allows bypass
  };
}

/**
 * Validate CAPTCHA challenge expiration
 * Ensures CAPTCHA challenges are still valid
 */
export function isCaptchaChallengeExpired(expiresAt: string): boolean {
  try {
    const expirationTime = new Date(expiresAt);
    const currentTime = new Date();
    
    return currentTime > expirationTime;
  } catch (error) {
    console.error('Error checking CAPTCHA expiration:', error);
    return true; // If we can't parse the date, assume expired
  }
}
