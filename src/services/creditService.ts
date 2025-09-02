import { supabase } from '../config/supabase';

// ================================================================
// CREDIT SERVICE - AKILLI KREDİ YÖNETİMİ
// ================================================================
// Bu servis yeni akıllı kredi sistemini implement eder:
// - Resume/Cover Letter → 1 kredi tüketir
// - Diğer AI işlemleri → kredi tüketmez
// - Free users → 3/gün limit
// - Credit/Subscription sahipleri → sınırsız

export interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
  currentCredits?: number;
  dailyUsage?: number;
  dailyLimit?: number;
  planType?: 'free' | 'credits' | 'subscription';
}

export interface UserLimitInfo {
  hasCredits: boolean;
  hasActiveSubscription: boolean;
  creditsBalance: number;
  dailyUsage: number;
  dailyLimit: number;
  planType: 'free' | 'credits' | 'subscription';
}

// ================================================================
// CORE FUNCTIONS
// ================================================================

/**
 * Hangi işlemlerin kredi tüketeceğini belirler
 */
export function shouldConsumeCredit(actionType: string): boolean {
  const creditConsumingActions = [
    'generate_resume',
    'generate_cover_letter', 
    'optimize_resume',
    'analyze_job_match'
  ];
  
  return creditConsumingActions.includes(actionType);
}

// getSupabaseServiceClient kaldırıldı - frontend'de service role key kullanmak güvenlik riski

/**
 * Kullanıcının mevcut limit durumunu kontrol eder
 */
export async function getUserLimitInfo(userId: string): Promise<UserLimitInfo> {
  try {
    // Backend API'sinden kullanıcı bilgilerini al
    const response = await fetch('/api/quota', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      console.warn(`Quota API failed with status ${response.status}, using fallback values`);
      throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    const data = await response.json();
    
    // Response format:
    // {
    //   quota: { today: number, limit: number },
    //   credits: number,
    //   subscription: string | null,
    //   plan_type: 'free' | 'paid'
    // }

    const hasCredits = (data.credits || 0) > 0;
    const hasActiveSubscription = data.subscription && data.subscription !== null;
    const planType = hasCredits ? 'credits' : hasActiveSubscription ? 'subscription' : 'free';

    return {
      hasCredits,
      hasActiveSubscription,
      creditsBalance: data.credits || 0,
      dailyUsage: data.quota?.today || 0,
      dailyLimit: data.quota?.limit || 3,
      planType
    };
  } catch (error) {
    console.error('Failed to get user limit info, using safe fallback:', error);
    
    // 🛠️ GRACEFUL FALLBACK - Return permissive defaults instead of blocking
    // This prevents quota API failures from cascading to AI endpoint failures
    return {
      hasCredits: false,
      hasActiveSubscription: false,
      creditsBalance: 0,
      dailyUsage: 0,
      dailyLimit: 999, // ✅ Allow unlimited for fallback case
      planType: 'free'
    };
  }
}

/**
 * Anonymous user ID generation and storage
 */
function generateAnonymousId(): string {
  // Browser'da persistent anonymous ID oluştur
  const storageKey = 'anonymous_user_id';
  let anonId = localStorage.getItem(storageKey);
  
  if (!anonId) {
    anonId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(storageKey, anonId);
  }
  
  return anonId;
}

/**
 * Kullanıcının ID'sini çeker - authenticated veya anonymous
 */
async function getCurrentUserId(): Promise<string> {
  try {
    // İlk önce authenticated user kontrolü
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      return session.user.id; // Authenticated user
    }
    
    // Anonymous user için persistent ID
    return generateAnonymousId();
    
  } catch (error) {
    console.warn('Failed to get current user ID, using anonymous:', error);
    return generateAnonymousId();
  }
}

/**
 * Backend API'sı üzerinden kredi tüketir
 */
async function consumeCredit(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/consume-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      console.error('Failed to consume credit:', response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error consuming credit:', error);
    return false;
  }
}

/**
 * Backend API'sı üzerinden günlük kullanımı artırır
 */
async function incrementDailyUsage(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/increment-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      console.error('Failed to increment daily usage:', response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error incrementing daily usage:', error);
    return false;
  }
}

// ================================================================
// MAIN FUNCTION - AKILLI KREDİ SİSTEMİ
// ================================================================

/**
 * Ana kredi kontrol ve tüketim fonksiyonu
 * 
 * Bu fonksiyon:
 * 1. Kullanıcının mevcut durumunu kontrol eder
 * 2. Action type'a göre kredi/limit kontrolü yapar
 * 3. Gerekirse kredi tüketir veya günlük sayacı artırır
 * 4. İzin durumunu ve detayları döndürür
 */
