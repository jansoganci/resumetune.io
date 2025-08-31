-- ================================================================
-- FIX DATABASE SCHEMA ISSUES - PHASE 3.4
-- ================================================================
-- This migration fixes all database schema issues that are causing test failures
-- Includes missing columns, column ambiguity fixes, and table structure updates

-- ================================================================
-- 1. FIX RATE_LIMITS TABLE STRUCTURE
-- ================================================================

-- Add missing created_at column to rate_limits table
ALTER TABLE public.rate_limits 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing updated_at column if it doesn't exist
ALTER TABLE public.rate_limits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================================
-- 2. FIX COLUMN AMBIGUITY IN RATE LIMITING FUNCTIONS
-- ================================================================

-- Drop and recreate the check_ip_rate_limit function to fix column ambiguity
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
    p_ip_address TEXT,
    p_limit_type TEXT DEFAULT 'ip_hourly'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_window_start TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
    max_requests INTEGER;
    window_duration_minutes INTEGER;
    is_allowed BOOLEAN;
    result JSONB;
BEGIN
    -- Set limits based on type
    IF p_limit_type = 'ip_hourly' THEN
        max_requests := 100;
        window_duration_minutes := 60;
        current_window_start := date_trunc('hour', NOW());
    ELSIF p_limit_type = 'ip_daily' THEN
        max_requests := 300;
        window_duration_minutes := 1440; -- 24 hours
        current_window_start := date_trunc('day', NOW());
    ELSE
        RAISE EXCEPTION 'Invalid limit type: %. Use ip_hourly or ip_daily', p_limit_type;
    END IF;
    
    -- Check current count for this IP and window
    SELECT COALESCE(rl.current_count, 0) INTO current_count
    FROM public.rate_limits rl
    WHERE rl.identifier = p_ip_address
      AND rl.limit_type = p_limit_type
      AND rl.window_start = current_window_start;
    
    -- Check if limit exceeded
    is_allowed := current_count < max_requests;
    
    -- If allowed, increment counter
    IF is_allowed THEN
        INSERT INTO public.rate_limits (
            identifier, 
            limit_type, 
            current_count, 
            window_start, 
            window_duration_minutes, 
            max_requests,
            created_at,
            updated_at
        )
        VALUES (
            p_ip_address, 
            p_limit_type, 
            1, 
            current_window_start, 
            window_duration_minutes, 
            max_requests,
            NOW(),
            NOW()
        )
        ON CONFLICT (identifier, limit_type, endpoint, window_start)
        DO UPDATE SET 
            current_count = rate_limits.current_count + 1,
            updated_at = NOW()
        RETURNING current_count INTO current_count;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'allowed', is_allowed,
        'current_count', current_count,
        'max_requests', max_requests,
        'window_start', current_window_start,
        'window_end', current_window_start + (window_duration_minutes || ' minutes')::INTERVAL,
        'limit_type', p_limit_type,
        'remaining', GREATEST(0, max_requests - current_count)
    );
    
    RETURN result;
END;
$$;

-- Fix the check_ip_rate_limits_both function
DROP FUNCTION IF EXISTS public.check_ip_rate_limits_both(TEXT);

