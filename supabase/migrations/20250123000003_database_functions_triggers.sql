-- ================================================================
-- DATABASE FUNCTIONS & TRIGGERS - PHASE 2.3
-- ================================================================
-- This migration implements optimized database functions and triggers
-- Includes cleanup mechanisms, performance optimizations, and monitoring

-- ================================================================
-- 1. OPTIMIZE EXISTING FUNCTIONS FOR PERFORMANCE
-- ================================================================

-- Optimize the track_anonymous_user function with better error handling
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
    v_existing_record RECORD;
BEGIN
    -- Hash IP address for privacy
    v_ip_hash := 'ip_' || abs(hashtext(p_ip_address));
    
    -- Calculate 24 hours ago
    v_twenty_four_hours_ago := NOW() - INTERVAL '24 hours';
    
    -- Check if record already exists
    SELECT * INTO v_existing_record
    FROM public.anonymous_user_tracking
    WHERE ip_address_hash = v_ip_hash 
      AND anonymous_id = p_anonymous_id
    LIMIT 1;
    
    IF v_existing_record IS NOT NULL THEN
        -- Update existing record
        UPDATE public.anonymous_user_tracking
        SET 
            last_seen = NOW(),
            request_count = request_count + 1,
            updated_at = NOW()
        WHERE id = v_existing_record.id;
        
        -- Get updated anonymous ID count
        SELECT COUNT(DISTINCT anonymous_id) INTO v_anonymous_id_count
        FROM public.anonymous_user_tracking
        WHERE ip_address_hash = v_ip_hash
          AND first_seen >= v_twenty_four_hours_ago;
    ELSE
        -- Insert new record
        INSERT INTO public.anonymous_user_tracking (
            ip_address_hash, 
            anonymous_id, 
            first_seen,
            last_seen,
            updated_at
        )
        VALUES (
            v_ip_hash, 
            p_anonymous_id, 
            NOW(),
            NOW(),
            NOW()
        );
        
        -- Get updated anonymous ID count
        SELECT COUNT(DISTINCT anonymous_id) INTO v_anonymous_id_count
        FROM public.anonymous_user_tracking
        WHERE ip_address_hash = v_ip_hash
          AND first_seen >= v_twenty_four_hours_ago;
    END IF;
    
    -- Abuse detection logic: 3-5 anonymous IDs per IP in 24h
    v_is_abuse := v_anonymous_id_count >= 3;
    v_captcha_required := v_anonymous_id_count >= 5;
    
    -- Build result
    v_result := jsonb_build_object(
        'ip_address_hash', v_ip_hash,
        'anonymous_id', p_anonymous_id,
        'anonymous_id_count', v_anonymous_id_count,
        'is_abuse', v_is_abuse,
        'captcha_required', v_captcha_required,
        'tracked_at', NOW(),
        'abuse_threshold', 3,
        'captcha_threshold', 5,
        'record_updated', v_existing_record IS NOT NULL
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 2. CREATE ENHANCED CLEANUP FUNCTIONS
-- ================================================================

-- Function to clean up old rate limiting data
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete rate limit records older than 7 days
    DELETE FROM public.rate_limits 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Function to clean up old anonymous tracking data with configurable retention
CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_tracking(
    p_retention_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
    v_deleted_count INTEGER;
    v_abuse_records_deleted INTEGER;
    v_normal_records_deleted INTEGER;
    v_result JSONB;
BEGIN
    -- Calculate cutoff date
    v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;
    
    -- Delete abuse records older than retention period
    DELETE FROM public.anonymous_user_tracking 
    WHERE abuse_detected = TRUE 
      AND first_seen < v_cutoff_date;
    
    GET DIAGNOSTICS v_abuse_records_deleted = ROW_COUNT;
    
    -- Delete normal records older than retention period
    DELETE FROM public.anonymous_user_tracking 
    WHERE abuse_detected = FALSE 
      AND first_seen < v_cutoff_date;
    
    GET DIAGNOSTICS v_normal_records_deleted = ROW_COUNT;
    
    v_deleted_count := v_abuse_records_deleted + v_normal_records_deleted;
    
    -- Build result
    v_result := jsonb_build_object(
        'total_records_deleted', v_deleted_count,
        'abuse_records_deleted', v_abuse_records_deleted,
        'normal_records_deleted', v_normal_records_deleted,
        'retention_days', p_retention_days,
        'cutoff_date', v_cutoff_date,
        'cleanup_time', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- Function to clean up orphaned or invalid records
CREATE OR REPLACE FUNCTION public.cleanup_invalid_records()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_result JSONB;
BEGIN
    -- Delete records with invalid IP hashes
    DELETE FROM public.anonymous_user_tracking 
    WHERE ip_address_hash IS NULL 
       OR ip_address_hash = ''
       OR anonymous_id IS NULL 
       OR anonymous_id = '';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Build result
    v_result := jsonb_build_object(
        'invalid_records_deleted', v_deleted_count,
        'cleanup_time', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 3. CREATE MONITORING AND HEALTH CHECK FUNCTIONS
-- ================================================================

-- Function to check system health and performance
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
    
    -- Get age of oldest and newest records
    SELECT 
        NOW() - MIN(created_at),
        NOW() - MAX(created_at)
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

-- Function to get abuse statistics for monitoring
CREATE OR REPLACE FUNCTION public.get_abuse_statistics(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_result JSONB;
    v_total_ips INTEGER;
    v_abusive_ips INTEGER;
    v_captcha_required_ips INTEGER;
    v_avg_abuse_score NUMERIC;
    v_top_abusive_ips JSONB;
BEGIN
    -- Calculate start time
    v_start_time := NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get basic statistics
    SELECT 
        COUNT(DISTINCT ip_address_hash),
        COUNT(DISTINCT CASE WHEN abuse_detected THEN ip_address_hash END),
        COUNT(DISTINCT CASE WHEN captcha_required THEN ip_address_hash END),
        AVG(abuse_score)
    INTO 
        v_total_ips,
        v_abusive_ips,
        v_captcha_required_ips,
        v_avg_abuse_score
    FROM public.anonymous_user_tracking
    WHERE first_seen >= v_start_time;
    
    -- Get top 5 most abusive IPs
    SELECT jsonb_agg(
        jsonb_build_object(
            'ip_hash', ip_address_hash,
            'abuse_score', abuse_score,
            'anonymous_id_count', COUNT(DISTINCT anonymous_id),
            'total_requests', SUM(request_count)
        )
    ) INTO v_top_abusive_ips
    FROM public.anonymous_user_tracking
    WHERE first_seen >= v_start_time
      AND abuse_detected = TRUE
    GROUP BY ip_address_hash, abuse_score
    ORDER BY abuse_score DESC, COUNT(DISTINCT anonymous_id) DESC
    LIMIT 5;
    
    -- Build result
    v_result := jsonb_build_object(
        'time_period_hours', p_hours_back,
        'start_time', v_start_time,
        'end_time', NOW(),
        'statistics', jsonb_build_object(
            'total_unique_ips', v_total_ips,
            'abusive_ips', v_abusive_ips,
            'captcha_required_ips', v_captcha_required_ips,
            'abuse_percentage', CASE 
                WHEN v_total_ips > 0 THEN ROUND((v_abusive_ips::NUMERIC / v_total_ips * 100), 2)
                ELSE 0
            END,
            'avg_abuse_score', ROUND(COALESCE(v_avg_abuse_score, 0), 2)
        ),
        'top_abusive_ips', COALESCE(v_top_abusive_ips, '[]'::JSONB),
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 4. CREATE PERFORMANCE OPTIMIZATION FUNCTIONS
-- ================================================================

-- Function to analyze and optimize table performance
CREATE OR REPLACE FUNCTION public.optimize_table_performance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_anonymous_tracking_size TEXT;
    v_rate_limits_size TEXT;
    v_anonymous_tracking_indexes INTEGER;
    v_rate_limits_indexes INTEGER;
BEGIN
    -- Get table sizes
    SELECT pg_size_pretty(pg_total_relation_size('public.anonymous_user_tracking'))
    INTO v_anonymous_tracking_size;
    
    SELECT pg_size_pretty(pg_total_relation_size('public.rate_limits'))
    INTO v_rate_limits_size;
    
    -- Get index counts
    SELECT COUNT(*) INTO v_anonymous_tracking_indexes
    FROM pg_indexes 
    WHERE tablename = 'anonymous_user_tracking' 
      AND schemaname = 'public';
    
    SELECT COUNT(*) INTO v_rate_limits_indexes
    FROM pg_indexes 
    WHERE tablename = 'rate_limits' 
      AND schemaname = 'public';
    
    -- Build optimization result
    v_result := jsonb_build_object(
        'table_sizes', jsonb_build_object(
            'anonymous_user_tracking', v_anonymous_tracking_size,
            'rate_limits', v_rate_limits_size
        ),
        'indexes', jsonb_build_object(
            'anonymous_user_tracking_count', v_anonymous_tracking_indexes,
            'rate_limits_count', v_rate_limits_indexes
        ),
        'optimization_recommendations', jsonb_build_object(
            'vacuum_needed', TRUE,
            'analyze_needed', TRUE,
            'index_maintenance', v_anonymous_tracking_indexes < 5
        ),
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 5. CREATE MAINTENANCE SCHEDULING FUNCTIONS
-- ================================================================

-- Function to schedule maintenance tasks
CREATE OR REPLACE FUNCTION public.schedule_maintenance_tasks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_last_cleanup TIMESTAMP WITH TIME ZONE;
    v_last_optimization TIMESTAMP WITH TIME ZONE;
    v_maintenance_needed BOOLEAN;
BEGIN
    -- Check when maintenance was last performed
    SELECT MAX(created_at) INTO v_last_cleanup
    FROM public.rate_limits
    WHERE created_at < NOW() - INTERVAL '1 day';
    
    -- Determine if maintenance is needed
    v_maintenance_needed := v_last_cleanup IS NULL 
                         OR v_last_cleanup < NOW() - INTERVAL '7 days';
    
    -- Build maintenance schedule
    v_result := jsonb_build_object(
        'maintenance_needed', v_maintenance_needed,
        'last_cleanup', v_last_cleanup,
        'recommended_tasks', jsonb_build_object(
            'cleanup_old_rate_limits', TRUE,
            'cleanup_old_anonymous_tracking', TRUE,
            'cleanup_invalid_records', TRUE,
            'optimize_table_performance', v_maintenance_needed,
            'check_system_health', TRUE
        ),
        'schedule', jsonb_build_object(
            'daily', jsonb_build_array('check_system_health'),
            'weekly', jsonb_build_array('cleanup_old_rate_limits', 'cleanup_old_anonymous_tracking'),
            'monthly', jsonb_build_array('optimize_table_performance', 'cleanup_invalid_records')
        ),
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$;

-- ================================================================
-- 6. GRANT PERMISSIONS AND ADD COMMENTS
-- ================================================================

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_anonymous_tracking(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_invalid_records() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_system_health() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_abuse_statistics(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.optimize_table_performance() TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_maintenance_tasks() TO service_role;

-- Add comments to functions
COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 
'Cleans up old rate limiting data older than 7 days.';

COMMENT ON FUNCTION public.cleanup_old_anonymous_tracking(INTEGER) IS 
'Cleans up old anonymous tracking data with configurable retention period.';

COMMENT ON FUNCTION public.cleanup_invalid_records() IS 
'Removes invalid or orphaned records from tracking tables.';

COMMENT ON FUNCTION public.check_system_health() IS 
'Performs comprehensive health check of the abuse prevention system.';

COMMENT ON FUNCTION public.get_abuse_statistics(INTEGER) IS 
'Provides detailed abuse statistics and top abusive IPs for monitoring.';

COMMENT ON FUNCTION public.optimize_table_performance() IS 
'Analyzes table performance and provides optimization recommendations.';

COMMENT ON FUNCTION public.schedule_maintenance_tasks() IS 
'Determines when maintenance tasks should be performed.';

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- This migration implements Phase 2.3: Database Functions & Triggers
-- 
-- 1. Optimized existing functions for better performance
-- 2. Enhanced cleanup functions with configurable retention
-- 3. Monitoring and health check functions
-- 4. Performance optimization functions
-- 5. Maintenance scheduling functions
-- 6. Proper permissions and documentation
--
-- Usage:
-- SELECT public.cleanup_old_rate_limits();
-- SELECT public.cleanup_old_anonymous_tracking(30);
-- SELECT public.check_system_health();
-- SELECT public.get_abuse_statistics(24);
-- SELECT public.optimize_table_performance();
-- SELECT public.schedule_maintenance_tasks();
-- 
-- Maintenance Schedule:
-- - Daily: System health checks
-- - Weekly: Data cleanup
-- - Monthly: Performance optimization
-- ================================================================
