import { VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { compose, withCORS, withOptionalAuth, withMethods, UserRequest } from './_lib/middleware.js';

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

    console.log(`👤 User type: ${isAnonymousUser ? 'Anonymous' : 'Authenticated'} (${userId})`);

    // 2. Get Supabase client
    const supabase = getSupabaseClient();

    // 3. Get today's date
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    console.log(`📊 Fetching quota info for user ${userId} on ${today}`);

    // 4. Fetch data based on user type
    let todayUsage = 0;
    let userCredits = 0;
    let subscriptionPlan = null;
    let subscriptionStatus = null;

    if (isAnonymousUser) {
      // Anonymous user: Only daily usage, no user record
      console.log(`🔍 Fetching anonymous user data for ${userId}`);
      
      const usageResult = await supabase
        .from('daily_usage')
        .select('ai_calls_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();
      
      todayUsage = usageResult.data?.ai_calls_count || 0;
      
      if (usageResult.error && usageResult.error.code !== 'PGRST116') {
        console.warn('⚠️ Anonymous daily usage query warning:', usageResult.error);
      }
      
    } else {
      // Authenticated user: Parallel queries for efficiency
      console.log(`🔍 Fetching authenticated user data for ${userId}`);
      
      // 🛠️ DEBUG: Check Supabase client configuration
      console.log('🔧 Debug: Supabase client info:', {
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.SUPABASE_URL?.substring(0, 30) + '...',
      });
      
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

      // 🛠️ DEBUG: Log query results for troubleshooting
      console.log('🔧 Debug: Supabase query results:', {
        usageResult: {
          data: usageResult.data,
          error: usageResult.error,
          status: usageResult.status
        },
        userResult: {
          data: userResult.data,
          error: userResult.error,
          status: userResult.status
        }
      });

      // Parse results
      todayUsage = usageResult.data?.ai_calls_count || 0;
      
      if (usageResult.error && usageResult.error.code !== 'PGRST116') {
        console.warn('⚠️ Daily usage query warning:', usageResult.error);
      }

      if (userResult.error) {
        if (userResult.error.code === 'PGRST116') {
          console.warn('⚠️ User not found in database, treating as free user');
        } else {
          console.error('❌ User query error:', userResult.error);
          // 🛠️ GRACEFUL FALLBACK: Don't throw error, just log and continue
          console.warn('❌ Continuing with default values due to user query error');
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

    console.log(`✅ Quota info fetched successfully:`, {
      userId: userId.substring(0, 8) + '...',
      todayUsage,
      dailyLimit,
      creditsBalance,
      planType,
      hasActiveSubscription
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Quota API error:', error);

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
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
