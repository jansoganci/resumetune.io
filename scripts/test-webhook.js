/**
 * Webhook Testing Utility
 * 
 * This script helps debug Stripe webhook issues by simulating webhook events
 * and testing the webhook endpoint locally.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Sample checkout.session.completed event for testing
const sampleCheckoutEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_session_123',
      object: 'checkout.session',
      amount_subtotal: 1000,
      amount_total: 1000,
      currency: 'usd',
      customer_email: 'test@example.com',
      mode: 'payment',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        userId: 'test-user-123',
        userEmail: 'test@example.com',
        plan: 'credits_50'
      },
      line_items: null // This is the key issue - Stripe doesn't include this in webhooks
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_123',
    idempotency_key: null
  },
  type: 'checkout.session.completed'
};

/**
 * Generate Stripe webhook signature for testing
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
 * Test webhook endpoint with sample data
 */
async function testWebhook() {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  
  console.log('🧪 Testing webhook endpoint...');
  console.log('URL:', webhookUrl);
  console.log('Event Type:', sampleCheckoutEvent.type);
  console.log('Session ID:', sampleCheckoutEvent.data.object.id);
  console.log('Metadata:', sampleCheckoutEvent.data.object.metadata);
  
  const signature = generateStripeSignature(sampleCheckoutEvent, webhookSecret);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: JSON.stringify(sampleCheckoutEvent)
    });
    
    console.log('\n📊 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
      console.log('This indicates the issue you\'re experiencing.');
    }
    
  } catch (error) {
    console.error('❌ Network error testing webhook:', error.message);
  }
}

/**
 * Validate environment setup
 */
function validateEnvironment() {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  console.log('🔍 Checking environment variables...');
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    console.log('\nMake sure to set these in your .env file:');
    missingVars.forEach(varName => {
      console.log(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

/**
 * Debug actual Stripe session (if session ID provided)
 */
async function debugStripeSession(sessionId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not set');
    return;
  }
  
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    console.log(`🔍 Fetching Stripe session: ${sessionId}`);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session details:', {
      id: session.id,
      mode: session.mode,
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      metadata: session.metadata
    });
    
    // Try to fetch line items
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100
    });
    
    console.log(`Line items (${lineItems.data.length}):`);
    lineItems.data.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description} - Price ID: ${item.price?.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching Stripe session:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Stripe Webhook Debugger\n');
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const sessionId = args.find(arg => arg.startsWith('cs_'));
  
  if (sessionId) {
    console.log(`Debug mode: Analyzing session ${sessionId}\n`);
    await debugStripeSession(sessionId);
  } else {
    console.log('Test mode: Simulating webhook event\n');
    
    if (validateEnvironment()) {
      await testWebhook();
    }
  }
  
  console.log('\n📝 Debugging Tips:');
  console.log('1. Check your server logs for detailed error messages');
  console.log('2. Ensure all environment variables are correctly set');
  console.log('3. Verify that line_items are being fetched via Stripe API');
  console.log('4. Test with a real session ID: node test-webhook.js cs_your_session_id');
}

main().catch(console.error);
