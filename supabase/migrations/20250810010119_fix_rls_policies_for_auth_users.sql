-- ================================================================
-- SUPABASE RLS POLICY FIXES FOR AUTHENTICATED USERS
-- ================================================================
-- Run this in Supabase Dashboard > SQL Editor to fix RLS blocking issues

-- ================================================================
-- 1. ENSURE SERVICE ROLE CAN BYPASS RLS FOR QUOTA API
-- ================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Users can insert their own daily usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Users can update their own daily usage" ON public.daily_usage;
DROP POLICY IF EXISTS "Service role can manage daily usage" ON public.daily_usage;

-- Recreate policies with service role bypass
CREATE POLICY "Users can view their own daily usage" 
    ON public.daily_usage FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can insert their own daily usage" 
    ON public.daily_usage FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can update their own daily usage" 
    ON public.daily_usage FOR UPDATE 
    USING (
        auth.uid() = user_id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Allow service role full access for backend API operations
CREATE POLICY "Service role can manage daily usage" 
    ON public.daily_usage FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================================
-- 2. ENSURE USERS TABLE HAS PROPER RLS FOR QUOTA API
-- ================================================================

-- Check if users table has RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Recreate policies with service role bypass
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (
        auth.uid() = id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (
        auth.uid() = id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id 
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Allow service role full access for backend operations
CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================================
-- 3. VERIFY SERVICE ROLE PERMISSIONS
-- ================================================================

-- Ensure service role has all necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.daily_usage TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================================
-- 4. ADD DEBUGGING FUNCTION FOR TROUBLESHOOTING
-- ================================================================

CREATE OR REPLACE FUNCTION debug_user_access(user_uuid UUID)
RETURNS TABLE(
    table_name TEXT,
    can_select BOOLEAN,
    user_exists BOOLEAN,
    daily_usage_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'users'::TEXT as table_name,
        EXISTS(SELECT 1 FROM public.users WHERE id = user_uuid) as can_select,
        EXISTS(SELECT 1 FROM public.users WHERE id = user_uuid) as user_exists,
        (SELECT COUNT(*) FROM public.daily_usage WHERE user_id = user_uuid) as daily_usage_count
    UNION ALL
    SELECT 
        'daily_usage'::TEXT as table_name,
        EXISTS(SELECT 1 FROM public.daily_usage WHERE user_id = user_uuid) as can_select,
        EXISTS(SELECT 1 FROM public.users WHERE id = user_uuid) as user_exists,
        (SELECT COUNT(*) FROM public.daily_usage WHERE user_id = user_uuid) as daily_usage_count;
END;
$$;

-- Grant access to debug function
GRANT EXECUTE ON FUNCTION debug_user_access(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION debug_user_access(UUID) TO authenticated;

-- ================================================================
-- 5. ENSURE AUTO-USER-CREATION TRIGGER WORKS
-- ================================================================

-- Recreate the user creation trigger to ensure new users get records
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table if not exists
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ================================================================

-- Test 1: Check if RLS policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('users', 'daily_usage');

-- Test 2: Check user access (replace with actual user UUID)
-- SELECT * FROM debug_user_access('your-user-uuid-here');

-- Test 3: Verify service role grants
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_name IN ('users', 'daily_usage') AND grantee = 'service_role';
