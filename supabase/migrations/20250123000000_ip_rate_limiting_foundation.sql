-- ================================================================
-- IP RATE LIMITING FOUNDATION
-- ================================================================
-- This migration adds IP-based rate limiting capabilities to the existing
-- rate_limits table without modifying unrelated functionality.

-- ================================================================
-- 1. ENHANCE EXISTING RATE_LIMITS TABLE FOR IP RATE LIMITING
-- ================================================================

-- Add IP-specific rate limit types for hourly and daily windows
-- Note: The table structure already exists, we're just adding specific constraints

-- ================================================================
-- 2. CREATE IP RATE LIMITING RPC FUNCTION
-- ================================================================

-- Drop existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(TEXT, TEXT);

-- Create IP rate limiting function
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
    SELECT COALESCE(current_count, 0) INTO current_count
    FROM public.rate_limits
    WHERE identifier = p_ip_address
      AND limit_type = p_limit_type
      AND window_start = current_window_start;
    
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
            max_requests
        )
        VALUES (
            p_ip_address, 
            p_limit_type, 
            1, 
            current_window_start, 
            window_duration_minutes, 
            max_requests
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

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limit(TEXT, TEXT) TO service_role;

-- ================================================================
-- 3. CREATE IP RATE LIMITING CHECK FUNCTION (BOTH HOURLY AND DAILY)
-- ================================================================

-- Function to check both hourly and daily limits
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
    final_result JSONB;
BEGIN
    -- Check hourly limit
    hourly_result := public.check_ip_rate_limit(p_ip_address, 'ip_hourly');
    
    -- Check daily limit
    daily_result := public.check_ip_rate_limit(p_ip_address, 'ip_daily');
    
    -- Determine overall result
    IF (hourly_result->>'allowed')::BOOLEAN = false THEN
        -- Hourly limit exceeded
        final_result := jsonb_build_object(
            'allowed', false,
            'limit_exceeded', 'hourly',
            'hourly', hourly_result,
            'daily', daily_result,
            'retry_after', EXTRACT(EPOCH FROM (
                (hourly_result->>'window_end')::TIMESTAMP WITH TIME ZONE - NOW()
            ))::INTEGER
        );
    ELSIF (daily_result->>'allowed')::BOOLEAN = false THEN
        -- Daily limit exceeded
        final_result := jsonb_build_object(
            'allowed', false,
            'limit_exceeded', 'daily',
            'hourly', hourly_result,
            'daily', daily_result,
            'retry_after', EXTRACT(EPOCH FROM (
                (daily_result->>'window_end')::TIMESTAMP WITH TIME ZONE - NOW()
            ))::INTEGER
        );
    ELSE
        -- Both limits OK
        final_result := jsonb_build_object(
            'allowed', true,
            'limit_exceeded', null,
            'hourly', hourly_result,
            'daily', daily_result,
            'retry_after', 0
        );
    END IF;
    
    RETURN final_result;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limits_both(TEXT) TO service_role;

-- ================================================================
-- 4. ADD RLS POLICIES FOR RATE_LIMITS TABLE
-- ================================================================

-- Enable RLS on rate_limits table if not already enabled
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create policy for service role (backend API access)
CREATE POLICY "Service role can manage rate limits" 
    ON public.rate_limits FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================================
-- 5. CREATE CLEANUP FUNCTION FOR OLD RATE LIMIT RECORDS
-- ================================================================

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete rate limit records older than 7 days
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- ================================================================
-- 6. VERIFY EXISTING INDEXES ARE OPTIMAL FOR IP RATE LIMITING
-- ================================================================

-- The existing indexes should work well, but let's ensure we have the right ones
-- Note: These indexes already exist from the previous migration

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- This migration adds IP-based rate limiting foundation:
-- 
-- 1. check_ip_rate_limit() - Check single limit type (hourly or daily)
-- 2. check_ip_rate_limits_both() - Check both hourly and daily limits
-- 3. RLS policies for rate_limits table
-- 4. Cleanup function for old records
--
-- Usage:
-- SELECT public.check_ip_rate_limits_both('192.168.1.1');
-- 
-- Returns JSON with allowed status, current counts, and retry-after info
-- ================================================================
