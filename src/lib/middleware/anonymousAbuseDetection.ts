// ================================================================
// ANONYMOUS ABUSE DETECTION MIDDLEWARE - PHASE 2.1
// ================================================================
// This middleware implements anonymous user abuse detection
// Integrates with existing anonymous ID generation system

import { VercelRequest } from '@vercel/node';
import { getSupabaseClient } from '../stripe/supabase-integration.js';
import { extractClientIP } from '../utils/ipUtils.js';

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

/**
 * Get abuse status message for logging
 */
export function getAbuseStatusMessage(abuseResult: AnonymousAbuseResult): string {
  if (abuseResult.captchaRequired) {
    return `CAPTCHA required: IP ${abuseResult.ipAddressHash} created ${abuseResult.anonymousIdCount} anonymous IDs in 24h`;
  } else if (abuseResult.isAbuse) {
    return `Abuse detected: IP ${abuseResult.ipAddressHash} created ${abuseResult.anonymousIdCount} anonymous IDs in 24h`;
  } else {
    return `Normal activity: IP ${abuseResult.ipAddressHash} created ${abuseResult.anonymousIdCount} anonymous IDs in 24h`;
  }
}
