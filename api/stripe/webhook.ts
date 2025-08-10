import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateInvoiceHTML, generateInvoicePDF, sendInvoiceEmail } from '../../src/utils/invoice';
import { InvoiceData } from '../../src/utils/invoice/types';
import { recordCreditTransaction, updateUserCredits, updateUserSubscription, CreditTransaction } from './supabase-integration';
import { createClient } from '@supabase/supabase-js';

// Import Supabase client function for user validation
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ================================================================
// REDIS REMOVED! 🎉
// ================================================================
// All Redis functionality has been migrated to Supabase:
// ✅ Webhook idempotency → webhook_cache table + RPC
// ✅ Credit/subscription cache → Direct Supabase queries
// ✅ Fallback logic → Removed (Supabase is single source of truth)
// ================================================================

export const config = {
  api: {
    bodyParser: false, // raw body for Stripe signature verification
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (MVP): allow site origins only
  const origin = req.headers.origin || '';
  const allowed = ['https://resumetune.io', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, stripe-signature');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  // Check for required environment variables
  const requiredEnvVars = {
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return res.status(501).json({ 
      error: { 
        code: 'CONFIGURATION_ERROR', 
        message: `Missing environment variables: ${missingVars.join(', ')}` 
      } 
    });
  }

  try {
    // Get raw body for signature verification
    let rawBody = Buffer.alloc(0);
    for await (const chunk of req) {
      rawBody = Buffer.concat([rawBody, chunk]);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Verify webhook signature
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      console.error('Missing Stripe signature header');
      return res.status(400).json({ error: { code: 'MISSING_SIGNATURE', message: 'Missing signature' } });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type} (ID: ${event.id})`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        try {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`Checkout session details:`, {
            sessionId: session.id,
            mode: session.mode,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_email,
            metadata: session.metadata
          });
          
          await handleCheckoutCompleted(session);
        } catch (error) {
          console.error(`Failed to handle checkout.session.completed for ${event.id}:`, error);
          console.error('Error stack:', error.stack);
          return res.status(500).json({ error: { code: 'CHECKOUT_PROCESSING_FAILED', message: 'Failed to process checkout' } });
        }
        break;
      case 'invoice.payment_succeeded':
        try {
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        } catch (error) {
          console.error(`Failed to handle invoice.payment_succeeded for ${event.id}:`, error);
          return res.status(500).json({ error: { code: 'INVOICE_PROCESSING_FAILED', message: 'Failed to process invoice' } });
        }
        break;
      case 'customer.subscription.deleted':
        try {
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        } catch (error) {
          console.error(`Failed to handle customer.subscription.deleted for ${event.id}:`, error);
          return res.status(500).json({ error: { code: 'SUBSCRIPTION_DELETE_FAILED', message: 'Failed to process subscription deletion' } });
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}

/**
 * Generates and sends invoice email for a successful payment
 */
async function generateAndSendInvoice(invoiceData: InvoiceData) {
  try {
    console.log('Starting invoice generation for:', invoiceData.customerEmail);
    
    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF(generateInvoiceHTML(invoiceData));
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Send email with PDF attachment
    const emailSent = await sendInvoiceEmail(
      invoiceData.customerEmail,
      pdfBuffer,
      {
        productName: invoiceData.productName,
        creditsDelivered: invoiceData.creditsDelivered,
        amount: invoiceData.amount,
        currency: invoiceData.currency
      }
    );
    
    if (emailSent) {
      console.log('Invoice email sent successfully to:', invoiceData.customerEmail);
    } else {
      console.error('Failed to send invoice email to:', invoiceData.customerEmail);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Error generating/sending invoice:', error);
    return false;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Starting checkout processing for session: ${session.id}`);
  console.log(`Session metadata:`, JSON.stringify(session.metadata, null, 2));
  
  const userId = session.metadata?.userId;
  const userEmail = session.metadata?.userEmail;
  const plan = session.metadata?.plan;
  
  if (!userId) {
    console.error('No userId in session metadata:', session.id);
    throw new Error('Missing userId in session metadata');
  }

  if (!userEmail) {
    console.error('No userEmail in session metadata:', session.id);
    throw new Error('Missing userEmail in session metadata');
  }

  // CRITICAL FIX: Validate user exists and email matches
  try {
    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      console.error(`User ${userId} not found in database:`, userError);
      throw new Error(`User not found: ${userId}`);
    }
    
    // Validate email consistency
    if (user.email !== userEmail) {
      console.error(`Email mismatch for user ${userId}: DB=${user.email}, Stripe=${userEmail}`);
      throw new Error(`Email mismatch for user ${userId}`);
    }
    
    console.log(`✅ User validation passed for ${userId} (${userEmail})`);
  } catch (validationError) {
    console.error('User validation failed:', validationError);
    throw validationError;
  }

  // ✅ SUPABASE IDEMPOTENCY - Redis'ten webhook_cache tablosuna geçiş
  const supabase = getSupabaseClient();
  const idempotencyKey = `stripe_session_${session.id}`;
  
  // Idempotency check using Supabase webhook_cache
  console.log(`🔍 Checking idempotency for session: ${session.id}`);
  
  try {
    const { data: cacheResult, error: cacheError } = await supabase
      .rpc('upsert_webhook_cache', {
        p_idempotency_key: idempotencyKey,
        p_webhook_event_id: session.id,
        p_webhook_type: 'stripe',
        p_response_status: null, // Will be set later
        p_response_data: null,
        p_expires_hours: 24
      });

    if (cacheError) {
      console.error('❌ Webhook cache error:', cacheError);
      throw new Error(`Webhook cache failed: ${cacheError.message}`);
    }

    // Check if this is a duplicate
    if (cacheResult?.is_duplicate) {
      console.log(`✅ Session ${session.id} already processed at ${cacheResult.processed_at}, skipping`);
      return;
    }

    console.log(`🚀 Processing new session ${session.id} (first time)`);

  } catch (idempotencyError) {
    console.error('❌ Idempotency check failed:', idempotencyError);
    throw new Error(`Idempotency protection failed: ${idempotencyError.message}`);
  }

  try {
    // Get Stripe client to retrieve line items
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    // CRITICAL FIX: Retrieve line items from Stripe API
    let lineItems;
    try {
      const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
      });
      lineItems = lineItemsResponse.data;
      console.log(`Retrieved ${lineItems.length} line items for session ${session.id}`);
    } catch (lineItemError) {
      console.error('Failed to retrieve line items:', lineItemError);
      throw new Error(`Failed to retrieve line items: ${lineItemError.message}`);
    }

    if (session.mode === 'payment') {
      // Handle one-time payment for credits
      console.log(`Processing payment mode for ${lineItems.length} line items`);
      for (const item of lineItems) {
        const priceId = item.price?.id;
        let creditsToAdd = 0;

        // Map price IDs to credit amounts
        switch (priceId) {
          case 'price_1Ru9HM05RA5Scg6HhM3OXCON': // credits_50
            creditsToAdd = 50;
            break;
          case 'price_1Ru9HN05RA5Scg6HopJOvdjD': // credits_200
            creditsToAdd = 200;
            break;
          default:
            console.warn(`Unknown price ID for credits: ${priceId}`);
            continue;
        }

        if (creditsToAdd > 0) {
          console.log(`Processing ${creditsToAdd} credits for price ID: ${priceId}`);
          
          // Dual storage: Update both Supabase (authoritative) and Redis (cache)
          try {
            // 1. Record transaction in Supabase for audit trail
            const transaction: CreditTransaction = {
              user_id: userId,
              user_email: userEmail,
              credits_added: creditsToAdd,
              transaction_type: 'purchase',
              stripe_session_id: session.id,
              amount_paid: session.amount_total || 0,
              currency: session.currency || 'usd',
              plan_name: `${creditsToAdd} Credits`
            };
            
            console.log(`Recording transaction:`, JSON.stringify(transaction, null, 2));
            await recordCreditTransaction(transaction);
            
            // 2. Update user's total credits in Supabase
            console.log(`Updating user ${userId} credits by ${creditsToAdd}`);
            const newBalance = await updateUserCredits(userId, creditsToAdd);
            console.log(`New balance after update: ${newBalance}`);
            
            // ✅ Cache removed - Supabase is now authoritative source
            // api/quota.ts reads directly from Supabase, no cache needed
            console.log(`✅ Credits updated in Supabase for user ${userId}, new balance: ${newBalance}`);
            
            console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
            
            // Generate and send invoice for credit purchase
            const invoiceData: InvoiceData = {
              userId,
              customerEmail: userEmail, // Use metadata email for consistency
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              productName: `${creditsToAdd} Credits`,
              creditsDelivered: creditsToAdd,
              paymentDate: new Date(),
              invoiceType: 'purchase',
              stripeInvoiceId: session.id
            };
            
            // Generate and send invoice in background (non-blocking)
            setImmediate(async () => {
              try {
                await generateAndSendInvoice(invoiceData);
                console.log(`✅ Invoice sent successfully for user ${userId}`);
              } catch (invoiceError) {
                console.error(`⚠️  Failed to send invoice (non-critical):`, invoiceError);
                // Log error but don't fail the webhook
              }
            });
          } catch (dbError) {
            console.error('❌ Database operation failed:', dbError);
            console.error('Database error details:', {
              message: dbError instanceof Error ? dbError.message : String(dbError),
              stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
            });
            
            // ✅ No Redis fallback - Supabase is single source of truth
            // If Supabase fails, webhook should fail and Stripe will retry
            throw new Error(`Database operation failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
          }
        } else {
          console.warn(`⚠️  No credits to add for price ID: ${priceId}`);
        }
      }
    } else if (session.mode === 'subscription') {
      // Handle subscription
      console.log(`Processing subscription mode for ${lineItems.length} line items`);
      for (const item of lineItems) {
        const priceId = item.price?.id;
        let subscriptionPlan: string | null = null;

        // Map price IDs to subscription plans
        switch (priceId) {
          case 'price_1Ru9HO05RA5Scg6HELd7x3hT': // sub_100 (monthly)
            subscriptionPlan = 'sub_100';
            break;
          case 'price_1Ru9HQ05RA5Scg6H1hiJ0Jf0': // sub_300 (yearly)
            subscriptionPlan = 'sub_300';
            break;
          default:
            console.warn(`Unknown price ID for subscription: ${priceId}`);
            continue;
        }

        if (subscriptionPlan) {
          try {
            // 1. Update subscription in Supabase
            await updateUserSubscription(userId, subscriptionPlan);
            
            // 2. Add initial 300 credits for subscription
            const initialCredits = 300;
            const transaction: CreditTransaction = {
              user_id: userId,
              user_email: userEmail,
              credits_added: initialCredits,
              transaction_type: 'subscription_renewal',
              stripe_session_id: session.id,
              amount_paid: session.amount_total || 0,
              currency: session.currency || 'usd',
              plan_name: subscriptionPlan === 'sub_100' ? 'Pro Monthly' : 'Pro Yearly'
            };
            await recordCreditTransaction(transaction);
            
            // 3. Update user's total credits in Supabase
            const newBalance = await updateUserCredits(userId, initialCredits);
            
            // ✅ Cache removed - Supabase is authoritative source
            console.log(`✅ Set subscription ${subscriptionPlan} and added ${initialCredits} credits for user ${userId}. New balance: ${newBalance}`);
            
            // Generate and send invoice for subscription purchase
            const planName = subscriptionPlan === 'sub_100' ? 'Pro Monthly' : 'Pro Yearly';
            const invoiceData: InvoiceData = {
              userId,
              customerEmail: userEmail, // Use metadata email for consistency
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              productName: planName,
              creditsDelivered: initialCredits,
              paymentDate: new Date(),
              invoiceType: 'purchase',
              stripeInvoiceId: session.id
            };
            
            await generateAndSendInvoice(invoiceData);
          } catch (dbError) {
            console.error('❌ Database operation failed:', dbError);
            // ✅ No Redis fallback - Supabase is single source of truth
            throw new Error(`Subscription database operation failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
          }
        }
      }
    }

    // ✅ Mark as successfully processed in Supabase webhook_cache
    try {
      await supabase
        .from('webhook_cache')
        .update({ 
          response_status: 200,
          response_data: { status: 'completed', processed_at: new Date().toISOString() }
        })
        .eq('idempotency_key', idempotencyKey);
        
      console.log(`✅ Successfully processed session ${session.id} for user ${userId}`);
    } catch (updateError) {
      console.warn('⚠️ Failed to update webhook cache status:', updateError);
      // Non-critical error, don't throw
    }
    
  } catch (error) {
    console.error('❌ Error processing webhook for session:', session.id, error);
    
    // Update webhook cache with error status
    try {
      await supabase
        .from('webhook_cache')
        .update({ 
          response_status: 500,
          response_data: { 
            status: 'error', 
            error: error instanceof Error ? error.message : String(error),
            failed_at: new Date().toISOString()
          }
        })
        .eq('idempotency_key', idempotencyKey);
    } catch (updateError) {
      console.warn('⚠️ Failed to update webhook cache error status:', updateError);
    }
    
    throw error; // Re-throw to ensure webhook returns 500 status
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only process subscription invoices, not one-time payments
  if (!(invoice as any).subscription) {
    console.log('Invoice is not for a subscription, skipping');
    return;
  }

  // Get userId from invoice metadata
  const userId = (invoice.metadata as any)?.userId;
  if (!userId) {
    console.error('No userId found in invoice metadata');
    return;
  }

  // ✅ Redis removed - Supabase handles everything

  try {
    // Add 300 credits for subscription renewal
    const creditsToAdd = 300;
    
    try {
      // 1. Record transaction in Supabase for audit trail
      const transaction: CreditTransaction = {
        user_id: userId,
        user_email: (invoice as any).customer_email || 'unknown@example.com',
        credits_added: creditsToAdd,
        transaction_type: 'subscription_renewal',
        stripe_session_id: invoice.id || `invoice_${Date.now()}`,
        amount_paid: invoice.amount_paid || 0,
        currency: invoice.currency || 'usd',
        plan_name: 'Subscription Renewal'
      };
      await recordCreditTransaction(transaction);
      
      // 2. Update user's total credits in Supabase
      const newBalance = await updateUserCredits(userId, creditsToAdd);
      
      // ✅ Cache removed - Supabase is authoritative source
      console.log(`✅ Added ${creditsToAdd} subscription credits to user ${userId}. New balance: ${newBalance}`);
      
      // Generate and send invoice for subscription renewal
      const invoiceData: InvoiceData = {
        userId,
        customerEmail: (invoice as any).customer_email || 'unknown@example.com',
        amount: invoice.amount_paid || 0,
        currency: invoice.currency || 'usd',
        productName: 'Subscription Renewal',
        creditsDelivered: creditsToAdd,
        paymentDate: new Date(invoice.created * 1000), // Convert Unix timestamp
        invoiceType: 'renewal',
        stripeInvoiceId: invoice.id
      };
      
      await generateAndSendInvoice(invoiceData);
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      // ✅ No Redis fallback - Supabase is single source of truth
      throw new Error(`Subscription renewal database operation failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
  } catch (error) {
    console.error('Error adding subscription credits in webhook:', error);
    throw error; // Re-throw to ensure proper error handling
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // ✅ Subscription deletion handled in Supabase
  try {
    const supabase = getSupabaseClient();
    await updateUserSubscription(userId, null, 'canceled');
    console.log(`✅ Cancelled subscription for user ${userId} in Supabase`);
  } catch (error) {
    console.error('❌ Error cancelling subscription in Supabase:', error);
    throw error; // Re-throw to ensure proper error handling
  }
}



