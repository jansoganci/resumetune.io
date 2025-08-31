import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from '../src/lib/stripe/supabase-integration';

// ================================================================
// QUOTA API - SUPABASE VERSION
// ================================================================
// Bu API artık Redis yerine Supabase kullanır ve akıllı kredi sistemi 
// ile entegre çalışır. Roadmap'teki yeni logic'i implement eder.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (MVP): allow site origins only
  const origin = req.headers.origin || '';
  const allowed = ['https://resumetune.io', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  // Get user ID (authenticated veya anonymous)
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User ID required' } });
  }
  
  // Anonymous user detection
  const isAnonymousUser = userId.startsWith('anon_');
  console.log(`👤 User type: ${isAnonymousUser ? 'Anonymous' : 'Authenticated'} (${userId})`);

  try {
    // 1. Supabase client'ı oluştur
    const supabase = getSupabaseClient();
    
    // 2. Bugünün tarihini al
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    console.log(`📊 Fetching quota info for user ${userId} on ${today}`);
    
    // 3. User type'a göre farklı data fetching
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
        .single();
      
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
          .single(),
        
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

    // 4. Smart plan type detection

    // 5. AKILLI LİMİT HESAPLAMA (Roadmap'ten)
    const creditsBalance = userCredits;
    const hasCredits = creditsBalance > 0;
    const hasActiveSubscription = subscriptionStatus === 'active';
    
    let dailyLimit: number;
    let planType: string;
    
    if (hasCredits) {
      dailyLimit = 999; // Sınırsız (kredi sahibi)
      planType = 'credits';
    } else if (hasActiveSubscription) {
      dailyLimit = 999; // Sınırsız (abonelik sahibi)
      planType = 'subscription';
    } else {
      dailyLimit = 3; // Free user
      planType = 'free';
    }

    // 7. Response oluştur (frontend uyumlu format)
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
    
    // Hata durumunda güvenli fallback değerleri döndür
    return res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch quota information' 
      } 
    });
  }
}

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