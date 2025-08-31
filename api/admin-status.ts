// ================================================================
// CONSOLIDATED ADMIN STATUS API - PHASE 2.4
// ================================================================
// Admin endpoint combining abuse protection status and usage monitoring
// Provides real-time statistics, system health, and usage information

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAbuseProtectionStatus } from '../src/lib/middleware/abuseProtection.js';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

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
    const tokenHeader = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback to admin token check for usage endpoint
      const expected = (process.env.ADMIN_USAGE_TOKEN || '').trim();
      if (!expected || !tokenHeader || tokenHeader.trim() !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const base = 'http://localhost';
    const url = new URL(req.url || '/api/admin-status', base);
    const endpoint = url.searchParams.get('endpoint');
    const date = (url.searchParams.get('date') || new Date().toISOString().slice(0, 10)).trim();

    // Route to specific functionality based on endpoint parameter
    if (endpoint === 'usage') {
      return await handleUsageEndpoint(req, res, date);
    } else {
      // Default: abuse protection status
      return await handleAbuseStatusEndpoint(req, res);
    }

  } catch (error) {
    console.error('Admin status API error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process admin request'
    });
  }
}

async function handleUsageEndpoint(req: VercelRequest, res: VercelResponse, date: string) {
  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Get daily usage from Supabase daily_usage table
    let usage: Record<string, number> = {};
    
    const { data: dailyUsageData, error } = await supabase
      .from('daily_usage')
      .select('user_id, usage_count')
      .eq('usage_date', date);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to read usage from database' });
    }

    // Convert to the expected format
    if (dailyUsageData && dailyUsageData.length > 0) {
      dailyUsageData.forEach(row => {
        usage[row.user_id] = row.usage_count;
      });
    }

    return res.status(200).json({ date, usage });
  } catch (e) {
    console.error('Admin usage query failed:', e);
    return res.status(500).json({ error: 'Failed to read usage' });
  }
}

async function handleAbuseStatusEndpoint(req: VercelRequest, res: VercelResponse) {
  try {
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
        averageAbuseScore: (recentAbuse || []).reduce((sum, r) => sum + (r.abuse_score || 0), 0) / (recentAbuse?.length || 1) || 0
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
