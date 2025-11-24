# ResumeTune.io - Development Guide

## 🏗️ Architecture Overview

This document describes the production-ready architecture implemented during the Phase 4 refactoring (Nov 2024).

### **Key Architectural Patterns**

1. **Centralized Configuration** (`/src/config/constants.ts`)
2. **Production Logger** (`/src/utils/logger.ts`)
3. **BaseAIService Pattern** (`/src/services/ai/core/BaseAIService.ts`)
4. **Zod Validation Schemas** (`/api/_lib/schemas.ts`)
5. **Middleware Composition** (`/api/_lib/middleware.ts`)

---

## 📦 Project Structure

```
resumetune.io/
├── api/                          # Serverless API endpoints (Vercel)
│   ├── _lib/                     # Shared API utilities
│   │   ├── auth.ts              # JWT validation
│   │   ├── middleware.ts        # CORS, Auth, Rate limiting, CAPTCHA
│   │   ├── schemas.ts           # Zod validation schemas
│   │   ├── supabase.ts          # Supabase helper functions
│   │   └── utils.ts             # Invoice generation, email
│   ├── consume-credit.ts        # Credit consumption endpoint
│   ├── quota.ts                 # User quota/credits info
│   ├── increment-usage.ts       # Daily usage tracking
│   ├── stripe-checkout.ts       # Stripe checkout session
│   └── stripe-webhook.ts        # Stripe webhook handler
│
├── src/
│   ├── config/
│   │   ├── constants.ts         # 🔥 ALL configuration (SINGLE SOURCE OF TRUTH)
│   │   └── supabase.ts          # Supabase client setup
│   │
│   ├── utils/
│   │   ├── logger.ts            # 🔥 Production-ready logger
│   │   ├── apiClient.ts         # API client with auth
│   │   ├── errors.ts            # Error handling utilities
│   │   └── textUtils.ts         # Text processing utilities
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── core/
│   │   │   │   └── BaseAIService.ts      # 🔥 Base class for all AI services
│   │   │   ├── resumeOptimizerService.ts
│   │   │   ├── coverLetterService.ts
│   │   │   ├── jobMatchService.ts
│   │   │   └── aiProxyClient.ts
│   │   ├── creditService.ts     # Credit consumption logic
│   │   └── quotaService.ts      # Quota fetching logic
│   │
│   ├── pages/                   # React pages
│   ├── components/              # React components
│   └── contexts/                # React contexts
│
└── DEVELOPMENT.md               # This file
```

---

## 🎯 Core Concepts

### 1. **Centralized Configuration** (`/src/config/constants.ts`)

**Problem Solved:** Magic numbers and hardcoded values scattered across codebase.

**Solution:** Single source of truth for ALL configuration.

#### Available Constants:

```typescript
import {
  LIMITS,           // Usage limits & quotas
  AI_MODELS,        // AI model configuration
  STRIPE_PLANS,     // Pricing configuration
  ERROR_CODES,      // Standardized error codes
  HTTP_STATUS,      // HTTP status codes
  RATE_LIMITS,      // Rate limiting config
  SECURITY,         // Security settings
  CORS,             // CORS configuration
  FEATURES          // Feature flags
} from './config/constants';
```

#### Example Usage:

```typescript
// ❌ BAD: Magic numbers
if (currentUsage >= 3) {
  return { error: 'Daily limit reached' };
}

// ✅ GOOD: Use constants
if (currentUsage >= LIMITS.FREE_DAILY) {
  return { error: `Daily limit of ${LIMITS.FREE_DAILY} reached` };
}

// ❌ BAD: Hardcoded status codes
return res.status(500).json({ error: 'Internal error' });

// ✅ GOOD: Use constants
return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
  error: {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Internal server error'
  }
});
```

#### Stripe Plans Configuration:

```typescript
import { STRIPE_PLANS } from './config/constants';

// Access plan details
const plan = STRIPE_PLANS.CREDITS_50;
console.log(plan.id);          // 'credits_50'
console.log(plan.priceId);     // 'price_1Ru9HM05RA5Scg6HhM3OXCON'
console.log(plan.credits);     // 50
console.log(plan.price);       // '$9'
```

