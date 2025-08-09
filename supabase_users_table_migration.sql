-- =====================================================
-- USER TABLE MIGRATION FOR CAREERBOOST AI 
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Create public.users table for application user data
CREATE TABLE public.users (
  -- Primary key linked to Supabase auth
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Contact Information (from ContactInfoInput component)
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  professional_title TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  
  -- Profile & Preferences (from ProfileInput component)
  profile_content TEXT,
  language_preference TEXT DEFAULT 'en',
  
  -- Subscription & Billing (from Stripe integration)
  plan_type TEXT CHECK (plan_type IN ('free', 'paid')) DEFAULT 'free',
  credits_balance INTEGER DEFAULT 0,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  stripe_customer_id TEXT,
  
  -- Usage Tracking
  last_login_at TIMESTAMPTZ,
  total_analyses INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own record
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow insert for new users (signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
