import { supabase } from '../config/supabase';

export interface QuotaInfo {
  used: number;
  limit: number;
  plan: 'free' | 'paid';
  credits?: number;
  planType?: 'free' | 'credits' | 'subscription'; // Yeni alan
}

// Get user ID from Supabase session or generate anonymous ID
async function getUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    console.warn('Failed to get user from Supabase session:', error);
  }
  
  // Fallback to anonymous ID stored in localStorage
  let anonId = localStorage.getItem('anon-id');
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('anon-id', anonId);
  }
  return anonId;
}

export async function fetchQuotaInfo(): Promise<QuotaInfo> {
  try {
    const userId = await getUserId();
    
    // If user is anonymous, return default data
    if (userId.startsWith('anon_')) {
      return {
        used: 0, // Not needed anymore, but keep for compatibility
        limit: 3, // Not needed anymore, but keep for compatibility
        plan: 'free',
        credits: 0
      };
    }
    
    // For authenticated users, call the real API
    const response = await fetch('/api/quota', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quota: ${response.status}`);
    }

    const data = await response.json();
    
    const quotaInfo: QuotaInfo = {
      used: data.quota.today, // Keep for compatibility but not displayed
      limit: data.quota.limit, // Keep for compatibility but not displayed
      plan: data.plan_type === 'free' ? 'free' : 'paid',
      credits: data.credits, // This is what AccountPage displays
      planType: data.plan_type
    };
    
    return quotaInfo;
  } catch (error) {
    console.error('Failed to fetch quota info:', error);
    
    // Return default quota info on error
    return {
      used: 0,
      limit: 3,
      plan: 'free',
      credits: 0
    };
  }
}

// New function to get complete account state
export async function getAccountState(): Promise<{
  quota: { today: number; limit: number };
  credits: number;
  subscription: string | null;
  plan_type?: 'free' | 'credits' | 'subscription';
}> {
  try {
    const userId = await getUserId();
    
    // If user is anonymous, return default state
    if (userId.startsWith('anon_')) {
      return {
        quota: { today: 0, limit: 3 },
        credits: 0,
        subscription: null,
        plan_type: 'free'
      };
    }
    
    // For authenticated users, call the real API
    const response = await fetch('/api/quota', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch account state:', error);
    
    // Return default state on error
    return {
      quota: { today: 0, limit: 3 },
      credits: 0,
      subscription: null,
      plan_type: 'free'
    };
  }
}

// Function to get current user's plan type
export async function getUserPlan(): Promise<'free' | 'paid'> {
  try {
    const userId = await getUserId();
    const isLoggedIn = userId.startsWith('anon_') === false;
    
    // TODO: In production, check user's plan from database
    // For now, all users are on free plan
    return isLoggedIn ? 'free' : 'free';
  } catch (error) {
    console.warn('Failed to get user plan:', error);
    return 'free';
  }
}
