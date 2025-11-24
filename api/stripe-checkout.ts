import Stripe from 'stripe';
import { VercelResponse } from '@vercel/node';
import { compose, withCORS, withAuth, withMethods, AuthenticatedRequest } from './_lib/middleware.js';

// Plan mapping to price IDs (updated with real Stripe Price IDs)
const PLAN_PRICE_MAP = {
  credits_50: 'price_1Ru9HM05RA5Scg6HhM3OXCON',
  credits_200: 'price_1Ru9HN05RA5Scg6HopJOvdjD',
  sub_100: 'price_1Ru9HO05RA5Scg6HELd7x3hT',
  sub_300: 'price_1Ru9HQ05RA5Scg6H1hiJ0Jf0',
} as const;

type PlanType = keyof typeof PLAN_PRICE_MAP;

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({
      error: {
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe not configured'
      }
    });
  }

  // Get validated user from middleware
  const userId = req.user.id;
  const userEmail = req.user.email;

  if (!userEmail) {
    return res.status(400).json({
      error: {
        code: 'MISSING_EMAIL',
        message: 'User email required for checkout'
      }
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Parse and validate request body
    const { plan } = req.body;

    if (!plan || typeof plan !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN',
          message: 'Plan is required'
        }
      });
    }

    if (!(plan in PLAN_PRICE_MAP)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN',
          message: 'Invalid plan specified'
        }
      });
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
      cancel_url: `${req.headers.origin || 'https://resumetune.io'}/pricing`,
      metadata: {
        userId,
        userEmail,
        plan: planType,
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

// Apply middleware: CORS -> Auth -> Method validation
export default compose([
  withCORS,
  withAuth,
  (handler) => withMethods(['POST'], handler)
])(handler);



