import { VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { compose, withCORS, withOptionalAuth, withMethods, UserRequest } from './_lib/middleware.js';

// ================================================================
// INCREMENT USAGE API ENDPOINT
// ================================================================
// Increments user's daily AI usage counter by 1
// Used for daily limit control for free users

async function handler(req: UserRequest, res: VercelResponse) {
  try {
    // 1. Get validated user ID from middleware (authenticated or anonymous)
    const userId = req.userId;

    // 2. Get Supabase client
    const supabase = getSupabaseClient();

    // 3. Get today's date
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // 4. Use RPC function for all users (supports both UUID and text user IDs)
    const { data: newCount, error: rpcError } = await supabase
      .rpc('increment_daily_usage', {
        p_user_id: userId,
        p_usage_date: today
      });

    if (rpcError) {
      console.error('❌ Error incrementing daily usage:', rpcError);
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to increment daily usage',
          details: rpcError.message
        }
      });
    }

    // 5. Success response
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
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while incrementing usage'
      }
    });
  }
}

// Apply middleware: CORS -> OptionalAuth -> Method validation
export default compose([
  withCORS,
  withOptionalAuth,
  (handler) => withMethods(['POST'], handler)
])(handler);
