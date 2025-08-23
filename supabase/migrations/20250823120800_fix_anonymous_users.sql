-- ================================================================
-- FIX ANONYMOUS USERS SUPPORT
-- ================================================================
-- Anonymous users have IDs like "anon_1755933022749_gf4w2bxx9" which are not UUIDs
-- This migration fixes the schema to support both UUID and string user IDs

-- ================================================================
-- 1. MODIFY DAILY_USAGE TABLE TO SUPPORT STRING USER IDS
-- ================================================================

-- First, remove the foreign key constraint since anonymous users aren't in the users table
ALTER TABLE public.daily_usage 
DROP CONSTRAINT IF EXISTS daily_usage_user_id_fkey;

-- Change user_id column from UUID to TEXT to support both UUIDs and anonymous IDs
ALTER TABLE public.daily_usage 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Update the unique constraint
ALTER TABLE public.daily_usage 
DROP CONSTRAINT IF EXISTS daily_usage_user_date_unique;

ALTER TABLE public.daily_usage 
ADD CONSTRAINT daily_usage_user_date_unique 
UNIQUE (user_id, usage_date);

-- ================================================================
-- 2. UPDATE INCREMENT_DAILY_USAGE FUNCTION
-- ================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.increment_daily_usage(TEXT, DATE);

-- Recreate with proper TEXT parameter
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
    p_user_id TEXT,
    p_usage_date DATE
) RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    -- Insert or update daily usage count
    INSERT INTO public.daily_usage (user_id, usage_date, ai_calls_count)
    VALUES (p_user_id, p_usage_date, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        ai_calls_count = daily_usage.ai_calls_count + 1,
        last_updated = NOW()
    RETURNING ai_calls_count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(TEXT, DATE) TO anon, authenticated;

-- ================================================================
-- 3. UPDATE EXISTING DATA (if any)
-- ================================================================

-- Update any existing UUID entries to remain as strings
-- This is safe since PostgreSQL can cast UUIDs to strings automatically

-- ================================================================
-- 4. UPDATE INDEXES FOR BETTER PERFORMANCE
-- ================================================================

-- Recreate indexes for the new TEXT user_id column
DROP INDEX IF EXISTS idx_daily_usage_user_id;
DROP INDEX IF EXISTS idx_daily_usage_user_date;

CREATE INDEX idx_daily_usage_user_id 
    ON public.daily_usage USING btree (user_id);
    
CREATE INDEX idx_daily_usage_user_date 
    ON public.daily_usage USING btree (user_id, usage_date);

-- ================================================================
-- 5. ADD RLS POLICIES FOR ANONYMOUS USERS
-- ================================================================

-- Enable RLS on daily_usage table
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (can only access their own data)
CREATE POLICY "Users can access own daily usage" ON public.daily_usage
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

-- Policy for anonymous users (allow all operations since we can't identify them)
-- In production, you might want to add IP-based restrictions
CREATE POLICY "Anonymous users can access daily usage" ON public.daily_usage
    FOR ALL
    TO anon
    USING (user_id LIKE 'anon_%');

-- Policy for service role (admin access)
CREATE POLICY "Service role full access" ON public.daily_usage
    FOR ALL
    TO service_role
    USING (true);

COMMENT ON TABLE public.daily_usage IS 
'Daily usage tracking for both authenticated users (UUID) and anonymous users (anon_* format)';
