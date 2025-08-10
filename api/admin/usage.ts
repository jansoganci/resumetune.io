// Admin Usage Endpoint: GET /api/admin/usage?date=YYYY-MM-DD
// Auth: header x-admin-token must match process.env.ADMIN_USAGE_TOKEN
// Returns: { date, usage: { [id]: count } }
// ✅ MIGRATED TO SUPABASE - No more Redis dependency

import { VercelRequest, VercelResponse } from '@vercel/node';
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
  // Ensure valid date and preserve yyyy-mm-dd
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const tokenHeader = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
  const expected = (process.env.ADMIN_USAGE_TOKEN || '').trim();
  if (!expected || !tokenHeader || tokenHeader.trim() !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const base = 'http://localhost';
    const url = new URL(req.url || '/api/admin/usage', base);
    const date = (url.searchParams.get('date') || new Date().toISOString().slice(0, 10)).trim();
    if (!isValidDateString(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    // ✅ Use Supabase instead of Redis
    const supabase = getSupabaseClient();
    
    // Get daily usage from Supabase daily_usage table
    let usage: Record<string, number> = {};
    try {
      const { data: dailyUsageData, error } = await supabase
        .from('daily_usage')
        .select('user_id, usage_count')
        .eq('usage_date', date);

      if (error) {
        console.error('Supabase query error:', error);
        res.status(500).json({ error: 'Failed to read usage from database' });
        return;
      }

      // Convert to the expected format
      if (dailyUsageData && dailyUsageData.length > 0) {
        dailyUsageData.forEach(row => {
          usage[row.user_id] = row.usage_count;
        });
      }

      res.status(200).json({ date, usage });
    } catch (e) {
      console.error('Admin usage query failed:', e);
      res.status(500).json({ error: 'Failed to read usage' });
      return;
    }
  } catch (err) {
    console.error('Admin usage handler error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


