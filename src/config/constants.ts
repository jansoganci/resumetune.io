// ================================================================
// CENTRALIZED CONFIGURATION CONSTANTS
// ================================================================
// Single source of truth for all magic numbers and configuration values
// Makes the application easier to maintain and configure

// ================================================================
// USAGE LIMITS & QUOTAS
// ================================================================

export const LIMITS = {
  // Daily AI call limits by user type
  FREE_DAILY: 3,           // Free users: 3 AI calls per day
  ANONYMOUS_DAILY: 3,      // Anonymous users: 3 AI calls per day
  CREDITS_DAILY: 999,      // Credit holders: unlimited (999 = effectively unlimited)
  SUBSCRIPTION_DAILY: 999, // Subscription holders: unlimited

  // Message size limits
  AI_MESSAGE_MAX_LENGTH: 10000, // Maximum characters in AI message input
  AI_MESSAGE_MIN_LENGTH: 1,      // Minimum characters in AI message input

  // Resume/document limits
  RESUME_MAX_WORDS: 500,         // Target resume length for optimization
  COVER_LETTER_MIN_LENGTH: 50,  // Minimum length for generated cover letter

  // Job match limits
  MATCH_REASON_MAX_LENGTH: 200,  // Maximum characters in match recommendation reason
} as const;

// ================================================================
// AI MODEL CONFIGURATION
// ================================================================

export const AI_MODELS = {
  // Supported Gemini models
  FLASH: 'gemini-1.5-flash',     // Fast, efficient model
  PRO: 'gemini-1.5-pro',         // More capable model
  GEMINI_PRO: 'gemini-pro',      // Legacy model name

  // Default model selection
  DEFAULT: 'gemini-1.5-flash',

  // Model generation config
  MAX_OUTPUT_TOKENS: 1400,       // Maximum tokens per response
  TEMPERATURE: 0.7,              // Creativity level (0.0-1.0)
} as const;

// Valid model list for validation
export const VALID_AI_MODELS = [
  AI_MODELS.FLASH,
  AI_MODELS.PRO,
  AI_MODELS.GEMINI_PRO
] as const;

// ================================================================
// STRIPE PRICING CONFIGURATION
// ================================================================

export const STRIPE_PLANS = {
  // One-time credit purchases
  CREDITS_50: {
    id: 'credits_50',
    priceId: 'price_1Ru9HM05RA5Scg6HhM3OXCON',
    name: '50 Credits',
    price: '$9',
    credits: 50,
    type: 'payment' as const
  },
  CREDITS_200: {
    id: 'credits_200',
    priceId: 'price_1Ru9HN05RA5Scg6HopJOvdjD',
    name: '200 Credits',
    price: '$19',
    credits: 200,
    type: 'payment' as const
  },

  // Monthly subscription
  SUB_100: {
    id: 'sub_100',
    priceId: 'price_1Ru9HO05RA5Scg6HELd7x3hT',
    name: 'Pro Monthly',
    price: '$9',
    creditsPerMonth: 300,
    type: 'subscription' as const
  },

  // Yearly subscription
  SUB_300: {
    id: 'sub_300',
    priceId: 'price_1Ru9HQ05RA5Scg6H1hiJ0Jf0',
    name: 'Pro Yearly',
    price: '$89',
    creditsPerMonth: 300,
    type: 'subscription' as const
  }
} as const;

// Plan ID to price ID mapping (for backward compatibility)
export const PLAN_PRICE_MAP = {
  credits_50: STRIPE_PLANS.CREDITS_50.priceId,
  credits_200: STRIPE_PLANS.CREDITS_200.priceId,
  sub_100: STRIPE_PLANS.SUB_100.priceId,
  sub_300: STRIPE_PLANS.SUB_300.priceId,
} as const;

// Valid plan IDs list
export const VALID_PLAN_IDS = [
  'credits_50',
  'credits_200',
  'sub_100',
  'sub_300'
] as const;

// ================================================================
// RATE LIMITING & SECURITY
// ================================================================

