-- =====================================================
-- CRITICAL FIX: Credit Transactions Foreign Key Issue
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Step 1: Drop the existing foreign key constraint that references auth.users
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

-- Step 2: Add correct foreign key constraint that references public.users
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Verify the fix by checking constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='credit_transactions'
    AND tc.table_schema='public';

-- Step 4: Test the fix with your specific user ID
-- This should work after the fix
/*
INSERT INTO public.credit_transactions (
    user_id,
    user_email,
    credits_added,
    transaction_type,
    stripe_session_id,
    amount_paid,
    currency,
    plan_name
) VALUES (
    '88fa0c51-1467-4fcb-8474-9d945eb7892e'::uuid,
    'umrsgnc@gmail.com',
    50,
    'purchase',
    'cs_test_session_123',
    1000,
    'usd',
    '50 Credits'
);
*/

-- Step 5: Add a function to validate webhook data before insertion
CREATE OR REPLACE FUNCTION validate_webhook_transaction(
    p_user_id UUID,
    p_user_email TEXT,
    p_stripe_session_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    email_matches BOOLEAN;
    session_exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id) INTO user_exists;
    
    -- Check if email matches
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = p_user_id AND email = p_user_email) INTO email_matches;
    
    -- Check if session already processed
    SELECT EXISTS(SELECT 1 FROM public.credit_transactions WHERE stripe_session_id = p_stripe_session_id) INTO session_exists;
    
    -- Return validation result
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User % does not exist', p_user_id;
    END IF;
    
    IF NOT email_matches THEN
        RAISE EXCEPTION 'Email mismatch for user %', p_user_id;
    END IF;
    
    IF session_exists THEN
        RAISE EXCEPTION 'Session % already processed', p_stripe_session_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_webhook_transaction(UUID, TEXT, TEXT) TO service_role;
