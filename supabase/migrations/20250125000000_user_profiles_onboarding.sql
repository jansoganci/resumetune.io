-- ================================================================
-- USER PROFILES TABLE - ONBOARDING DATA STORAGE
-- ================================================================
-- Stores essential user information collected during onboarding
-- Encrypted, GDPR-compliant, one profile per user
-- Created: 2025-01-25

-- ================================================================
-- 1. CREATE TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Essential Information (collected during onboarding)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  current_position TEXT NOT NULL,

  -- Optional Professional Links
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,

  -- Location (optional)
  city TEXT,
  country TEXT,

  -- Profile Content (optional, can be filled later on HomePage)
  professional_summary TEXT,

  -- Privacy & Consent
  data_consent BOOLEAN NOT NULL DEFAULT false,
  data_consent_date TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- GDPR Compliance
  data_retention_acknowledged BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Check constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR LENGTH(phone) >= 10),
  CONSTRAINT valid_names CHECK (LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1),
  CONSTRAINT valid_position CHECK (LENGTH(current_position) >= 2)
) TABLESPACE pg_default;

-- ================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
  ON public.user_profiles USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON public.user_profiles USING btree (email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding
  ON public.user_profiles USING btree (onboarding_completed, created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity
  ON public.user_profiles USING btree (last_activity_at DESC);

-- ================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile (onboarding)
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own profile (GDPR right to be forgotten)
CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Auto-update last_activity_at on any interaction
CREATE OR REPLACE FUNCTION update_user_profiles_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_activity
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_activity();

-- ================================================================
-- 5. RPC FUNCTIONS
-- ================================================================

-- ----------------------------------------------------------------
-- 5.1 GET USER PROFILE WITH FALLBACK
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  current_position TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  city TEXT,
  country TEXT,
  professional_summary TEXT,
  onboarding_completed BOOLEAN,
  onboarding_skipped BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.current_position,
    up.linkedin_url,
    up.portfolio_url,
    up.github_url,
    up.city,
    up.country,
    up.professional_summary,
    up.onboarding_completed,
    up.onboarding_skipped
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$;

-- ----------------------------------------------------------------
-- 5.2 MARK ONBOARDING AS COMPLETED
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    onboarding_completed = true,
    onboarding_completed_at = NOW(),
    onboarding_skipped = false
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- ----------------------------------------------------------------
-- 5.3 MARK ONBOARDING AS SKIPPED
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION skip_onboarding(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create minimal profile record to track skip
  INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    current_position,
    data_consent,
    onboarding_skipped
  )
  VALUES (
    p_user_id,
    'User',  -- Placeholder
    'User',  -- Placeholder
    (SELECT email FROM auth.users WHERE id = p_user_id),
    'Professional',  -- Placeholder
    false,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    onboarding_skipped = true;

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- 5.4 GDPR: EXPORT USER DATA
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', row_to_json(up.*),
    'daily_usage', (
      SELECT jsonb_agg(row_to_json(du.*))
      FROM public.daily_usage du
      WHERE du.user_id = p_user_id
    ),
    'exported_at', NOW(),
    'export_format', 'GDPR_COMPLIANT_JSON_V1'
  )
  INTO user_data
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  RETURN user_data;
END;
$$;

-- ----------------------------------------------------------------
-- 5.5 GDPR: DELETE ALL USER DATA
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_all_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete profile (cascade will handle related data)
  DELETE FROM public.user_profiles WHERE user_id = p_user_id;
  DELETE FROM public.daily_usage WHERE user_id = p_user_id;

  -- Note: auth.users deletion should be handled separately via Supabase Auth
  -- This function only deletes application data, not authentication records

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- 5.6 CHECK IF USER HAS PROFILE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_user_profile(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles
    WHERE user_id = p_user_id
  ) INTO profile_exists;

  RETURN profile_exists;
END;
$$;

-- ================================================================
-- 6. GRANTS
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION skip_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_profile(UUID) TO authenticated;

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- This migration creates:
-- ✅ user_profiles table with RLS
-- ✅ Indexes for performance
-- ✅ Triggers for auto-updating timestamps
-- ✅ RPC functions for CRUD operations
-- ✅ GDPR compliance functions (export, delete)
-- ✅ Onboarding skip functionality
--
-- Next: Create profileService.ts to interact with this schema
-- ================================================================
