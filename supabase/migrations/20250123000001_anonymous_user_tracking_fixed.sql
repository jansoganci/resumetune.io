-- ================================================================
-- ANONYMOUS USER TRACKING SYSTEM - PHASE 2.1 (FIXED VERSION)
-- ================================================================
-- This migration implements anonymous user tracking for abuse detection
-- Tracks IP-to-anonymous-ID relationships and detects abuse patterns
-- FIXED: Handles existing objects gracefully to avoid conflicts

-- ================================================================
-- 1. CREATE ANONYMOUS USER TRACKING TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.anonymous_user_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address_hash TEXT NOT NULL,
    anonymous_id TEXT NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_count INTEGER DEFAULT 1,
    abuse_detected BOOLEAN DEFAULT FALSE,
    captcha_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (IF NOT EXISTS to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_ip ON public.anonymous_user_tracking(ip_address_hash);
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_time ON public.anonymous_user_tracking(first_seen);
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_abuse ON public.anonymous_user_tracking(abuse_detected);
CREATE INDEX IF NOT EXISTS idx_anonymous_tracking_lookup ON public.anonymous_user_tracking(ip_address_hash, first_seen);

-- Unique constraint to prevent duplicate IP-anonymous ID combinations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'anonymous_tracking_ip_id_unique'
    ) THEN
        ALTER TABLE public.anonymous_user_tracking 
        ADD CONSTRAINT anonymous_tracking_ip_id_unique 
        UNIQUE (ip_address_hash, anonymous_id);
    END IF;
END $$;

-- ================================================================
-- 2. CREATE ANONYMOUS USER TRACKING FUNCTION
-- ================================================================

