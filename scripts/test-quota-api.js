#!/usr/bin/env node

/**
 * TEST SCRIPT: QUOTA API - SUPABASE VERSION
 * =========================================
 * Bu script yeni Supabase-based quota API'sını test eder
 * Redis'ten geçiş sonrası doğru çalışıp çalışmadığını kontrol eder
 */

const fetch = require('node-fetch');

// Test kullanıcısı (webhook testlerinde kullandığımız)
const TEST_USER_ID = '88fa0c51-1467-4fcb-8474-9d945eb7892e';
const API_BASE = process.env.API_BASE || 'http://localhost:3000'; // Geliştirme için

async function testQuotaAPI() {
  console.log('🧪 Testing Quota API (Supabase Version)');
  console.log('=======================================');

  try {
    // 1. Test: Quota API çağrısı
    console.log('\n1. 📊 Testing quota API call...');
    
    const response = await fetch(`${API_BASE}/api/quota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`   ❌ API Error: ${errorData}`);
      return;
    }

    const data = await response.json();
    console.log('   ✅ API Response:');
    console.log('   ', JSON.stringify(data, null, 2));

    // 2. Test: Response format validation
    console.log('\n2. 🔍 Validating response format...');
    
    const expectedFields = ['quota', 'credits', 'subscription', 'plan_type'];
    const missingFields = expectedFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (!data.quota || typeof data.quota.today !== 'number' || typeof data.quota.limit !== 'number') {
      console.error('   ❌ Invalid quota format');
      return;
    }
    
    if (!['free', 'credits', 'subscription'].includes(data.plan_type)) {
      console.error(`   ❌ Invalid plan_type: ${data.plan_type}`);
      return;
    }
    
    console.log('   ✅ Response format is valid');

    // 3. Test: Plan type logic
    console.log('\n3. 🎯 Testing plan type logic...');
    
    const { credits, plan_type, quota } = data;
    
    if (plan_type === 'free' && quota.limit !== 3) {
      console.error(`   ❌ Free plan should have limit 3, got ${quota.limit}`);
      return;
    }
    
    if ((plan_type === 'credits' || plan_type === 'subscription') && quota.limit !== 999) {
      console.error(`   ❌ Paid plan should have limit 999, got ${quota.limit}`);
      return;
    }
    
    if (plan_type === 'credits' && credits <= 0) {
      console.warn(`   ⚠️ Credits plan but no credits remaining: ${credits}`);
    }
    
    console.log(`   ✅ Plan logic is correct:`);
    console.log(`      Plan Type: ${plan_type}`);
    console.log(`      Daily Limit: ${quota.limit}`);
    console.log(`      Credits: ${credits}`);
    console.log(`      Usage Today: ${quota.today}`);

    // 4. Test: Akıllı limit logic
    console.log('\n4. 🧠 Testing intelligent limit logic...');
    
    let expectedPlanType;
    if (credits > 0) {
      expectedPlanType = 'credits';
    } else if (data.subscription) {
      expectedPlanType = 'subscription'; 
    } else {
      expectedPlanType = 'free';
    }
    
    if (plan_type !== expectedPlanType) {
      console.error(`   ❌ Plan type mismatch. Expected: ${expectedPlanType}, Got: ${plan_type}`);
      return;
    }
    
    console.log(`   ✅ Intelligent limit logic is working correctly`);

    // 5. Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('===============');
    console.log('✅ Quota API is working correctly');
    console.log('✅ Supabase integration successful');
    console.log('✅ Akıllı plan detection working');
    console.log('✅ Response format compatible with frontend');
    
    console.log('\n🎉 All tests passed! Migration successful! 🎉');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing error handling...');
  
  // Test without user ID header
  try {
    const response = await fetch(`${API_BASE}/api/quota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // x-user-id header eksik
      },
    });
    
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for missing user ID');
    } else {
      console.log(`   ⚠️ Expected 401, got ${response.status}`);
    }
  } catch (error) {
    console.log(`   ⚠️ Network error: ${error.message}`);
  }
  
  // Test with invalid user ID
  try {
    const response = await fetch(`${API_BASE}/api/quota`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'invalid-user-id-12345',
      },
    });
    
    if (response.status === 404) {
      console.log('   ✅ Correctly returns 404 for invalid user ID');
    } else {
      console.log(`   ⚠️ Expected 404, got ${response.status}`);
    }
  } catch (error) {
    console.log(`   ⚠️ Network error: ${error.message}`);
  }
}

// Ana test fonksiyonu
async function runTests() {
  console.log('🎯 QUOTA API TEST SUITE');
  console.log('=======================');
  console.log(`Target: ${API_BASE}`);
  console.log(`Test User: ${TEST_USER_ID.substring(0, 8)}...`);
  
  await testQuotaAPI();
  await testErrorHandling();
  
  console.log('\n🏁 Test suite completed!');
}

// Script'i çalıştır
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testQuotaAPI, testErrorHandling };
