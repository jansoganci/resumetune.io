import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Plan mapping to price IDs (updated with real Stripe Price IDs)
const PLAN_PRICE_MAP = {
  credits_50: 'price_1Ru9HM05RA5Scg6HhM3OXCON',
  credits_200: 'price_1Ru9HN05RA5Scg6HopJOvdjD',
  sub_100: 'price_1Ru9HO05RA5Scg6HELd7x3hT',
  sub_300: 'price_1Ru9HQ05RA5Scg6H1hiJ0Jf0',
} as const;

type PlanType = keyof typeof PLAN_PRICE_MAP;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (MVP): allow site origins only
  const origin = req.headers.origin || '';
  const allowed = ['https://resumetune.io', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' } });
  }

  // Require authenticated user
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    });

    // Parse and validate request body
    const { plan } = req.body;
    
    if (!plan || typeof plan !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Plan is required' } });
    }

    if (!(plan in PLAN_PRICE_MAP)) {
      return res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Invalid plan specified' } });
    }

    const planType = plan as PlanType;
    const priceId = PLAN_PRICE_MAP[planType];

    // Determine mode based on plan type
    const mode: Stripe.Checkout.SessionCreateParams.Mode = planType.startsWith('credits_') ? 'payment' : 'subscription';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || 'https://resumetune.io'}/account?status=success`,
      cancel_url: `${req.headers.origin || 'https://resumetune.io'}/pricing.html`,
      metadata: {
        userId,
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: { 
          code: 'STRIPE_ERROR', 
          message: error.message 
        } 
      });
    }
    
    return res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to create checkout session' 
      } 
    });
  }
}



