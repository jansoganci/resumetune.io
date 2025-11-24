import { VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { compose, withCORS, withAuth, withMethods, withValidation, AuthenticatedRequest } from './_lib/middleware.js';
import { consumeCreditSchema } from './_lib/schemas.js';
import { ERROR_CODES, HTTP_STATUS } from '../src/config/constants.js';
import { createApiLogger } from '../src/utils/logger.js';

const log = createApiLogger('/api/consume-credit');

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
      log.error('Error fetching user', userError as Error, { userId: userId.substring(0, 8) });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to fetch user information'
        }
      });
    }

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User does not exist in database'
        }
      });
    }

    // 4. Check credit balance
    const currentCredits = user.credits_balance || 0;

    if (currentCredits <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.INSUFFICIENT_CREDITS,
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
      log.error('Error updating credits', updateError as Error, { userId: userId.substring(0, 8) });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Failed to update credit balance'
        }
      });
    }

    // 6. Success response
    log.debug('Credit consumed', { userId: userId.substring(0, 8), previousCredits: currentCredits, newBalance });

    return res.status(200).json({
      success: true,
      message: 'Credit consumed successfully',
      previousCredits: currentCredits,
      currentCredits: newBalance,
      consumed: 1
    });

  } catch (error) {
    log.error('Consume credit error', error as Error);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred while consuming credit'
      }
    });
  }
}

// Apply middleware: CORS -> Auth -> Validation -> Method validation
export default compose([
  withCORS,
  withAuth,
  withValidation(consumeCreditSchema),
  (handler) => withMethods(['POST'], handler)
])(handler);
