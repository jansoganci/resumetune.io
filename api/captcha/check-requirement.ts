// ================================================================
// CAPTCHA REQUIREMENT CHECK API - PHASE 3.3
// ================================================================
// This endpoint checks if CAPTCHA is required for the current request
// Integrates with enhanced abuse protection system

import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkConditionalCaptcha } from '../middleware/conditionalCaptcha';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    // Check if CAPTCHA is required using conditional logic
    const captchaResult = await checkConditionalCaptcha(req);
    
    // Build response
    const response = {
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
