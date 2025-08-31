// ================================================================
// CAPTCHA VERIFICATION ENDPOINT - PHASE 3.1
// ================================================================
// This endpoint verifies CAPTCHA tokens from the frontend
// Integrates with hCaptcha service for abuse prevention

import { VercelRequest, VercelResponse } from '@vercel/node';
import { captchaService, CaptchaVerificationResult } from '../middleware/captchaService.js';
import { extractClientIP } from '../utils/ipUtils.js';

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
    // Check if CAPTCHA service is configured
    if (!captchaService.isConfigured()) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'CAPTCHA service is not configured'
      });
    }

    // Parse request body
    const { token, challengeId, userId } = req.body;

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
    const response = {
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