export async function checkAndConsumeLimit(
  actionType: string,
  userId?: string
): Promise<CreditCheckResult> {
  

  
  try {
    // 1. Kullanıcı ID'si kontrolü (authenticated veya anonymous)
    const currentUserId = userId || await getCurrentUserId();

    // 2. Kullanıcının mevcut durumunu al
    const userInfo = await getUserLimitInfo(currentUserId);
    const needsCredit = shouldConsumeCredit(actionType);

    // 3. AKILLI KREDİ LOGİC
    
    // 3a. Kredi sahibi veya abonelik sahibi + kredi gerektiren işlem
    if ((userInfo.hasCredits || userInfo.hasActiveSubscription) && needsCredit) {
      
      // Kredi kontrolü
      if (userInfo.hasCredits && userInfo.creditsBalance <= 0) {
        return {
          allowed: false,
          reason: 'No credits remaining',
          currentCredits: userInfo.creditsBalance,
          planType: userInfo.planType
        };
      }

      // Kredi tüket (sadece kredi sahibiyse)
      if (userInfo.hasCredits) {
        const creditConsumed = await consumeCredit(currentUserId);
        if (!creditConsumed) {
          return {
            allowed: false,
            reason: 'Failed to consume credit',
            currentCredits: userInfo.creditsBalance,
            planType: userInfo.planType
          };
        }
      }

      return {
        allowed: true,
        currentCredits: userInfo.hasCredits ? userInfo.creditsBalance - 1 : undefined,
        planType: userInfo.planType
      };
    }

    // 3b. Kredi sahibi/abonelik sahibi + kredi gerektirmeyen işlem → serbest
    if ((userInfo.hasCredits || userInfo.hasActiveSubscription) && !needsCredit) {
      return {
        allowed: true,
        currentCredits: userInfo.creditsBalance,
        planType: userInfo.planType
      };
    }

    // 3c. Free user → günlük limite bak
    if (!userInfo.hasCredits && !userInfo.hasActiveSubscription) {
      
      // Günlük limit kontrolü
      if (userInfo.dailyUsage >= userInfo.dailyLimit) {
        return {
          allowed: false,
          reason: 'Daily quota exceeded',
          dailyUsage: userInfo.dailyUsage,
          dailyLimit: userInfo.dailyLimit,
          planType: 'free'
        };
      }

      // Günlük sayacı artır
      const usageIncremented = await incrementDailyUsage(currentUserId);
      if (!usageIncremented) {
        return {
          allowed: false,
          reason: 'Failed to update usage counter',
          dailyUsage: userInfo.dailyUsage,
          dailyLimit: userInfo.dailyLimit,
          planType: 'free'
        };
      }

      return {
        allowed: true,
        dailyUsage: userInfo.dailyUsage + 1,
        dailyLimit: userInfo.dailyLimit,
        planType: 'free'
      };
    }

    // 4. Fallback - genel izin ver
    return {
      allowed: true,
      planType: userInfo.planType
    };

  } catch (error) {
    console.error('Error in checkAndConsumeLimit:', error);
    
    // 🛠️ GRACEFUL FALLBACK - Allow AI usage when credit system fails
    // This prevents credit validation errors from breaking AI functionality
    console.warn('Credit validation failed, allowing request to proceed');
    return {
      allowed: true,
      reason: 'Credit validation bypass due to system error',
      planType: 'free'
    };
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Action type'ı normalize eder (farklı formatlardaki input'ları standartlaştırır)
 */
export function normalizeActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    'resume': 'generate_resume',
    'cover-letter': 'generate_cover_letter',
    'cover_letter': 'generate_cover_letter',
    'optimize': 'optimize_resume',
    'job-match': 'analyze_job_match',
    'job_match': 'analyze_job_match',
    'chat': 'general_chat',
    'suggestion': 'general_suggestion'
  };

  return actionMap[actionType] || actionType;
}

/**
 * Kredi tüketen işlemlerin listesini döndürür
 */
export function getCreditConsumingActions(): string[] {
  return [
    'generate_resume',
    'generate_cover_letter', 
    'optimize_resume',
    'analyze_job_match'
  ];
}

/**
 * Kullanıcının upgrade etmesi gerekip gerekmediğini kontrol eder
 */
export function shouldSuggestUpgrade(result: CreditCheckResult): boolean {
  return !result.allowed && (
    result.reason === 'Daily quota exceeded' ||
    result.reason === 'No credits remaining'
  );
}

/**
 * Kullanıcı dostu hata mesajı oluşturur
 */
export function getErrorMessage(result: CreditCheckResult): string {
  switch (result.reason) {
    case 'Daily quota exceeded':
      return 'You\'ve reached your daily limit of 3 AI calls. Upgrade to get unlimited access!';
    case 'No credits remaining':
      return 'You\'ve used all your credits. Purchase more credits or subscribe for unlimited access!';
    case 'Authentication required':
      return 'Please sign in to continue using AI features.';
    case 'Failed to consume credit':
    case 'Failed to update usage counter':
      return 'Unable to process your request. Please try again.';
    case 'Internal error occurred':
      return 'Something went wrong. Please try again later.';
    default:
      return 'Access denied. Please check your account status.';
  }
}

// ================================================================
// EXPORT DEFAULT OBJECT
// ================================================================

export default {
  shouldConsumeCredit,
  checkAndConsumeLimit,
  getUserLimitInfo,
  normalizeActionType,
  getCreditConsumingActions,
  shouldSuggestUpgrade,
  getErrorMessage
};