---

### 2. **Production Logger** (`/src/utils/logger.ts`)

**Problem Solved:** Console statements everywhere, no structured logging, verbose in production.

**Solution:** Environment-aware logger with structured output.

#### Logger Features:

- **Development**: Colored console output, all log levels visible
- **Production**: JSON output, only WARN/ERROR levels (DEBUG/INFO suppressed)
- **Structured**: Context objects for searchable logs
- **Service-specific**: Child loggers with persistent context

#### Log Levels:

```typescript
logger.debug(message, context?)   // Dev only
logger.info(message, context?)    // Dev only
logger.warn(message, context?)    // Always
logger.error(message, error?, context?)  // Always
```

#### Usage Examples:

```typescript
import { logger } from '../utils/logger';
import { createApiLogger } from '../utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
logger.error('Database connection failed', error);

// API-specific logger with persistent context
const log = createApiLogger('/api/consume-credit');
log.debug('Processing request', { userId });
log.error('Credit consumption failed', error, { userId });

// Service-specific logger
import { createServiceLogger } from '../utils/logger';
const log = createServiceLogger('JobMatchService');
log.info('Analyzing job match', { jobId, userId });
```

#### Important Guidelines:

```typescript
// ❌ NEVER use console.log/error directly
console.log('User action');
console.error('Failed:', error);

// ✅ ALWAYS use logger
logger.debug('User action', { userId });
logger.error('Operation failed', error, { userId });

// ✅ Sanitize PII in logs (don't log full IDs in production)
logger.debug('Processing user', {
  userId: userId.substring(0, 8)  // Only first 8 chars
});

// ✅ Use appropriate log levels
logger.debug('Cache hit');           // Dev debugging
logger.info('User registered');      // Important events (dev only)
logger.warn('Quota approaching');    // Warnings (always)
logger.error('Payment failed', err); // Errors (always)
```

---

### 3. **BaseAIService Pattern** (`/src/services/ai/core/BaseAIService.ts`)

**Problem Solved:** Code duplication across AI services (resume, cover letter, job match).

**Solution:** Abstract base class with shared functionality.

#### Base Class Features:

- History management
- Chat initialization
- Error handling
- Credit checking/consumption
- Message sending with retry logic

#### Creating a New AI Service:

```typescript
import { BaseAIService } from './core/BaseAIService';
import { logger } from '../../utils/logger';

export class MyNewAIService extends BaseAIService {
  // 1. Define service-specific system prompt
  protected getSystemPrompt(): string {
    return `You are an AI assistant that helps with...`;
  }

  // 2. Define service name for logging
  protected getServiceName(): string {
    return 'MyNewAIService';
  }

  // 3. Define initial response message
  protected getInitialResponseMessage(userProfile?: UserProfile): string {
    return `I'm ready to help you with...`;
  }

  // 4. Implement your service-specific methods
  async analyzeData(data: string): Promise<string> {
    this.ensureInitialized();

    // Check and consume credit
    await this.checkAndConsume('analyze_data');

    try {
      // Send message to AI
      const response = await this.sendMessage(`Analyze this: ${data}`);

      // Process response
      return this.processResponse(response);

    } catch (error) {
      logger.error('Analysis failed', error as Error);
      throw new AppError(ErrorCode.AiFailed, 'AI analysis failed', {}, error);
    }
  }

  private processResponse(raw: string): string {
    // Parse JSON if needed
    const cleaned = this.sanitizeToJson(raw);
    const parsed = JSON.parse(cleaned);
    return parsed.result;
  }
}

