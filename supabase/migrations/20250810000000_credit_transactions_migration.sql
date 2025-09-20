-- =====================================================
-- CREDIT TRANSACTIONS TABLE MIGRATION
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Create credit_transactions table for audit trail
CREATE TABLE public.credit_transactions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  
  -- Transaction details
  credits_added INTEGER NOT NULL CHECK (credits_added > 0),
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'subscription_renewal')) NOT NULL,
  
  -- Stripe reference
  stripe_session_id TEXT NOT NULL UNIQUE, -- Prevents duplicate processing
  amount_paid INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  plan_name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only service role can insert (webhooks)
CREATE POLICY "Service role can insert transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true); -- Service role bypasses RLS

-- Create index for performance
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_stripe_session ON public.credit_transactions(stripe_session_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Update existing users table to ensure credits_balance column exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Create function to sync credits from transactions (for data integrity)
CREATE OR REPLACE FUNCTION sync_user_credits(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_credits INTEGER;
BEGIN
  -- Calculate total credits from all transactions
  SELECT COALESCE(SUM(credits_added), 0)
  INTO total_credits
  FROM public.credit_transactions
  WHERE user_id = target_user_id;
  
  -- Update user's balance
  UPDATE public.users
  SET 
    credits_balance = total_credits,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate credit consistency (for monitoring)
CREATE OR REPLACE FUNCTION validate_credits_consistency()
RETURNS TABLE(user_id UUID, stored_balance INTEGER, calculated_balance INTEGER, difference INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.credits_balance,
    COALESCE(SUM(ct.credits_added), 0)::INTEGER as calculated,
    (u.credits_balance - COALESCE(SUM(ct.credits_added), 0))::INTEGER as diff
  FROM public.users u
  LEFT JOIN public.credit_transactions ct ON u.id = ct.user_id
  GROUP BY u.id, u.credits_balance
  HAVING u.credits_balance != COALESCE(SUM(ct.credits_added), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
