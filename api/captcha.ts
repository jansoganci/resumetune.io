// ================================================================
// CONSOLIDATED CAPTCHA API - PHASE 3.3
// ================================================================
// This endpoint consolidates all CAPTCHA operations into a single file
// to stay under Vercel's Hobby plan serverless function limit
// 
// Supported actions:
// - create-challenge: Creates a new CAPTCHA challenge
// - bypass: Allows legitimate users to bypass CAPTCHA
// - check-requirement: Checks if CAPTCHA is required
// - verify: Verifies CAPTCHA tokens from frontend

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createEnhancedCaptchaChallenge } from '../src/lib/middleware/enhancedAbuseProtection.js';
import { checkCaptchaBypass } from '../src/lib/middleware/conditionalCaptcha.js';
import { checkConditionalCaptcha } from '../src/lib/middleware/conditionalCaptcha.js';
import { captchaService, CaptchaVerificationResult } from '../src/lib/middleware/captchaService.js';
import { extractClientIP } from '../src/lib/utils/ipUtils.js';

// Type definitions for different actions
interface CreateChallengeRequest {
  // No body parameters needed
}

interface CreateChallengeResponse {
  challengeId: string;
  siteKey: string;
  expiresAt: string;
  abuseScore: number;
}

interface BypassRequest {
  // No body parameters needed
}

interface BypassResponse {
  success: boolean;
  message: string;
  reason?: string;
  expiresAt?: string;
  abuseScore?: number;
}

interface CheckRequirementRequest {
  // No body parameters needed (GET request)
}

interface CheckRequirementResponse {
  captchaRequired: boolean;
  bypassAllowed: boolean;
  abuseScore: number;
  reason?: string;
  challengeType?: string | null;
  siteKey?: string;
  expiresAt?: string;
}

interface VerifyRequest {
  token: string;
  challengeId?: string;
  userId?: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  challengeId?: string;
  verifiedAt?: string;
  expiresAt?: string;
  userId?: string | null;
  ipAddress?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Extract action from query parameters
  const { action } = req.query;
  
  // Validate action parameter
  if (!action || typeof action !== 'string') {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Action parameter is required. Supported actions: create-challenge, bypass, check-requirement, verify'
    });
  }

  // Route to appropriate handler based on action
  switch (action) {
    case 'create-challenge':
      return handleCreateChallenge(req, res);
    case 'bypass':
      return handleBypass(req, res);
    case 'check-requirement':
      return handleCheckRequirement(req, res);
    case 'verify':
      return handleVerify(req, res);
    default:
      return res.status(400).json({
        error: 'Bad request',
        message: `Invalid action: ${action}. Supported actions: create-challenge, bypass, check-requirement, verify`
      });
  }
}

// Handler for create-challenge action
async function handleCreateChallenge(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for create-challenge action'
    });
  }

  try {
    // Create enhanced CAPTCHA challenge
    const challenge = await createEnhancedCaptchaChallenge(req);
    
    if (!challenge) {
      return res.status(400).json({
        error: 'Challenge creation failed',
        message: 'Unable to create CAPTCHA challenge'
      });
    }

    // Build response
    const response: CreateChallengeResponse = {
      challengeId: challenge.challengeId,
      siteKey: challenge.siteKey,
      expiresAt: challenge.expiresAt,
      abuseScore: challenge.abuseScore
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Challenge-Id', challenge.challengeId);
    res.setHeader('X-Challenge-Expires', challenge.expiresAt);
    res.setHeader('X-Abuse-Score', challenge.abuseScore.toString());

    return res.status(200).json(response);

  } catch (error) {
    console.error('CAPTCHA challenge creation error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create CAPTCHA challenge'
    });
  }
}

// Handler for bypass action
async function handleBypass(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for bypass action'
    });
  }

  try {
    // Check if user is eligible for bypass
    const bypassResult = await checkCaptchaBypass(req);
    
    if (!bypassResult.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Bypass not allowed',
        message: bypassResult.reason || 'You are not eligible for CAPTCHA bypass',
        abuseScore: bypassResult.abuseScore
      });
    }

    // Return successful bypass
    const response: BypassResponse = {
      success: true,
      message: 'CAPTCHA bypass granted',
      reason: bypassResult.reason,
      expiresAt: bypassResult.expiresAt,
      abuseScore: bypassResult.abuseScore
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('CAPTCHA bypass error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process CAPTCHA bypass request'
    });
  }
}

// Handler for check-requirement action
async function handleCheckRequirement(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported for check-requirement action'
    });
  }

  try {
    // Check if CAPTCHA is required using conditional logic
    const captchaResult = await checkConditionalCaptcha(req);
    
    // Build response
    const response: CheckRequirementResponse = {
      captchaRequired: captchaResult.captchaRequired,
      bypassAllowed: captchaResult.bypassAllowed,
      abuseScore: captchaResult.abuseScore,
      reason: captchaResult.reason,
      challengeType: captchaResult.challengeType,
      siteKey: captchaResult.siteKey,
      expiresAt: captchaResult.expiresAt
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Captcha-Required', captchaResult.captchaRequired.toString());
    
    if (captchaResult.captchaRequired) {
      res.setHeader('X-Captcha-Bypass-Allowed', captchaResult.bypassAllowed.toString());
      if (captchaResult.expiresAt) {
        res.setHeader('X-Captcha-Expires', captchaResult.expiresAt);
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('CAPTCHA requirement check error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check CAPTCHA requirement'
    });
  }
}

// Handler for verify action
async function handleVerify(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for verify action'
    });
  }

  try {
    // Check if CAPTCHA service is configured
    if (!captchaService.isConfigured()) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'CAPTCHA service is not configured'
      });
    }

    // Parse request body
    const { token, challengeId, userId }: VerifyRequest = req.body;

    // Validate required fields
    if (!token) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'CAPTCHA token is required'
      });
    }

    // Validate token format
    if (!captchaService.validateTokenFormat(token)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid CAPTCHA token format'
      });
    }

    // Extract client IP for verification
    const clientIP = extractClientIP(req);

    // Verify CAPTCHA token with hCaptcha
    const verificationResult: CaptchaVerificationResult = await captchaService.verifyCaptchaToken(
      token, 
      clientIP
    );

    if (!verificationResult.success) {
      return res.status(400).json({
        error: 'CAPTCHA verification failed',
        message: verificationResult.error || 'Verification failed',
        challengeId: challengeId || null
      });
    }

    // CAPTCHA verification successful
    const response: VerifyResponse = {
      success: true,
      message: 'CAPTCHA verified successfully',
      challengeId: challengeId || verificationResult.challengeId,
      verifiedAt: verificationResult.verifiedAt,
      expiresAt: verificationResult.expiresAt,
      userId: userId || null,
      ipAddress: clientIP
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Captcha-Verified', 'true');
    res.setHeader('X-Captcha-Expires', verificationResult.expiresAt || '');

    return res.status(200).json(response);

  } catch (error) {
    console.error('CAPTCHA verification endpoint error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'CAPTCHA verification failed'
    });
  }
}

