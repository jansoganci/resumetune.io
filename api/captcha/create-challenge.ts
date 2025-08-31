// ================================================================
// CAPTCHA CHALLENGE CREATION API - PHASE 3.3
// ================================================================
// This endpoint creates a new CAPTCHA challenge for abuse prevention
// Integrates with enhanced abuse protection system

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createEnhancedCaptchaChallenge } from '../middleware/enhancedAbuseProtection';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
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
    const response = {
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
