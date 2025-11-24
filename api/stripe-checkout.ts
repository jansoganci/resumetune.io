import Stripe from 'stripe';
import { VercelResponse } from '@vercel/node';
import { compose, withCORS, withAuth, withMethods, withValidation, AuthenticatedRequest } from './_lib/middleware.js';
import { stripeCheckoutSchema } from './_lib/schemas.js';
import { STRIPE_PLANS, ERROR_CODES, HTTP_STATUS } from '../src/config/constants';
import { createApiLogger } from '../src/utils/logger';

const log = createApiLogger('/api/stripe-checkout');

// Plan mapping to price IDs (using centralized constants)
const PLAN_PRICE_MAP = {
  credits_50: STRIPE_PLANS.CREDITS_50.priceId,
  credits_200: STRIPE_PLANS.CREDITS_200.priceId,
  sub_100: STRIPE_PLANS.SUB_100.priceId,
  sub_300: STRIPE_PLANS.SUB_300.priceId,
} as const;

type PlanType = keyof typeof PLAN_PRICE_MAP;

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    log.error('Stripe not configured', { error: ERROR_CODES.CONFIGURATION_ERROR });
    return res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({
      error: {
        code: ERROR_CODES.CONFIGURATION_ERROR,
        message: 'Stripe not configured'
      }
    });
  }

  // Get validated user from middleware
  const userId = req.user.id;
  const userEmail = req.user.email;

  if (!userEmail) {
    log.warn('Missing user email', { userId: userId.substring(0, 8) });
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        code: ERROR_CODES.INVALID_INPUT,
        message: 'User email required for checkout'
      }
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get validated plan from middleware (already validated by Zod schema)
    const { plan } = (req as any).validatedBody;
    const planType = plan as PlanType;
    const priceId = PLAN_PRICE_MAP[planType];

    log.info('Creating checkout session', {
      userId: userId.substring(0, 8),
      plan: planType,
      email: userEmail
    });

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

    log.info('Checkout session created', {
      userId: userId.substring(0, 8),
      sessionId: session.id,
      plan: planType
    });

    return res.status(HTTP_STATUS.OK).json({ url: session.url });
  } catch (error) {
    log.error('Stripe checkout error', error as Error, {
      userId: userId.substring(0, 8)
    });

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: ERROR_CODES.STRIPE_ERROR,
          message: error.message
        }
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create checkout session'
      }
    });
  }
}

// Apply middleware: CORS -> Auth -> Validation -> Method validation
export default compose([
  withCORS,
  withAuth,
  withValidation(stripeCheckoutSchema),
  (handler) => withMethods(['POST'], handler)
])(handler);
