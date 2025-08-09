import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateInvoiceHTML, generateInvoicePDF, sendInvoiceEmail } from '../../src/utils/invoice';
import { InvoiceData } from '../../src/utils/invoice/types';

// Redis client import
async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  
  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

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
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: { code: 'WEBHOOK_NOT_CONFIGURED', message: 'Stripe webhook not configured' } });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' } });
  }

  try {
    // Get raw body for signature verification
    let rawBody = Buffer.alloc(0);
    for await (const chunk of req) {
      rawBody = Buffer.concat([rawBody, chunk]);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Verify webhook signature
    const signature = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
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
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  const redis = await getRedis();
  if (!redis) {
    console.error('Redis not available for webhook processing');
    return;
  }

  try {
    if (session.mode === 'payment') {
      // Handle one-time payment for credits
      const lineItems = session.line_items?.data || [];
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
          const key = `credits:${userId}`;
          await redis.incrby(key, creditsToAdd);
          console.log(`Added ${creditsToAdd} credits to user ${userId}`);
          
          // Generate and send invoice for credit purchase
          const invoiceData: InvoiceData = {
            userId,
            customerEmail: session.customer_email || session.customer_details?.email || 'unknown@example.com',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            productName: `${creditsToAdd} Credits`,
            creditsDelivered: creditsToAdd,
            paymentDate: new Date(),
            invoiceType: 'purchase',
            stripeInvoiceId: session.id
          };
          
          await generateAndSendInvoice(invoiceData);
        }
      }
    } else if (session.mode === 'subscription') {
      // Handle subscription
      const lineItems = session.line_items?.data || [];
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
          const key = `sub:${userId}`;
          await redis.set(key, subscriptionPlan);
          console.log(`Set subscription ${subscriptionPlan} for user ${userId}`);
          
          // TODO: Add monthly credit allocation for subscriptions
          // Both sub_100 and sub_300 should get 300 credits per month
          // This will be handled by a monthly cron job or subscription renewal webhook
          
          // Generate and send invoice for subscription purchase
          const planName = subscriptionPlan === 'sub_100' ? 'Pro Monthly' : 'Pro Yearly';
          const invoiceData: InvoiceData = {
            userId,
            customerEmail: session.customer_email || session.customer_details?.email || 'unknown@example.com',
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            productName: planName,
            creditsDelivered: 300, // Both plans get 300 credits per month
            paymentDate: new Date(),
            invoiceType: 'purchase',
            stripeInvoiceId: session.id
          };
          
          await generateAndSendInvoice(invoiceData);
        }
      }
    }
  } catch (error) {
    console.error('Error updating Redis in webhook:', error);
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

  const redis = await getRedis();
  if (!redis) {
    console.error('Redis not available for invoice processing');
    return;
  }

  try {
    // Add 300 credits for subscription renewal
    const creditsToAdd = 300;
    const key = `credits:${userId}`;
    const newBalance = await redis.incrby(key, creditsToAdd);
    console.log(`Added ${creditsToAdd} subscription credits to user ${userId}. New balance: ${newBalance}`);
    
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
  } catch (error) {
    console.error('Error adding subscription credits in webhook:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const redis = await getRedis();
  if (!redis) {
    console.error('Redis not available for webhook processing');
    return;
  }

  try {
    const key = `sub:${userId}`;
    await redis.del(key);
    console.log(`Removed subscription for user ${userId}`);
  } catch (error) {
    console.error('Error removing subscription in webhook:', error);
  }
}



