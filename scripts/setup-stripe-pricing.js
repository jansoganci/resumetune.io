#!/usr/bin/env node

/**
 * Stripe Product and Price Setup Script
 * Creates all products and prices for CareerBoost AI pricing
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.error('Make sure your .env.local file contains STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

// Product and price definitions
const PRODUCTS_TO_CREATE = [
  {
    name: 'CareerBoost AI - 50 Credits',
    description: 'Perfect for trying out our AI tools',
    metadata: {
      type: 'credit',
      credits: '50',
      plan_id: 'credits_50'
    },
    price: {
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      metadata: {
        credits: '50',
        plan_id: 'credits_50'
      }
    }
  },
  {
    name: 'CareerBoost AI - 200 Credits',
    description: 'Best value for active job seekers',
    metadata: {
      type: 'credit',
      credits: '200',
      plan_id: 'credits_200'
    },
    price: {
      unit_amount: 1900, // $19.00 in cents
      currency: 'usd',
      metadata: {
        credits: '200',
        plan_id: 'credits_200'
      }
    }
  },
  {
    name: 'CareerBoost AI - Pro Monthly',
    description: '300 credits monthly for consistent users',
    metadata: {
      type: 'subscription',
      credits: '300',
      plan_id: 'sub_100'
    },
    price: {
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        credits: '300',
        plan_id: 'sub_100'
      }
    }
  },
  {
    name: 'CareerBoost AI - Pro Yearly',
    description: 'Best value for career professionals - 300 credits monthly',
    metadata: {
      type: 'subscription',
      credits: '300',
      plan_id: 'sub_300'
    },
    price: {
      unit_amount: 8900, // $89.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'year'
      },
      metadata: {
        credits: '300',
        plan_id: 'sub_300'
      }
    }
  }
];

async function findExistingProduct(name) {
  try {
    const products = await stripe.products.list({
      limit: 100,
    });
    
    return products.data.find(product => product.name === name);
  } catch (error) {
    console.error(`Error finding existing product "${name}":`, error.message);
    return null;
  }
}

async function findExistingPrice(productId, unitAmount, recurring) {
  try {
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100,
    });
    
    return prices.data.find(price => {
      const amountMatch = price.unit_amount === unitAmount;
      const recurringMatch = recurring 
        ? (price.recurring?.interval === recurring.interval)
        : (!price.recurring);
      
      return amountMatch && recurringMatch;
    });
  } catch (error) {
    console.error(`Error finding existing price for product ${productId}:`, error.message);
    return null;
  }
}

async function createOrFindProduct(productData) {
  console.log(`🔍 Checking for existing product: "${productData.name}"`);
  
  // Check if product already exists
  let product = await findExistingProduct(productData.name);
  
  if (product) {
    console.log(`✅ Found existing product: ${product.id}`);
  } else {
    console.log(`🆕 Creating new product: "${productData.name}"`);
    try {
      product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
      });
      console.log(`✅ Created product: ${product.id}`);
    } catch (error) {
      console.error(`❌ Error creating product "${productData.name}":`, error.message);
      return null;
    }
  }
  
  return product;
}

async function createOrFindPrice(product, priceData) {
  console.log(`🔍 Checking for existing price for product: ${product.id}`);
  
  // Check if price already exists
  let price = await findExistingPrice(product.id, priceData.unit_amount, priceData.recurring);
  
  if (price) {
    console.log(`✅ Found existing price: ${price.id}`);
  } else {
    console.log(`🆕 Creating new price for product: ${product.id}`);
    try {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.unit_amount,
        currency: priceData.currency,
        recurring: priceData.recurring,
        metadata: priceData.metadata,
      });
      console.log(`✅ Created price: ${price.id}`);
    } catch (error) {
      console.error(`❌ Error creating price for product ${product.id}:`, error.message);
      return null;
    }
  }
  
  return price;
}

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');
  
  const results = {
    CREDITS_50: null,
    CREDITS_200: null,
    PRO_MONTHLY: null,
    PRO_YEARLY: null,
  };
  
  for (const productData of PRODUCTS_TO_CREATE) {
    console.log(`\n📦 Processing: ${productData.name}`);
    console.log('─'.repeat(50));
    
    // Create or find product
    const product = await createOrFindProduct(productData);
    if (!product) {
      console.log(`❌ Failed to create/find product: ${productData.name}`);
      continue;
    }
    
    // Create or find price
    const price = await createOrFindPrice(product, productData.price);
    if (!price) {
      console.log(`❌ Failed to create/find price for: ${productData.name}`);
      continue;
    }
    
    // Store result based on plan_id
    const planId = productData.metadata.plan_id;
    switch (planId) {
      case 'credits_50':
        results.CREDITS_50 = price.id;
        break;
      case 'credits_200':
        results.CREDITS_200 = price.id;
        break;
      case 'sub_100':
        results.PRO_MONTHLY = price.id;
        break;
      case 'sub_300':
        results.PRO_YEARLY = price.id;
        break;
      default:
        console.log(`⚠️ Unknown plan_id: ${planId}`);
    }
    
    console.log(`✅ Completed: ${productData.name} → ${price.id}`);
  }
  
  return results;
}

async function updateCodeWithPriceIds(priceIds) {
  console.log('\n🔧 Updating code with new price IDs...');
  
  // Create the updated mapping
  const updatedMapping = `const PLAN_PRICE_MAP = {
  credits_50: '${priceIds.CREDITS_50}',
  credits_200: '${priceIds.CREDITS_200}',
  sub_100: '${priceIds.PRO_MONTHLY}',
  sub_300: '${priceIds.PRO_YEARLY}',
} as const;`;
  
  console.log('\n📋 Updated PLAN_PRICE_MAP for api/stripe/create-checkout-session.ts:');
  console.log('─'.repeat(60));
  console.log(updatedMapping);
  console.log('─'.repeat(60));
  
  return updatedMapping;
}

// Main execution
async function main() {
  try {
    console.log('🎯 CareerBoost AI - Stripe Setup');
    console.log('═'.repeat(50));
    
    const priceIds = await setupStripeProducts();
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('═'.repeat(50));
    console.log('\n📊 Price ID Summary:');
    console.log(JSON.stringify(priceIds, null, 2));
    
    // Show code update
    await updateCodeWithPriceIds(priceIds);
    
    console.log('\n✅ Next steps:');
    console.log('1. Copy the PLAN_PRICE_MAP above');
    console.log('2. Update api/stripe/create-checkout-session.ts');
    console.log('3. Update webhook price ID mappings in api/stripe/webhook.ts');
    console.log('4. Test your payment flow!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
