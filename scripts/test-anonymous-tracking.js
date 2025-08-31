// ================================================================
// ANONYMOUS USER TRACKING TEST SCRIPT - PHASE 2.1
// ================================================================
// This script tests the anonymous user tracking and abuse detection
// Run with: node scripts/test-anonymous-tracking.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAnonymousTracking() {
  console.log('🧪 Testing Anonymous User Tracking System...\n');
  
  const testIP = '192.168.1.200';
  const testAnonymousIds = [
    'anon_1234567890_abc123',
    'anon_1234567890_def456',
    'anon_1234567890_ghi789',
    'anon_1234567890_jkl012',
    'anon_1234567890_mno345'
  ];
  
  try {
    // Test 1: Initial abuse check
    console.log('📋 Test 1: Initial abuse check');
    const { data: initialCheck, error: initialError } = await supabase
      .rpc('check_anonymous_abuse', {
        p_ip_address: testIP
      });
    
    if (initialError) {
      console.error('❌ Initial abuse check failed:', initialError);
      return;
    }
    
    console.log('✅ Initial abuse check result:', JSON.stringify(initialCheck, null, 2));
    console.log(`   Anonymous ID count: ${initialCheck.anonymous_id_count}`);
    console.log(`   Is abuse: ${initialCheck.is_abuse}`);
    console.log(`   CAPTCHA required: ${initialCheck.captcha_required}\n`);
    
    // Test 2: Track multiple anonymous IDs to test abuse detection
    console.log('📋 Test 2: Tracking anonymous IDs to test abuse detection');
    
    for (let i = 0; i < testAnonymousIds.length; i++) {
      const anonymousId = testAnonymousIds[i];
      console.log(`   Tracking anonymous ID ${i + 1}: ${anonymousId}`);
      
      const { data: trackResult, error: trackError } = await supabase
        .rpc('track_anonymous_user', {
          p_ip_address: testIP,
          p_anonymous_id: anonymousId
        });
      
      if (trackError) {
        console.error(`❌ Failed to track ${anonymousId}:`, trackError);
        continue;
      }
      
      console.log(`   ✅ Tracked: ${anonymousId}`);
      console.log(`      Anonymous ID count: ${trackResult.anonymous_id_count}`);
      console.log(`      Is abuse: ${trackResult.is_abuse}`);
      console.log(`      CAPTCHA required: ${trackResult.captcha_required}`);
      
      // Check abuse status after each tracking
      const { data: abuseCheck, error: abuseError } = await supabase
        .rpc('check_anonymous_abuse', {
          p_ip_address: testIP
        });
      
      if (!abuseError) {
        console.log(`      Current abuse status: ${abuseCheck.is_abuse ? 'ABUSE' : 'NORMAL'}`);
        if (abuseCheck.captcha_required) {
          console.log(`      🚨 CAPTCHA REQUIRED!`);
        }
      }
      console.log('');
    }
    
    // Test 3: Final abuse status check
    console.log('📋 Test 3: Final abuse status check');
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('check_anonymous_abuse', {
        p_ip_address: testIP
      });
    
    if (finalError) {
      console.error('❌ Final abuse check failed:', finalError);
      return;
    }
    
    console.log('✅ Final abuse check result:', JSON.stringify(finalCheck, null, 2));
    console.log(`   Anonymous ID count: ${finalCheck.anonymous_id_count}`);
    console.log(`   Is abuse: ${finalCheck.is_abuse}`);
    console.log(`   CAPTCHA required: ${finalCheck.captcha_required}`);
    
    // Test 4: Test with different IP
    console.log('\n📋 Test 4: Testing with different IP');
    const differentIP = '10.0.0.100';
    const { data: diffIPCheck, error: diffIPError } = await supabase
      .rpc('check_anonymous_abuse', {
        p_ip_address: differentIP
      });
    
    if (diffIPError) {
      console.error('❌ Different IP check failed:', diffIPError);
      return;
    }
    
    console.log('✅ Different IP result:', JSON.stringify(diffIPCheck, null, 2));
    
    // Test 5: Cleanup test data
    console.log('\n📋 Test 5: Cleaning up test data');
    const { error: cleanupError } = await supabase
      .from('anonymous_user_tracking')
      .delete()
      .in('ip_address_hash', [
        'ip_' + Math.abs(require('crypto').createHash('md5').update(testIP).digest('hex').substring(0, 8)),
        'ip_' + Math.abs(require('crypto').createHash('md5').update(differentIP).digest('hex').substring(0, 8))
      ]);
    
    if (cleanupError) {
      console.error('⚠️ Cleanup warning:', cleanupError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Abuse Detection Summary:');
    console.log(`   - 3+ anonymous IDs per IP in 24h = Abuse detected`);
    console.log(`   - 5+ anonymous IDs per IP in 24h = CAPTCHA required`);
    console.log(`   - Test IP created ${testAnonymousIds.length} anonymous IDs`);
    console.log(`   - Expected result: Abuse detected and CAPTCHA required`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAnonymousTracking().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
