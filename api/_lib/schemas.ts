// ================================================================
// ZOD VALIDATION SCHEMAS FOR API ENDPOINTS
// ================================================================
// This module contains Zod schemas for validating API request bodies
// Ensures type safety and prevents injection attacks

import { z } from 'zod';
import { LIMITS, VALID_AI_MODELS, VALID_PLAN_IDS } from '../../src/config/constants';

// ================================================================
// CONSUME CREDIT SCHEMA
// ================================================================
// Used by: /api/consume-credit.ts
// Note: This endpoint doesn't require body parameters (userId comes from JWT)
// But we validate that no unexpected fields are sent

export const consumeCreditSchema = z.object({
  // No required fields - userId comes from authenticated session
  // Accept empty object or undefined body
}).strict(); // Reject any extra fields

// ================================================================
// STRIPE CHECKOUT SCHEMA
// ================================================================
// Used by: /api/stripe-checkout.ts
// Validates plan selection for Stripe checkout

export const stripeCheckoutSchema = z.object({
  plan: z.enum(VALID_PLAN_IDS as any, {
    errorMap: () => ({
      message: `Plan must be one of: ${VALID_PLAN_IDS.join(', ')}`
    })
  })
}).strict();

// Type export for TypeScript
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;

// ================================================================
// AI PROXY SCHEMA
// ================================================================
// Used by: /api/ai/proxy.ts
// Validates AI chat requests

// Chat message schema
const chatMessageSchema = z.object({
  role: z.enum(['user', 'model'], {
    errorMap: () => ({ message: 'Role must be either "user" or "model"' })
  }),
  parts: z.array(
    z.object({
      text: z.string().min(1, 'Message text cannot be empty')
    })
  ).min(1, 'Parts array must contain at least one item')
});

export const aiProxySchema = z.object({
  message: z.string()
    .min(LIMITS.AI_MESSAGE_MIN_LENGTH, 'Message is required and cannot be empty')
    .max(LIMITS.AI_MESSAGE_MAX_LENGTH, `Message cannot exceed ${LIMITS.AI_MESSAGE_MAX_LENGTH} characters`),

  history: z.array(chatMessageSchema)
    .optional()
    .default([]),

  model: z.enum(VALID_AI_MODELS as any, {
    errorMap: () => ({
      message: `Model must be one of: ${VALID_AI_MODELS.join(', ')}`
    })
  }).optional().default(VALID_AI_MODELS[0])
}).strict();

// Type export for TypeScript
export type AiProxyInput = z.infer<typeof aiProxySchema>;

// ================================================================
// QUOTA SCHEMA (for future use)
// ================================================================
// Can be used by /api/quota.ts if it needs validation

export const quotaSchema = z.object({
  // No body parameters needed - GET request
}).strict();

// ================================================================
// INCREMENT USAGE SCHEMA (for future use)
// ================================================================
// Can be used by /api/increment-usage.ts

export const incrementUsageSchema = z.object({
  // No body parameters needed - userId comes from session
}).strict();
