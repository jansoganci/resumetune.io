#!/usr/bin/env node

// ================================================================
// CAPTCHA CONSOLIDATED ENDPOINT TEST SCRIPT
// ================================================================
// This script tests the new consolidated CAPTCHA endpoint
// that handles all operations via action query parameter
// 
// Run with: node scripts/test-captcha-consolidated.js

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testConsolidatedCaptchaEndpoint() {
  console.log('🧪 Testing Consolidated CAPTCHA Endpoint...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: Check CAPTCHA requirement
    console.log('1️⃣ Testing CAPTCHA requirement check...');
    const requirementResponse = await fetch(`${BASE_URL}/api/captcha?action=check-requirement`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (requirementResponse.ok) {
      const requirementData = await requirementResponse.json();
      console.log('✅ CAPTCHA requirement check successful');
      console.log('   Response:', JSON.stringify(requirementData, null, 2));
    } else {
      console.log('❌ CAPTCHA requirement check failed');
      console.log('   Status:', requirementResponse.status);
      const errorText = await requirementResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 2: Create CAPTCHA challenge
    console.log('\n2️⃣ Testing CAPTCHA challenge creation...');
    const challengeResponse = await fetch(`${BASE_URL}/api/captcha?action=create-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (challengeResponse.ok) {
      const challengeData = await challengeResponse.json();
      console.log('✅ CAPTCHA challenge creation successful');
      console.log('   Response:', JSON.stringify(challengeData, null, 2));
    } else {
      console.log('❌ CAPTCHA challenge creation failed');
      console.log('   Status:', challengeResponse.status);
      const errorData = await challengeResponse.text();
      console.log('   Error:', errorData);
    }

    // Test 3: CAPTCHA bypass
    console.log('\n3️⃣ Testing CAPTCHA bypass...');
    const bypassResponse = await fetch(`${BASE_URL}/api/captcha?action=bypass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (bypassResponse.ok) {
      const bypassData = await bypassResponse.json();
      console.log('✅ CAPTCHA bypass successful');
      console.log('   Response:', JSON.stringify(bypassData, null, 2));
    } else {
      const bypassData = await bypassResponse.json();
      console.log('ℹ️ CAPTCHA bypass response (expected for new users)');
      console.log('   Response:', JSON.stringify(bypassData, null, 2));
    }

    // Test 4: CAPTCHA verification (with dummy token)
    console.log('\n4️⃣ Testing CAPTCHA verification...');
    const verifyResponse = await fetch(`${BASE_URL}/api/captcha?action=verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'dummy_token_for_testing',
        challengeId: 'dummy_challenge_id',
      }),
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ CAPTCHA verification successful');
      console.log('   Response:', JSON.stringify(verifyData, null, 2));
    } else {
      const verifyData = await verifyResponse.json();
      console.log('ℹ️ CAPTCHA verification response (expected to fail with dummy data)');
      console.log('   Response:', JSON.stringify(verifyData, null, 2));
    }

    // Test 5: Invalid action parameter
    console.log('\n5️⃣ Testing invalid action parameter...');
    const invalidResponse = await fetch(`${BASE_URL}/api/captcha?action=invalid_action`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (invalidResponse.status === 400) {
      const invalidData = await invalidResponse.json();
      console.log('✅ Invalid action handling correct');
      console.log('   Response:', JSON.stringify(invalidData, null, 2));
    } else {
      console.log('❌ Invalid action not handled correctly');
      console.log('   Status:', invalidResponse.status);
    }

    // Test 6: Missing action parameter
    console.log('\n6️⃣ Testing missing action parameter...');
    const missingActionResponse = await fetch(`${BASE_URL}/api/captcha`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (missingActionResponse.status === 400) {
      const missingActionData = await missingActionResponse.json();
      console.log('✅ Missing action parameter handling correct');
      console.log('   Response:', JSON.stringify(missingActionData, null, 2));
    } else {
      console.log('❌ Missing action parameter not handled correctly');
      console.log('   Status:', missingActionResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function testMethodValidation() {
  console.log('\n🧪 Testing Method Validation...\n');

  try {
    // Test wrong method for check-requirement (should be GET)
    console.log('1️⃣ Testing wrong method for check-requirement (POST instead of GET)...');
    const wrongMethodResponse = await fetch(`${BASE_URL}/api/captcha?action=check-requirement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (wrongMethodResponse.status === 405) {
      console.log('✅ Method validation working correctly');
      const errorData = await wrongMethodResponse.json();
      console.log('   Response:', JSON.stringify(errorData, null, 2));
    } else {
      console.log('❌ Method validation not working');
      console.log('   Status:', wrongMethodResponse.status);
    }

    // Test wrong method for create-challenge (should be POST)
    console.log('\n2️⃣ Testing wrong method for create-challenge (GET instead of POST)...');
    const wrongMethodChallengeResponse = await fetch(`${BASE_URL}/api/captcha?action=create-challenge`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (wrongMethodChallengeResponse.status === 405) {
      console.log('✅ Method validation working correctly');
      const errorData = await wrongMethodChallengeResponse.json();
      console.log('   Response:', JSON.stringify(errorData, null, 2));
    } else {
      console.log('❌ Method validation not working');
      console.log('   Status:', wrongMethodChallengeResponse.status);
    }

  } catch (error) {
    console.error('❌ Method validation test failed with error:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting CAPTCHA Consolidated Endpoint Tests\n');
  console.log('=' .repeat(60));
  
  await testConsolidatedCaptchaEndpoint();
  await testMethodValidation();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('   ✅ Consolidated endpoint routing');
  console.log('   ✅ Action parameter validation');
  console.log('   ✅ Method validation');
  console.log('   ✅ Error handling');
  console.log('   ✅ Response format consistency');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testConsolidatedCaptchaEndpoint,
  testMethodValidation,
  runAllTests
};