export const RATE_LIMITS = {
  // IP-based rate limits
  IP_HOURLY_LIMIT: 100,         // Max requests per hour per IP
  IP_DAILY_LIMIT: 1000,         // Max requests per day per IP

  // User-based rate limits
  USER_HOURLY_LIMIT: 50,        // Max requests per hour per user
  USER_DAILY_LIMIT: 500,        // Max requests per day per user

  // Retry configuration
  MAX_RETRIES: 4,               // Maximum retry attempts for network failures
  RETRY_DELAYS: [2000, 4000, 8000, 16000] as const, // Exponential backoff (ms)
} as const;

export const SECURITY = {
  // Session & token configuration
  JWT_EXPIRY: '7d',             // JWT token expiration
  SESSION_TIMEOUT: 3600000,     // Session timeout (1 hour in ms)

  // CAPTCHA configuration
  CAPTCHA_CHALLENGE_EXPIRY: 600000, // CAPTCHA valid for 10 minutes (ms)
  CAPTCHA_ABUSE_THRESHOLD: 0.7,     // Abuse score threshold (0.0-1.0)

  // Anonymous ID format
  ANON_ID_PREFIX: 'anon_',      // Prefix for anonymous user IDs
} as const;

// ================================================================
// CORS CONFIGURATION
// ================================================================

export const CORS = {
  ALLOWED_ORIGINS: [
    'https://resumetune.io',
    'https://www.resumetune.io',
    'http://localhost:5173',     // Vite dev server
    'http://localhost:3000',     // Alternative dev port
  ],

  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'x-user-id'],

  MAX_AGE: 86400, // Preflight cache duration (24 hours in seconds)
} as const;

// ================================================================
// ERROR CODES & MESSAGES
// ================================================================

export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_PLAN: 'INVALID_PLAN',
  INVALID_API_KEY: 'INVALID_API_KEY',

  // Quota & limit errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Service errors
  AI_ERROR: 'AI_ERROR',
  AI_FAILED: 'AI_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

  // Resource errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
} as const;

// ================================================================
// HTTP STATUS CODES
// ================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ================================================================
// FEATURE FLAGS (for gradual rollout)
// ================================================================

export const FEATURES = {
  ENABLE_CAPTCHA: true,          // Enable CAPTCHA for anonymous users
  ENABLE_ANALYTICS: true,        // Enable analytics tracking
  ENABLE_RATE_LIMITING: true,   // Enable rate limiting
  ENABLE_CREDIT_SYSTEM: true,   // Enable credit consumption

  // Experimental features
  ENABLE_CHAT_HISTORY: true,    // Save chat history
  ENABLE_PROFILE_CONTEXT: true, // Use user profile in AI prompts
} as const;

// ================================================================
// ENVIRONMENT DETECTION
// ================================================================

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// ================================================================
// URLS & EXTERNAL SERVICES
// ================================================================

export const EXTERNAL_URLS = {
  // Third-party services
  HCAPTCHA_SCRIPT: 'https://js.hcaptcha.com/1/api.js',
} as const;

export const LEGAL_URLS = {
  TERMS_OF_SERVICE: '/legal/terms-of-service.html',
  PRIVACY_POLICY: '/legal/privacy-policy.html',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  LANDING: '/landing',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  ACCOUNT: '/account',
  PRICING: '/pricing',
  BLOG: '/blog',
  GUIDES: '/content/index.html',
} as const;

export const CONTACT = {
  SUPPORT_EMAIL: 'support@careerboost.ai',
} as const;

export const VALIDATION_PATTERNS = {
  // Domain and URL validation patterns
  LINKEDIN_DOMAIN: 'linkedin.com',
  URL_PREFIX_HTTP: 'http',
  URL_PREFIX_HTTPS: 'https',
} as const;

export const SOCIAL_SHARE_URLS = {
  TWITTER: (url: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
  FACEBOOK: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  LINKEDIN: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
} as const;

// ================================================================
// TYPE EXPORTS
// ================================================================

export type PlanId = keyof typeof PLAN_PRICE_MAP;
export type AIModel = typeof VALID_AI_MODELS[number];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