-- Function to track anonymous user creation and detect abuse
CREATE OR REPLACE FUNCTION public.track_anonymous_user(
    p_ip_address TEXT,
    p_anonymous_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ip_hash TEXT;
    v_anonymous_id_count INTEGER;
    v_is_abuse BOOLEAN;
    v_captcha_required BOOLEAN;
    v_result JSONB;
    v_twenty_four_hours_ago TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Hash IP address for privacy (simple hash for now)
    v_ip_hash := 'ip_' || abs(hashtext(p_ip_address));
    
    -- Calculate 24 hours ago
    v_twenty_four_hours_ago := NOW() - INTERVAL '24 hours';
    
    -- Track this anonymous ID
    INSERT INTO public.anonymous_user_tracking (
        ip_address_hash, 
        anonymous_id, 
        last_seen,
        updated_at
    )
    VALUES (
        v_ip_hash, 
        p_anonymous_id, 
        NOW(),
        NOW()
    )
    ON CONFLICT (ip_address_hash, anonymous_id)
    DO UPDATE SET 
        last_seen = NOW(),
        request_count = anonymous_user_tracking.request_count + 1,
        updated_at = NOW();
    
    -- Count unique anonymous IDs from this IP in last 24 hours
    SELECT COUNT(DISTINCT anonymous_id) INTO v_anonymous_id_count
    FROM public.anonymous_user_tracking
    WHERE ip_address_hash = v_ip_hash
      AND first_seen >= v_twenty_four_hours_ago;
    
    -- Abuse detection logic: 3-5 anonymous IDs per IP in 24h
    v_is_abuse := v_anonymous_id_count >= 3;
    v_captcha_required := v_anonymous_id_count >= 5;
    
    -- If abuse detected, flag all anonymous IDs from this IP
    IF v_is_abuse THEN
        UPDATE public.anonymous_user_tracking
        SET 
            abuse_detected = TRUE,
            captcha_required = v_captcha_required,
            updated_at = NOW()
        WHERE ip_address_hash = v_ip_hash;
    END IF;
    
    -- Build result
    v_result := jsonb_build_object(
        'ip_address_hash', v_ip_hash,
        'anonymous_id', p_anonymous_id,
        'anonymous_id_count', v_anonymous_id_count,
        'is_abuse', v_is_abuse,
        'captcha_required', v_captcha_required,
        'tracked_at', NOW(),
        'abuse_threshold', 3,
        'captcha_threshold', 5
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.track_anonymous_user(TEXT, TEXT) TO service_role;

-- ================================================================
-- 3. CREATE ABUSE DETECTION FUNCTION
-- ================================================================

-- Function to check if an IP address has abuse patterns
CREATE OR REPLACE FUNCTION public.check_anonymous_abuse(
    p_ip_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ip_hash TEXT;
    v_anonymous_id_count INTEGER;
    v_is_abuse BOOLEAN;
    v_captcha_required BOOLEAN;
    v_twenty_four_hours_ago TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
BEGIN
    -- Hash IP address
    v_ip_hash := 'ip_' || abs(hashtext(p_ip_address));
    
    -- Calculate 24 hours ago
    v_twenty_four_hours_ago := NOW() - INTERVAL '24 hours';
    
    -- Count unique anonymous IDs from this IP in last 24 hours
    SELECT COUNT(DISTINCT anonymous_id) INTO v_anonymous_id_count
    FROM public.anonymous_user_tracking
    WHERE ip_address_hash = v_ip_hash
      AND first_seen >= v_twenty_four_hours_ago;
    
    -- Abuse detection logic
    v_is_abuse := v_anonymous_id_count >= 3;
    v_captcha_required := v_anonymous_id_count >= 5;
    
    -- Build result
    v_result := jsonb_build_object(
        'ip_address_hash', v_ip_hash,
        'anonymous_id_count', v_anonymous_id_count,
        'is_abuse', v_is_abuse,
        'captcha_required', v_captcha_required,
        'abuse_threshold', 3,
        'captcha_threshold', 5,
        'checked_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.check_anonymous_abuse(TEXT) TO service_role;

-- ================================================================
-- 4. CREATE CLEANUP FUNCTION
-- ================================================================

-- Function to clean up old anonymous user tracking data
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_tracking()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete tracking records older than 30 days
    DELETE FROM public.anonymous_user_tracking 
    WHERE first_seen < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_anonymous_tracking() TO service_role;

-- ================================================================
-- 5. ADD RLS POLICIES (GRACEFULLY HANDLE EXISTING)
-- ================================================================

-- Enable RLS on anonymous_user_tracking table
ALTER TABLE public.anonymous_user_tracking ENABLE ROW LEVEL SECURITY;

-- Policy for service role (backend API access) - handle existing gracefully
DO $$
BEGIN
    -- Drop existing policy if it exists to avoid conflicts
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'anonymous_user_tracking' 
        AND policyname = 'Service role can manage anonymous tracking'
    ) THEN
        DROP POLICY "Service role can manage anonymous tracking" ON public.anonymous_user_tracking;
    END IF;
    
    -- Create the policy
    CREATE POLICY "Service role can manage anonymous tracking"
        ON public.anonymous_user_tracking FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
        
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but continue
        RAISE NOTICE 'Policy creation had issues: %', SQLERRM;
END $$;

-- ================================================================
-- 6. VERIFY TABLE CREATION
-- ================================================================

-- Add comment to table
COMMENT ON TABLE public.anonymous_user_tracking IS 
'Anonymous user tracking for abuse detection. Tracks IP-to-anonymous-ID relationships and detects abuse patterns.';

-- Add comment to function
COMMENT ON FUNCTION public.track_anonymous_user(TEXT, TEXT) IS 
'Tracks anonymous user creation and detects abuse patterns. Returns abuse status and metadata.';

-- Add comment to function
COMMENT ON FUNCTION public.check_anonymous_abuse(TEXT) IS 
'Checks if an IP address has abuse patterns based on anonymous ID creation frequency.';

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- This migration implements Phase 2.1: Anonymous ID Tracking System
-- 
-- 1. anonymous_user_tracking table - Stores IP-to-anonymous-ID relationships
-- 2. track_anonymous_user() - Tracks new anonymous users and detects abuse
-- 3. check_anonymous_abuse() - Checks abuse status for an IP address
-- 4. cleanup_old_anonymous_tracking() - Cleans up old tracking data
-- 5. RLS policies for security
--
-- Usage:
-- SELECT public.track_anonymous_user('192.168.1.100', 'anon_1234567890_abc123');
-- SELECT public.check_anonymous_abuse('192.168.1.100');
-- 
-- Abuse Detection:
-- - 3+ anonymous IDs per IP in 24h = abuse detected
-- - 5+ anonymous IDs per IP in 24h = CAPTCHA required
-- ================================================================