CREATE OR REPLACE FUNCTION public.check_ip_rate_limits_both(
    p_ip_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hourly_result JSONB;
    daily_result JSONB;
    combined_result JSONB;
BEGIN
    -- Check hourly limit
    SELECT public.check_ip_rate_limit(p_ip_address, 'ip_hourly') INTO hourly_result;
    
    -- Check daily limit
    SELECT public.check_ip_rate_limit(p_ip_address, 'ip_daily') INTO daily_result;
    
    -- Combine results
    combined_result := jsonb_build_object(
        'hourly', hourly_result,
        'daily', daily_result,
        'overall_allowed', (hourly_result->>'allowed')::BOOLEAN AND (daily_result->>'allowed')::BOOLEAN,
        'checked_at', NOW()
    );
    
    RETURN combined_result;
END;
$$;

-- ================================================================
-- 3. FIX ANONYMOUS USER TRACKING TABLE STRUCTURE
-- ================================================================

-- Ensure all required columns exist in anonymous_user_tracking
ALTER TABLE public.anonymous_user_tracking 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS abuse_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pattern_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_abuse_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS abuse_history JSONB DEFAULT '[]';

-- ================================================================
-- 4. FIX SYSTEM HEALTH CHECK FUNCTION
-- ================================================================

-- Drop and recreate the check_system_health function
DROP FUNCTION IF EXISTS public.check_system_health();

CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_rate_limit_count INTEGER;
    v_anonymous_tracking_count INTEGER;
    v_abuse_count INTEGER;
    v_captcha_required_count INTEGER;
    v_oldest_record_age INTERVAL;
    v_newest_record_age INTERVAL;
BEGIN
    -- Get counts from rate_limits table
    SELECT COUNT(*) INTO v_rate_limit_count
    FROM public.rate_limits;
    
    -- Get counts from anonymous_user_tracking table
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN abuse_detected THEN 1 END),
        COUNT(CASE WHEN captcha_required THEN 1 END)
    INTO 
        v_anonymous_tracking_count,
        v_abuse_count,
        v_captcha_required_count
    FROM public.anonymous_user_tracking;
    
    -- Get age of oldest and newest records (handle case where created_at might be NULL)
    SELECT 
        COALESCE(NOW() - MIN(COALESCE(created_at, NOW())), INTERVAL '0'),
        COALESCE(NOW() - MAX(COALESCE(created_at, NOW())), INTERVAL '0')
    INTO 
        v_oldest_record_age,
        v_newest_record_age
    FROM public.rate_limits;
    
    -- Build health check result
    v_result := jsonb_build_object(
        'system_health', 'healthy',
        'timestamp', NOW(),
        'rate_limits', jsonb_build_object(
            'total_records', v_rate_limit_count,
            'oldest_record_age', v_oldest_record_age,
            'newest_record_age', v_newest_record_age
        ),
        'anonymous_tracking', jsonb_build_object(
            'total_records', v_anonymous_tracking_count,
            'abuse_records', v_abuse_count,
            'captcha_required', v_captcha_required_count
        ),
        'recommendations', jsonb_build_object(
            'cleanup_needed', v_rate_limit_count > 10000,
            'abuse_monitoring', v_abuse_count > 100,
            'performance_ok', v_anonymous_tracking_count < 50000
        )
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 5. FIX ANONYMOUS TRACKING FUNCTIONS
-- ================================================================

-- Fix the track_anonymous_user function to handle interval comparisons properly
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
        first_seen,
        last_seen,
        created_at,
        updated_at
    )
    VALUES (
        v_ip_hash, 
        p_anonymous_id, 
        NOW(),
        NOW(),
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
        'is_abuse', v_is_abuse,
        'anonymous_id_count', v_anonymous_id_count,
        'captcha_required', v_captcha_required,
        'ip_address_hash', v_ip_hash,
        'abuse_threshold', 3,
        'captcha_threshold', 5,
        'checked_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 6. GRANT PERMISSIONS
-- ================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limit(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limits_both(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_system_health() TO service_role;
GRANT EXECUTE ON FUNCTION public.track_anonymous_user(TEXT, TEXT) TO service_role;

-- ================================================================
-- 7. VERIFICATION
-- ================================================================

-- Test that the functions can be called without errors
DO $$
BEGIN
    -- This will raise an error if there are syntax issues
    PERFORM public.check_system_health();
    RAISE NOTICE 'System health check function is working';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'System health check function has errors: %', SQLERRM;
END $$;

-- Migration 20250123000004_fix_database_schema_issues: Fix all database schema issues causing test failures - Phase 3.4
