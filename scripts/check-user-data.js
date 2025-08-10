#!/usr/bin/env node

/**
 * USER DATA CHECK
 * ===============
 * Belirli user ID'sinin Supabase'de var olup olmadığını kontrol eder
 */

import dotenv from 'dotenv';
dotenv.config();

const TEST_USER_ID = '88fa0c51-1467-4fcb-8474-9d945eb7892e';

async function checkUserData() {
  try {
    console.log('🔍 Checking user data in Supabase...');
    console.log(`User ID: ${TEST_USER_ID}`);
    
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check 1: User table
    console.log('\n📊 Check 1: Users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('❌ User NOT found in users table');
        console.log('📝 This is likely the problem! User needs to be created in users table.');
      } else {
        console.error('❌ Users table query error:', userError);
      }
    } else {
      console.log('✅ User found in users table');
      console.log('📊 User data:', userData);
    }

    // Check 2: Auth users
    console.log('\n🔐 Check 2: Auth users...');
    const { data: authData, error: authError } = await supabase.auth.admin
      .getUserById(TEST_USER_ID);

    if (authError) {
      console.error('❌ Auth user query error:', authError);
    } else {
      console.log('✅ User found in auth.users');
      console.log('📧 Email:', authData.user?.email);
    }

    // Check 3: Daily usage
    console.log('\n📈 Check 3: Daily usage...');
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageData, error: usageError } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('usage_date', today);

    if (usageError) {
      console.error('❌ Daily usage query error:', usageError);
    } else {
      console.log(`✅ Daily usage records (${today}):`, usageData?.length || 0);
      if (usageData?.length > 0) {
        console.log('📊 Usage data:', usageData[0]);
      }
    }

    // Solution recommendation
    console.log('\n💡 SOLUTION:');
    if (userError?.code === 'PGRST116') {
      console.log('🔧 User needs to be inserted into public.users table:');
      console.log(`
INSERT INTO public.users (id, email, credits_balance, plan_type, subscription_status)
VALUES (
  '${TEST_USER_ID}',
  'user@example.com',  -- Replace with actual email
  100,                 -- Initial credits
  'credits',           -- Plan type
  'active'             -- Status
);`);
    } else {
      console.log('✅ User data looks good, issue might be elsewhere.');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUserData();
