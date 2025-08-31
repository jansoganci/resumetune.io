// ================================================================
// ABUSE PROTECTION STATUS API - PHASE 2.4
// ================================================================
// Admin endpoint to monitor abuse protection system status
// Provides real-time statistics and system health information

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAbuseProtectionStatus } from '../middleware/abuseProtection.js';
import { getSupabaseClient } from '../stripe/supabase-integration.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated (basic check)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get abuse protection status
    const abuseStatus = await getAbuseProtectionStatus();
    
    if (abuseStatus.error) {
      return res.status(500).json({ error: abuseStatus.error });
    }

    // Get additional detailed statistics
    const supabase = getSupabaseClient();
    
    // Get recent abuse attempts (last 24 hours)
    const { data: recentAbuse, error: recentAbuseError } = await supabase
      .from('anonymous_user_tracking')
      .select('ip_address_hash, anonymous_id, abuse_detected, captcha_required, abuse_score, first_seen')
      .gte('first_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('first_seen', { ascending: false })
      .limit(50);

    if (recentAbuseError) {
      console.error('Failed to get recent abuse data:', recentAbuseError);
    }

    // Get rate limit statistics
    const { data: rateLimitStats, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('ip_address, window_type, current_count, max_requests, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (rateLimitError) {
      console.error('Failed to get rate limit stats:', rateLimitError);
    }

    // Build comprehensive response
    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      abuseProtection: abuseStatus,
      recentActivity: {
        abuseAttempts: recentAbuse || [],
        rateLimitHits: rateLimitStats || []
      },
      summary: {
        totalAbuseAttempts: recentAbuse?.filter(r => r.abuse_detected).length || 0,
        totalCaptchaRequired: recentAbuse?.filter(r => r.captcha_required).length || 0,
        totalRateLimitHits: rateLimitStats?.length || 0,
        averageAbuseScore: recentAbuse?.reduce((sum, r) => sum + (r.abuse_score || 0), 0) / (recentAbuse?.length || 1) || 0
      }
    };

    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Abuse protection status API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get abuse protection status'
    });
  }
}
