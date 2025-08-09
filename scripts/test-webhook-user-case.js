/**
 * Specific Test Case: User "88fa0c51-1467-4fcb-8474-9d945eb7892e"
 * This script tests the exact scenario that's causing the 500 error
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Exact event data based on your problem description
const specificUserEvent = {
  id: 'evt_test_webhook_user_case',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_session_user_case',
      object: 'checkout.session',
      amount_subtotal: 1000, // $10.00 for 50 credits
      amount_total: 1000,
      currency: 'usd',
      customer: null, // As mentioned in your issue
      customer_email: null, // Email is in customer_details
      customer_details: {
        email: 'umrsgnc@gmail.com'
      },
      mode: 'payment',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        userId: '88fa0c51-1467-4fcb-8474-9d945eb7892e',
        userEmail: 'umrsgnc@gmail.com',
        plan: 'credits_50'
      },
      line_items: null // Stripe doesn't include this in webhooks
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_user_case',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

/**
 * Generate Stripe webhook signature
 */
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Test the specific user case
 */
async function testSpecificUserCase() {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  
  console.log('🧪 Testing SPECIFIC USER CASE webhook...');
  console.log('User ID:', specificUserEvent.data.object.metadata.userId);
  console.log('Email:', specificUserEvent.data.object.metadata.userEmail);
  console.log('Plan:', specificUserEvent.data.object.metadata.plan);
  console.log('Customer Email:', specificUserEvent.data.object.customer_details?.email);
  console.log('Payment Status:', specificUserEvent.data.object.payment_status);
  
  const signature = generateStripeSignature(specificUserEvent, webhookSecret);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: JSON.stringify(specificUserEvent)
    });
    
    console.log('\n📊 Response Status:', response.status);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.status === 500) {
      console.log('\n❌ 500 ERROR REPRODUCED!');
      console.log('This confirms the webhook issue exists.');
      console.log('\n🔍 Likely causes:');
      console.log('1. Foreign key constraint violation (user_id references wrong table)');
      console.log('2. User validation failure');
      console.log('3. Environment variables missing');
      console.log('4. Supabase connection issue');
    } else if (response.ok) {
      console.log('\n✅ Webhook test successful!');
      console.log('The fix appears to be working.');
    } else {
      console.log('\n⚠️  Unexpected status code:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Network error testing webhook:', error.message);
  }
}

/**
 * Test Supabase connection with the specific user
 */
async function testSupabaseUser() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Skipping Supabase test - environment variables not set');
    return;
  }
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const userId = '88fa0c51-1467-4fcb-8474-9d945eb7892e';
  const email = 'umrsgnc@gmail.com';
  
  console.log('\n🔍 Testing Supabase user validation...');
  
  try {
    // Test if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('❌ User query failed:', userError.message);
      return;
    }
    
    if (!user) {
      console.error('❌ User not found in database:', userId);
      return;
    }
    
    console.log('✅ User found in database');
    console.log('DB User ID:', user.id);
    console.log('DB Email:', user.email);
    
    // Test email match
    if (user.email !== email) {
      console.error(`❌ Email mismatch: DB=${user.email}, Expected=${email}`);
    } else {
      console.log('✅ Email matches');
    }
    
    // Test credit_transactions table structure
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'credit_transactions');
      
    if (tableError || !tables?.length) {
      console.error('❌ credit_transactions table not found');
    } else {
      console.log('✅ credit_transactions table exists');
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 SPECIFIC USER CASE DEBUGGER');
  console.log('Testing webhook for user: 88fa0c51-1467-4fcb-8474-9d945eb7892e\n');
  
  // Test Supabase connection first
  await testSupabaseUser();
  
  // Then test the webhook
  await testSpecificUserCase();
  
  console.log('\n📝 Next Steps:');
  console.log('1. Run the database migration: credit_transactions_fix_migration.sql');
  console.log('2. Ensure environment variables are set in production');
  console.log('3. Deploy the updated webhook code');
  console.log('4. Monitor webhook logs for detailed error information');
}

main().catch(console.error);
