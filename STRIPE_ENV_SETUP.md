# Stripe Environment Variables Setup

To complete the Stripe integration, add these environment variables:

## Required Environment Variables

```bash
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe test secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook signing secret

# Supabase Configuration (already set)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Redis Configuration (already set)  
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

## Stripe Price IDs to Update

Update these placeholder price IDs in the code with real Stripe Price IDs:

### In `api/stripe/create-checkout-session.ts`:
- `price_CREDITS_50` → Replace with real Stripe Price ID for 50 credits ($5)
- `price_CREDITS_200` → Replace with real Stripe Price ID for 200 credits ($15)  
- `price_SUB_100` → Replace with real Stripe Price ID for subscription ($12/month, 100 runs)
- `price_SUB_300` → Replace with real Stripe Price ID for subscription ($19/month, 300 runs)

### In `api/stripe/webhook.ts`:
Update the same price IDs in the webhook handler.

### In `public/pricing.html`:
Update Supabase URL and anon key in the JavaScript section:
```javascript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

## Webhook Setup

1. Create a webhook endpoint in Stripe Dashboard pointing to: `https://your-domain.com/api/stripe/webhook`
2. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Testing

The implementation is ready for test mode. Use Stripe test cards like `4242424242424242` for testing payments.
