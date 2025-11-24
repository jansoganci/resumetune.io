import { VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { compose, withCORS, withAuth, withMethods, AuthenticatedRequest } from './_lib/middleware.js';

// ================================================================
// CONSUME CREDIT API ENDPOINT
// ================================================================
// This endpoint deducts 1 credit from the authenticated user's balance
// Called by frontend checkAndConsumeLimit function

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    // 1. Get validated user ID from authenticated session
    const userId = req.user.id;

    // 2. Get Supabase client
    const supabase = getSupabaseClient();
    
    // 3. Kullanıcının mevcut kredi bakiyesini kontrol et
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch user information'
        }
      });
    }

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User does not exist in database'
        }
      });
    }

    // 4. Check credit balance
    const currentCredits = user.credits_balance || 0;

    if (currentCredits <= 0) {
      return res.status(400).json({
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'No credits remaining'
        },
        currentCredits: 0
      });
    }

    // 5. Consume credit (decrement by 1)
    const newBalance = Math.max(0, currentCredits - 1);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update credit balance'
        }
      });
    }

    // 6. Success response
    console.log(`✅ Credit consumed for user ${userId}: ${currentCredits} → ${newBalance}`);

    return res.status(200).json({
      success: true,
      message: 'Credit consumed successfully',
      previousCredits: currentCredits,
      currentCredits: newBalance,
      consumed: 1
    });

  } catch (error) {
    console.error('❌ Consume credit error:', error);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while consuming credit'
      }
    });
  }
}

// Apply middleware: CORS -> Auth -> Method validation
export default compose([
  withCORS,
  withAuth,
  (handler) => withMethods(['POST'], handler)
])(handler);
