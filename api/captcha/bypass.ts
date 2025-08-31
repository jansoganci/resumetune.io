// ================================================================
// CAPTCHA BYPASS API - PHASE 3.3
// ================================================================
// This endpoint allows legitimate users to bypass CAPTCHA
// Integrates with enhanced abuse protection system

import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkCaptchaBypass } from '../middleware/conditionalCaptcha';

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
    return res.status(200).json({
      success: true,
      message: 'CAPTCHA bypass granted',
      reason: bypassResult.reason,
      expiresAt: bypassResult.expiresAt,
      abuseScore: bypassResult.abuseScore
    });

  } catch (error) {
    console.error('CAPTCHA bypass error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process CAPTCHA bypass request'
    });
  }
}
