// ================================================================
// IP RATE LIMITING TEST SCRIPT
// ================================================================
// This script tests the IP rate limiting database functions
// Run with: node scripts/test-ip-rate-limiting.js

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

async function testIPRateLimiting() {
  console.log('🧪 Testing IP Rate Limiting Functions...\n');
  
  const testIP = '192.168.1.100';
  
  try {
    // Test 1: Check initial rate limit status
    console.log('📋 Test 1: Initial rate limit check');
    const { data: initialCheck, error: initialError } = await supabase
      .rpc('check_ip_rate_limits_both', {
        p_ip_address: testIP
      });
    
    if (initialError) {
      console.error('❌ Initial check failed:', initialError);
      return;
    }
    
    console.log('✅ Initial check result:', JSON.stringify(initialCheck, null, 2));
    console.log(`   Allowed: ${initialCheck.allowed}`);
    console.log(`   Hourly: ${initialCheck.hourly.current_count}/${initialCheck.hourly.max_requests}`);
    console.log(`   Daily: ${initialCheck.daily.current_count}/${initialCheck.daily.max_requests}\n`);
    
    // Test 2: Make multiple requests to test rate limiting
    console.log('📋 Test 2: Testing rate limit increments');
    
    for (let i = 1; i <= 5; i++) {
      const { data: check, error } = await supabase
        .rpc('check_ip_rate_limits_both', {
          p_ip_address: testIP
        });
      
      if (error) {
        console.error(`❌ Request ${i} failed:`, error);
        continue;
      }
      
      console.log(`   Request ${i}: Allowed=${check.allowed}, Hourly=${check.hourly.current_count}/${check.hourly.max_requests}, Daily=${check.daily.current_count}/${check.daily.max_requests}`);
    }
    
    // Test 3: Check final status
    console.log('\n📋 Test 3: Final rate limit status');
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('check_ip_rate_limits_both', {
        p_ip_address: testIP
      });
    
    if (finalError) {
      console.error('❌ Final check failed:', finalError);
      return;
    }
    
    console.log('✅ Final check result:', JSON.stringify(finalCheck, null, 2));
    
    // Test 4: Test with different IP
    console.log('\n📋 Test 4: Testing with different IP');
    const differentIP = '10.0.0.50';
    const { data: diffIPCheck, error: diffIPError } = await supabase
      .rpc('check_ip_rate_limits_both', {
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
      .from('rate_limits')
      .delete()
      .in('identifier', [testIP, differentIP]);
    
    if (cleanupError) {
      console.error('⚠️ Cleanup warning:', cleanupError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testIPRateLimiting().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
