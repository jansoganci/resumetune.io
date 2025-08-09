import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for server operations
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface CreditTransaction {
  id?: string;
  user_id: string;
  user_email: string;
  credits_added: number;
  transaction_type: 'purchase' | 'subscription_renewal';
  stripe_session_id: string;
  amount_paid: number;
  currency: string;
  plan_name: string;
  created_at?: string;
}

/**
 * Record a credit transaction in Supabase for permanent storage
 */
export async function recordCreditTransaction(transaction: CreditTransaction): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('credit_transactions')
    .insert([transaction]);
    
  if (error) {
    console.error('Failed to record credit transaction:', error);
    throw new Error(`Database error: ${error.message}`);
  }
  
  console.log(`Recorded credit transaction: ${transaction.credits_added} credits for user ${transaction.user_id}`);
}

/**
 * Update user's total credits in Supabase
 */
export async function updateUserCredits(userId: string, creditsToAdd: number): Promise<number> {
  const supabase = getSupabaseClient();
  
  // Get current balance
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', userId)
    .single();
    
  if (fetchError) {
    console.error('Failed to fetch user credits:', fetchError);
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }
  
  const currentBalance = user?.credits_balance || 0;
  const newBalance = currentBalance + creditsToAdd;
  
  // Update balance
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      credits_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Failed to update user credits:', updateError);
    throw new Error(`Failed to update credits: ${updateError.message}`);
  }
  
  console.log(`Updated user ${userId} credits: ${currentBalance} → ${newBalance}`);
  return newBalance;
}

/**
 * Update user's subscription plan in Supabase
 */
export async function updateUserSubscription(userId: string, planType: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('users')
    .update({ 
      plan_type: 'paid',
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (error) {
    console.error('Failed to update user subscription:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
  
  console.log(`Updated user ${userId} subscription to ${planType}`);
}

/**
 * Get user's credit balance from Supabase (authoritative source)
 */
export async function getUserCredits(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Failed to fetch user credits from Supabase:', error);
    return 0; // Fallback
  }
  
  return user?.credits_balance || 0;
}
