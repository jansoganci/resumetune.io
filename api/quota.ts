import { VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { compose, withCORS, withOptionalAuth, withMethods, UserRequest } from './_lib/middleware.js';
import { LIMITS, HTTP_STATUS, ERROR_CODES } from '../src/config/constants.js';
import { createApiLogger } from '../src/utils/logger.js';

const log = createApiLogger('/api/quota');

// ================================================================
// QUOTA API - SUPABASE VERSION
// ================================================================
// Uses Supabase and integrates with smart credit system
// Supports both authenticated and anonymous users

async function handler(req: UserRequest, res: VercelResponse) {
  try {
    // 1. Get validated user ID from middleware (authenticated or anonymous)
    const userId = req.userId;
    const isAnonymousUser = req.isAnonymous;

    log.debug('User quota request', {
      userType: isAnonymousUser ? 'Anonymous' : 'Authenticated',
      userId: userId.substring(0, 8)
    });

    // 2. Get Supabase client
    const supabase = getSupabaseClient();

    // 3. Get today's date
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // 4. Fetch data based on user type
    let todayUsage = 0;
    let userCredits = 0;
    let subscriptionPlan = null;
    let subscriptionStatus = null;

    if (isAnonymousUser) {
      // Anonymous user: Only daily usage, no user record
      log.debug('Fetching anonymous user data', { userId: userId.substring(0, 8) });

      const usageResult = await supabase
        .from('daily_usage')
        .select('ai_calls_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      todayUsage = usageResult.data?.ai_calls_count || 0;

      if (usageResult.error && usageResult.error.code !== 'PGRST116') {
        log.warn('Anonymous daily usage query warning', { error: usageResult.error });
      }
      
    } else {
      // Authenticated user: Parallel queries for efficiency
      log.debug('Fetching authenticated user data', { userId: userId.substring(0, 8) });
      
      const [usageResult, userResult] = await Promise.all([
        // Günlük kullanım bilgisi
        supabase
          .from('daily_usage')
          .select('ai_calls_count')
          .eq('user_id', userId)
          .eq('usage_date', today)
          .maybeSingle(),
        
        // Kullanıcı bilgileri (krediler only - subscription fields don't exist yet)
        supabase
          .from('users')
          .select('credits_balance')
          .eq('id', userId)
          .single()
      ]);

      // Parse results
      todayUsage = usageResult.data?.ai_calls_count || 0;

      if (usageResult.error && usageResult.error.code !== 'PGRST116') {
        log.warn('Daily usage query warning', { error: usageResult.error });
      }

      if (userResult.error) {
        if (userResult.error.code === 'PGRST116') {
          log.warn('User not found in database, treating as free user', { userId: userId.substring(0, 8) });
        } else {
          log.error('User query error', userResult.error as Error, { userId: userId.substring(0, 8) });
          // 🛠️ GRACEFUL FALLBACK: Don't throw error, just log and continue
          log.warn('Continuing with default values due to user query error');
        }
      } else {
        userCredits = userResult.data?.credits_balance || 0;
        subscriptionPlan = null; // Subscription not implemented yet
        subscriptionStatus = null; // Subscription not implemented yet
      }
    }

    // 5. Smart limit calculation
    const creditsBalance = userCredits;
    const hasCredits = creditsBalance > 0;
    const hasActiveSubscription = subscriptionStatus === 'active';
    
    let dailyLimit: number;
    let planType: string;

    if (hasCredits) {
      dailyLimit = 999; // Unlimited (credit holder)
      planType = 'credits';
    } else if (hasActiveSubscription) {
      dailyLimit = 999; // Unlimited (subscription holder)
      planType = 'subscription';
    } else {
      dailyLimit = 3; // Free user
      planType = 'free';
    }

    // 6. Build response (frontend-compatible format)
    const response = {
      quota: {
        today: todayUsage,
        limit: dailyLimit,
      },
      credits: creditsBalance,
      subscription: subscriptionPlan || null,
      plan_type: planType // Yeni alan: hangi plan türünde olduğu
    };

    log.debug('Quota info fetched successfully', {
      userId: userId.substring(0, 8),
      todayUsage,
      dailyLimit,
      creditsBalance,
      planType,
      hasActiveSubscription
    });

    return res.status(HTTP_STATUS.OK).json(response);

  } catch (error) {
    log.error('Quota API error', error as Error);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch quota information'
      }
    });
  }
}

// Apply middleware: CORS -> OptionalAuth -> Method validation
export default compose([
  withCORS,
  withOptionalAuth,
  (handler) => withMethods(['GET'], handler)
])(handler);

// ================================================================
// RESPONSE FORMAT DOCUMENTATION
// ================================================================
// Bu API şu format'ta response döndürür:
//
// {
//   "quota": {
//     "today": 2,          // Bugün kaç AI call yapıldı
//     "limit": 999         // Günlük limit (3=free, 999=unlimited)
//   },
//   "credits": 50,         // Mevcut kredi bakiyesi
//   "subscription": "pro", // Abonelik planı (null=yok)
//   "plan_type": "credits" // "free" | "credits" | "subscription"
// }
//
// Plan Type Açıklaması:
// - "free": Günde 3 limit, kredi/abonelik yok
// - "credits": Kredi sahibi, günlük limit yok
// - "subscription": Aktif abonelik, günlük limit yok
// ================================================================
