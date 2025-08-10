#!/usr/bin/env node

/**
 * SUPABASE CONNECTION TEST
 * ========================
 * Backend API'sinin Supabase'e bağlanabilip bağlanamadığını test eder
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Environment variables check
console.log('🔧 Environment Variables:');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('\n🔌 Testing Supabase Connection...');
    
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Supabase client created');

    // Test 1: Simple ping
    console.log('\n📊 Test 1: Database ping...');
    const { data: pingData, error: pingError } = await supabase
      .from('daily_usage')
      .select('count(*)')
      .limit(1);

    if (pingError) {
      console.error('❌ Database ping failed:', pingError.message);
      return false;
    }

    console.log('✅ Database ping successful');

    // Test 2: Anonymous user scenario
    console.log('\n👤 Test 2: Anonymous user daily usage...');
    const testUserId = 'anon_test_123';
    const today = new Date().toISOString().slice(0, 10);
    
    const { data: usageData, error: usageError } = await supabase
      .from('daily_usage')
      .select('ai_calls_count')
      .eq('user_id', testUserId)
      .eq('usage_date', today)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('❌ Daily usage query failed:', usageError.message);
      return false;
    }

    console.log('✅ Daily usage query successful');
    console.log(`📈 Usage data:`, usageData || 'No usage record (normal for new user)');

    // Test 3: RPC function test
    console.log('\n🔧 Test 3: RPC function test...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_daily_usage', {
        p_user_id: testUserId,
        p_date: today
      });

    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError.message);
      return false;
    }

    console.log('✅ RPC function successful');
    console.log(`📊 RPC result:`, rpcData);

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Ana test fonksiyonu
async function runTest() {
  const success = await testConnection();
  
  if (success) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Supabase connection is working');
    console.log('✅ Anonymous user scenarios supported');
    console.log('✅ RPC functions accessible');
  } else {
    console.log('\n❌ TESTS FAILED!');
    console.log('🔧 Check your Supabase configuration');
  }
}

runTest().catch(console.error);