// Usage
const service = new MyNewAIService();
await service.initialize(cvData, jobDescription, userProfile);
const result = await service.analyzeData('some data');
```

#### Available Base Methods:

```typescript
// Inherited from BaseAIService:
this.initialize(cvData, jobDescription, userProfile?)  // Setup chat
this.sendMessage(prompt)                               // Send to AI
this.sendMessageWithHistory(message)                   // Send + update history
this.checkAndConsume(action)                          // Check credits
this.sanitizeToJson(text)                             // Parse JSON responses
this.reset()                                           // Clear history
this.ensureInitialized()                              // Validation
```

---

### 4. **Zod Validation** (`/api/_lib/schemas.ts`)

**Problem Solved:** No input validation, injection vulnerabilities.

**Solution:** Type-safe validation schemas for all API inputs.

#### Available Schemas:

```typescript
import {
  consumeCreditSchema,
  stripeCheckoutSchema,
  aiProxySchema,
  quotaSchema,
  incrementUsageSchema
} from './api/_lib/schemas';
```

#### Creating a New Schema:

```typescript
// In /api/_lib/schemas.ts
import { z } from 'zod';
import { LIMITS, VALID_PLAN_IDS } from '../../src/config/constants';

export const myNewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18+').max(120),
  plan: z.enum(VALID_PLAN_IDS as any, {
    errorMap: () => ({ message: 'Invalid plan' })
  }),
  message: z.string()
    .min(LIMITS.AI_MESSAGE_MIN_LENGTH)
    .max(LIMITS.AI_MESSAGE_MAX_LENGTH)
}).strict();  // Reject extra fields

export type MyNewInput = z.infer<typeof myNewSchema>;
```

#### Using Validation in API Endpoints:

```typescript
import { withValidation } from './_lib/middleware';
import { myNewSchema } from './_lib/schemas';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // req.validatedBody is now type-safe and validated!
  const { name, email, age } = req.validatedBody as MyNewInput;

  // Safe to use without additional checks
  await processUser(name, email, age);
}

// Apply validation middleware
export default compose([
  withCORS,
  withAuth,
  withValidation(myNewSchema),  // ← Validates before handler runs
  (handler) => withMethods(['POST'], handler)
])(handler);
```

---

### 5. **Middleware Composition** (`/api/_lib/middleware.ts`)

**Problem Solved:** Repeated auth, CORS, validation logic in every endpoint.

**Solution:** Composable middleware functions.

#### Available Middleware:

```typescript
// CORS
withCORS                    // Handles CORS preflight and headers

// Authentication
withAuth                    // Requires authenticated user (JWT)
withOptionalAuth            // Allows anonymous or authenticated

// Validation
withValidation(schema)      // Validates request body with Zod

// HTTP Methods
withMethods(['POST', 'GET']) // Restricts allowed methods

// Rate Limiting
checkIPRateLimit(req, res)  // Check IP-based rate limits
```

#### Composing Middleware:

```typescript
import { compose, withCORS, withAuth, withMethods, withValidation } from './_lib/middleware';
import { mySchema } from './_lib/schemas';
import { HTTP_STATUS, ERROR_CODES } from '../src/config/constants';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Middleware guarantees:
  // ✅ CORS headers set
  // ✅ User authenticated (req.user exists)
  // ✅ Request body validated (req.validatedBody)
  // ✅ Only POST method allowed

  const userId = req.user.id;  // Safe - withAuth guarantees this exists
  const { data } = req.validatedBody;  // Safe - validated by schema

  // Your business logic here
  return res.status(HTTP_STATUS.OK).json({ success: true });
}

// Apply middleware in order (right to left execution)
export default compose([
  withCORS,                    // 1. Handle CORS first
  withAuth,                    // 2. Authenticate user
  withValidation(mySchema),    // 3. Validate input
  (handler) => withMethods(['POST'], handler)  // 4. Check method
])(handler);
```

#### Middleware Execution Order:

```
Request → CORS → Auth → Validation → Method Check → Handler → Response
```

---

## 🚀 Adding a New API Endpoint

### **Step-by-Step Guide**

#### 1. **Create Schema** (if needed)

```typescript
// In /api/_lib/schemas.ts
export const myEndpointSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
  data: z.string().min(1).max(LIMITS.MAX_INPUT_LENGTH)
}).strict();

