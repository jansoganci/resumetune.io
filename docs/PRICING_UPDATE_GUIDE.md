# 🚀 PRICING UPDATE IMPLEMENTATION GUIDE

## ✅ COMPLETED - Frontend Changes
- Updated PricingPage.tsx with new pricing
- 200 Credits: $29 → $19
- Pro Monthly: $19 → $9 (unlimited → 300 credits/month)
- Pro Yearly: $199 → $89 (unlimited → 300 credits/month)

## 🔄 NEXT STEPS - Stripe Configuration

### 1. Create New Price IDs in Stripe Dashboard
You need to create new price objects in your Stripe dashboard:

| Plan | Old Price | New Price | Stripe Price ID to Create |
|------|-----------|-----------|---------------------------|
| 50 Credits | $9 | $9 | Keep existing `price_CREDITS_50` |
| 200 Credits | $29 | $19 | Create new `price_CREDITS_200_NEW` |
| Pro Monthly | $19 | $9 | Create new `price_SUB_100_NEW` |
| Pro Yearly | $199 | $89 | Create new `price_SUB_300_NEW` |

### 2. Update Backend Configuration
After creating new price IDs in Stripe, update:

**File: `api/stripe/create-checkout-session.ts`**
```typescript
const PLAN_PRICE_MAP = {
  credits_50: 'price_CREDITS_50', // Keep existing
  credits_200: 'price_YOUR_NEW_200_CREDITS_ID', // Replace
  sub_100: 'price_YOUR_NEW_MONTHLY_ID', // Replace  
  sub_300: 'price_YOUR_NEW_YEARLY_ID', // Replace
} as const;
```

### 3. Monthly Credit Allocation System
For subscriptions, you'll need to implement:
- Monthly credit renewal (300 credits per month for both plans)
- Stripe subscription renewal webhook handling
- Monthly cron job or automated credit allocation

### 4. Testing Checklist
- [ ] Create test price IDs in Stripe
- [ ] Update price mapping in code
- [ ] Test 200 credits purchase ($19)
- [ ] Test monthly subscription ($9/month)
- [ ] Test yearly subscription ($89/year)
- [ ] Verify webhook credit allocation
- [ ] Test subscription cancellation

## 💡 Development Notes
- Current webhook handles subscription creation but not monthly renewals
- Monthly credit allocation needs additional webhook for `invoice.payment_succeeded`
- Consider implementing subscription credit balance tracking separate from one-time credits

## 🔧 Quick Test Commands
```bash
# Test pricing display
curl http://localhost:5173/pricing

# Test quota API
curl -H "x-user-id: test" http://localhost:3001/api/quota

# Test checkout session creation (after updating price IDs)
curl -X POST -H "Content-Type: application/json" -H "x-user-id: test" \
  -d '{"plan":"credits_200"}' http://localhost:3001/api/stripe/create-checkout-session
```
