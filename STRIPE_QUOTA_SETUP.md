# 🚀 Stripe to Quota Update - Complete Setup Guide

## **Fixed Architecture Overview**

Your Stripe checkout to quota update flow now uses a **dual storage architecture** for maximum reliability:

- **Supabase** (Authoritative storage) - Permanent credit records, audit trail
- **Redis** (Fast cache) - Quick quota checks, session data

## **Environment Variables Required**

Add these to your `.env` file:

```bash
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_live_... # or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Existing Supabase variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ... # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Service role key (for webhooks)

# Existing Redis variables
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## **Database Migration Steps**

### 1. Run the Credit Transactions Migration

Execute this in **Supabase Dashboard > SQL Editor**:

```sql
-- See credit_transactions_migration.sql file
```

### 2. Verify Tables

After migration, you should have:
- `public.users` table with `credits_balance` column
- `public.credit_transactions` table for audit trail
- Row Level Security policies
- Helper functions for credit sync

## **How The Fixed Flow Works**

### **1. Frontend → Checkout Session**
```typescript
// PricingPage.tsx now sends both userId AND email
headers: {
  'x-user-id': session.user.id,
  'x-user-email': session.user.email, // ✅ Added
}
```

### **2. Checkout Session → Stripe**
```typescript
// create-checkout-session.ts now includes all metadata
metadata: {
  userId,
  userEmail,  // ✅ Added
  plan: planType, // ✅ Added
}
```

### **3. Stripe → Webhook**
```typescript
// webhook.ts now has full validation and dual storage
async function handleCheckoutCompleted(session) {
  // ✅ Validate all required data
  // ✅ Check idempotency (prevent duplicates)
  // ✅ Update Supabase (authoritative)
  // ✅ Update Redis (cache)
  // ✅ Send invoice
  // ✅ Proper error handling
}
```

## **Key Improvements Made**

### ✅ **Fixed User Identification**
- **Before**: Only `userId` in metadata, unreliable email
- **After**: Both `userId` AND `userEmail` in metadata

### ✅ **Added Idempotency Protection**
- **Before**: Duplicate webhooks could double-credit users
- **After**: Each session ID processed only once

### ✅ **Implemented Dual Storage**
- **Before**: Redis only (volatile, can lose data)
- **After**: Supabase + Redis (persistent + fast)

### ✅ **Enhanced Error Handling**
- **Before**: Silent failures, no error propagation
- **After**: Proper errors, fallback mechanisms

### ✅ **Added Audit Trail**
- **Before**: No record of credit transactions
- **After**: Complete transaction history in database

## **Testing Your Implementation**

### 1. Test Credit Purchase
```bash
# 1. User buys 50 credits via Stripe
# 2. Check webhook logs for success
# 3. Verify in Supabase:
SELECT * FROM credit_transactions WHERE user_id = 'user-uuid';
SELECT credits_balance FROM users WHERE id = 'user-uuid';
```

### 2. Test Duplicate Prevention
```bash
# Send same webhook twice - should only process once
# Check logs for "already processed, skipping"
```

### 3. Test Data Consistency
```bash
# Run the consistency check function:
SELECT * FROM validate_credits_consistency();
# Should return no rows (empty = all consistent)
```

## **Monitoring & Maintenance**

### **Webhook Monitoring**
```typescript
// Check these logs in Vercel dashboard:
- "Successfully processed session X for user Y"
- "Session X already processed, skipping"
- "Failed to handle checkout.session.completed"
```

### **Data Consistency Check**
Run this monthly to ensure Redis and Supabase are in sync:
```sql
SELECT * FROM validate_credits_consistency();
```

### **Credit Sync (if needed)**
If Redis gets out of sync, resync from authoritative source:
```sql
SELECT sync_user_credits('user-uuid');
```

## **Common Issues & Solutions**

### **Issue**: Webhook returns 500 error
**Solution**: Check these in order:
1. Environment variables set correctly?
2. Supabase service role key has proper permissions?
3. Redis connection working?
4. Check webhook signature verification

### **Issue**: Credits not updating
**Solution**: 
1. Check webhook received the event
2. Verify `userId` and `userEmail` in session metadata
3. Check Supabase logs for database errors
4. Verify user exists in `users` table

### **Issue**: Duplicate credits awarded
**Solution**: 
- Check idempotency keys in Redis: `processed:session_id`
- If idempotency broken, credits can be fixed with sync function

## **Performance Optimization**

### **Redis TTL Settings**
- Idempotency keys: 24 hours (prevent late duplicates)
- Credit cache: No TTL (manual refresh on updates)
- Session data: 1 hour (cleanup processing markers)

### **Database Indexing**
The migration creates these indexes for performance:
- `user_id` for fast user lookups
- `stripe_session_id` for duplicate detection
- `created_at` for audit queries

## **Security Considerations**

### **Webhook Security**
- ✅ Signature verification enabled
- ✅ Environment validation
- ✅ Input sanitization
- ✅ Error handling without data leaks

### **Database Security**
- ✅ Row Level Security enabled
- ✅ Service role restricted to webhooks
- ✅ User data isolation
- ✅ Audit trail immutable

## **Next Steps**

1. **Deploy the changes** to your production environment
2. **Run the database migration** in Supabase
3. **Test with a small payment** first
4. **Monitor webhook logs** for any issues
5. **Set up alerting** for webhook failures

Your Stripe to quota update flow is now production-ready with enterprise-grade reliability! 🎉