export type MyEndpointInput = z.infer<typeof myEndpointSchema>;
```

#### 2. **Create Endpoint File**

```typescript
// /api/my-endpoint.ts
import { VercelResponse } from '@vercel/node';
import { compose, withCORS, withAuth, withMethods, withValidation, AuthenticatedRequest } from './_lib/middleware.js';
import { myEndpointSchema, MyEndpointInput } from './_lib/schemas.js';
import { HTTP_STATUS, ERROR_CODES } from '../src/config/constants.js';
import { createApiLogger } from '../src/utils/logger.js';

const log = createApiLogger('/api/my-endpoint');

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    // 1. Get validated data
    const { userId, action, data } = req.validatedBody as MyEndpointInput;
    const authenticatedUserId = req.user.id;

    // 2. Log the request
    log.debug('Processing request', {
      userId: authenticatedUserId.substring(0, 8),
      action
    });

    // 3. Validate business logic
    if (userId !== authenticatedUserId) {
      log.warn('User ID mismatch', { provided: userId, authenticated: authenticatedUserId });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Cannot perform action on behalf of another user'
        }
      });
    }

    // 4. Perform business logic
    const result = await performAction(action, data);

    // 5. Return success
    log.debug('Request completed successfully', { userId: authenticatedUserId.substring(0, 8) });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      result
    });

  } catch (error) {
    log.error('Request failed', error as Error, { userId: req.user?.id });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to process request'
      }
    });
  }
}

// Apply middleware
export default compose([
  withCORS,
  withAuth,
  withValidation(myEndpointSchema),
  (handler) => withMethods(['POST'], handler)
])(handler);

async function performAction(action: string, data: string): Promise<any> {
  // Implementation here
  return { processed: true };
}
```

#### 3. **Test the Endpoint**

```bash
# Test with curl
curl -X POST https://your-domain.com/api/my-endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId": "uuid-here", "action": "create", "data": "test"}'
```

---

## 🔐 Environment Variables

### **Required Variables**

Create a `.env` file in the root directory:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# AI (Google Gemini)
GEMINI_API_KEY=AIzaSyXXXXXXXXXX

# hCaptcha (optional)
HCAPTCHA_SECRET_KEY=0x0000000000000000
HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001

# Email (SendGrid - optional)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@resumetune.io

# Environment
NODE_ENV=development  # or 'production'
```

### **Environment Detection**

The logger automatically detects the environment:

```typescript
// In production (NODE_ENV=production):
// - Only WARN and ERROR logs
// - JSON format for log aggregation
// - No colors

// In development (NODE_ENV=development):
// - All log levels (DEBUG, INFO, WARN, ERROR)
// - Colored console output
// - Human-readable format
```

---

## 🛠️ Development Workflow

### **1. Install Dependencies**

```bash
npm install
```

### **2. Run Development Server**

```bash
# Run both frontend and API
npm run dev

# Or run separately:
npm run dev:web   # Frontend only (Vite on port 5173)
npm run dev:api   # API only (Vercel on port 3001)
```

### **3. Build for Production**

```bash
npm run build
```

### **4. Lint Code**

```bash
npm run lint
```

---

## 📋 Best Practices

### **DO's**

✅ **Always use constants** from `/src/config/constants.ts`
```typescript
if (usage >= LIMITS.FREE_DAILY) { /* ... */ }
```

✅ **Always use logger** instead of console
```typescript
logger.debug('Processing', { userId });
```

✅ **Always validate inputs** with Zod schemas
```typescript
const parsed = mySchema.parse(input);
```

✅ **Always use middleware** for common functionality
```typescript
export default compose([withCORS, withAuth, withValidation(schema)])(handler);
```

✅ **Sanitize user IDs** in logs
```typescript
logger.info('User action', { userId: userId.substring(0, 8) });
```

✅ **Use BaseAIService** for new AI services
```typescript
export class MyService extends BaseAIService { /* ... */ }
```

### **DON'Ts**

❌ **Never hardcode** magic numbers
```typescript
if (count > 3) { }  // BAD
```

❌ **Never use console** directly
```typescript
console.log('data');  // BAD
```

❌ **Never skip validation**
```typescript
const data = req.body;  // BAD - not validated
```

❌ **Never log full user IDs** or PII
```typescript
logger.info('User action', { userId: fullUserId });  // BAD
```

