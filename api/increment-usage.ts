import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../src/lib/stripe/supabase-integration';

// ================================================================
// INCREMENT USAGE API ENDPOINT
// ================================================================
// Bu endpoint kullanıcının günlük AI kullanım sayacını 1 artırır
// Free users için günlük limit kontrolünde kullanılır

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sadece POST metodunu kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST requests are supported' 
    });
  }

  try {
    // 1. Kullanıcı ID'sini al
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User ID is missing in headers'
      });
    }

    // 2. Supabase client'ı oluştur
    const supabase = getSupabaseClient();
    
    // 3. Bugünün tarihini al
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    // 4. Use RPC function for all users (now supports both UUID and text user IDs)
    const { data: newCount, error: rpcError } = await supabase
      .rpc('increment_daily_usage', {
        p_user_id: userId,
        p_usage_date: today
      });

    if (rpcError) {
      console.error('❌ Error incrementing daily usage:', rpcError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to increment daily usage',
        details: rpcError.message
      });
    }

    // 5. Başarılı response
    console.log(`✅ Daily usage incremented for user ${userId}: ${newCount} calls today`);
    
    return res.status(200).json({
      success: true,
      message: 'Daily usage incremented successfully',
      currentUsage: newCount,
      date: today
    });

  } catch (error) {
    console.error('❌ Increment usage error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while incrementing usage'
    });
  }
}
