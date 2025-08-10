#!/usr/bin/env node

/**
 * Test script to verify authenticated user AI endpoint access
 * Run this after applying the fixes to test the solution
 */

const fetch = require('node-fetch'); // You may need: npm install node-fetch

// Test configuration
const TEST_CONFIG = {
  aiProxyUrl: 'http://localhost:3001/api/ai/proxy',
  quotaUrl: 'http://localhost:3001/api/quota',
  // Replace with a real authenticated user ID from your Supabase auth.users table
  authenticatedUserId: 'YOUR_USER_UUID_HERE', 
  anonymousUserId: 'anon_test_123456',
};

async function testQuotaAPI(userId, userType) {
  console.log(`\n🧪 Testing Quota API for ${userType} user (${userId.substring(0, 8)}...)`);
  
  try {
    const response = await fetch(TEST_CONFIG.quotaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Quota API Success:', {
        credits: data.credits,
        planType: data.plan_type,
        dailyLimit: data.quota?.limit,
        todayUsage: data.quota?.today
      });
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Quota API Failed:', error);
      return false;
    }
  } catch (error) {
    console.log('💥 Quota API Error:', error.message);
    return false;
  }
}

async function testAIProxy(userId, userType) {
  console.log(`\n🤖 Testing AI Proxy for ${userType} user (${userId.substring(0, 8)}...)`);
  
  const testPayload = {
    message: "Hello, this is a test message",
    history: [],
    model: "gemini-1.5-flash"
  };

  try {
    const response = await fetch(TEST_CONFIG.aiProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Proxy Success:', {
        responseLength: data.text?.length || 0,
        hasResponse: !!data.text
      });
      return true;
    } else {
      const error = await response.text();
      console.log('❌ AI Proxy Failed:', error);
      return false;
    }
  } catch (error) {
    console.log('💥 AI Proxy Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Fix Tests...');
  
  // Test anonymous user (should work)
  const anonQuotaSuccess = await testQuotaAPI(TEST_CONFIG.anonymousUserId, 'anonymous');
  const anonAISuccess = await testAIProxy(TEST_CONFIG.anonymousUserId, 'anonymous');
  
  // Test authenticated user (should now work after fix)
  const authQuotaSuccess = await testQuotaAPI(TEST_CONFIG.authenticatedUserId, 'authenticated');
  const authAISuccess = await testAIProxy(TEST_CONFIG.authenticatedUserId, 'authenticated');
  
  // Results summary
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  console.log(`Anonymous User - Quota API: ${anonQuotaSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Anonymous User - AI Proxy: ${anonAISuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authenticated User - Quota API: ${authQuotaSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authenticated User - AI Proxy: ${authAISuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (authQuotaSuccess && authAISuccess) {
    console.log('\n🎉 SUCCESS: Authenticated users can now access AI endpoints!');
  } else {
    console.log('\n⚠️ ISSUE: Some tests failed. Check the logs above for details.');
  }
}

// Check if user ID is configured
if (TEST_CONFIG.authenticatedUserId === 'YOUR_USER_UUID_HERE') {
  console.log('❌ ERROR: Please update TEST_CONFIG.authenticatedUserId with a real user UUID');
  console.log('💡 You can find user UUIDs in Supabase Dashboard > Authentication > Users');
  process.exit(1);
}

runTests().catch(console.error);