❌ **Never duplicate** authentication logic
```typescript
// BAD - use withAuth middleware instead
const token = req.headers.authorization;
const user = await validateToken(token);
```

---

## 🔥 Common Patterns

### **Error Handling Pattern**

```typescript
try {
  const result = await riskyOperation();
  logger.debug('Operation succeeded', { result });
  return res.status(HTTP_STATUS.OK).json({ result });
} catch (error) {
  logger.error('Operation failed', error as Error, { context });
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Operation failed'
    }
  });
}
```

### **Credit Consumption Pattern**

```typescript
import { checkAndConsumeLimit } from '../services/creditService';

// In API endpoint
const creditCheck = await checkAndConsumeLimit('my_action');
if (!creditCheck.allowed) {
  const errorMessage = getErrorMessage(creditCheck);
  return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    error: {
      code: ERROR_CODES.QUOTA_EXCEEDED,
      message: errorMessage
    }
  });
}

// In AI Service (use BaseAIService)
await this.checkAndConsume('my_action');
```

### **Stripe Plan Configuration Pattern**

```typescript
import { STRIPE_PLANS } from '../config/constants';

// Access plan details
const plan = STRIPE_PLANS.CREDITS_50;
const priceId = plan.priceId;
const credits = plan.credits;

// Validate plan ID
if (!VALID_PLAN_IDS.includes(planId)) {
  throw new Error('Invalid plan');
}
```

---

## 🧪 Testing

### **Manual Testing Checklist**

- [ ] `npm install` completes successfully
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts both frontend and API
- [ ] All API endpoints return expected responses
- [ ] Logger outputs correctly in dev (colored) and prod (JSON)
- [ ] Constants are used throughout (no magic numbers)
- [ ] Validation catches invalid inputs
- [ ] Authentication requires valid JWT
- [ ] Rate limiting works correctly
- [ ] Credit consumption works correctly

---

## 📚 Additional Resources

### **File References**

- **Constants**: `/src/config/constants.ts` (253 lines)
- **Logger**: `/src/utils/logger.ts` (331 lines)
- **BaseAIService**: `/src/services/ai/core/BaseAIService.ts` (200 lines)
- **Schemas**: `/api/_lib/schemas.ts` (93 lines)
- **Middleware**: `/api/_lib/middleware.ts` (950+ lines)

### **Commits Reference**

All Phase 4 refactoring commits:
- `fa9f288` - Created constants.ts & logger.ts
- `dfb76b5` - Backend schemas & stripe-checkout refactor
- `1dc4efa` - AI proxy refactor
- `f5c4962` - Frontend services refactor
- `89ad11d` - AI services refactor (BaseAIService pattern)
- `3681ccd` - Backend API endpoints refactor
- `285fb88` - Infrastructure files refactor

---

## 🎓 Quick Reference

### **Import Cheat Sheet**

```typescript
// Constants
import { LIMITS, AI_MODELS, STRIPE_PLANS, ERROR_CODES, HTTP_STATUS } from './config/constants';

// Logger
import { logger, createApiLogger, createServiceLogger } from './utils/logger';

// Validation
import { mySchema } from './api/_lib/schemas';

// Middleware
import { compose, withCORS, withAuth, withValidation, withMethods } from './api/_lib/middleware';

// Base AI Service
import { BaseAIService } from './services/ai/core/BaseAIService';

// Errors
import { AppError, ErrorCode } from './utils/errors';
```

---

## 🎉 Summary

This codebase now follows production-ready patterns:

1. **Single Source of Truth**: All configuration in `constants.ts`
2. **Structured Logging**: Environment-aware logger with context
3. **Type Safety**: Zod validation for all API inputs
4. **Code Reusability**: BaseAIService eliminates duplication
5. **Security**: Middleware handles auth, rate limiting, CAPTCHA
6. **Maintainability**: Clear patterns, documented architecture

**Result**: Clean, maintainable, production-ready codebase with zero console statements in production code paths.

---

**Questions?** Check the inline documentation in each file, or refer to specific pattern examples above.

**Last Updated**: November 2024 (Phase 4 Complete)
