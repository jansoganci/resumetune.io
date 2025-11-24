import { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { HTTP_STATUS, ERROR_CODES } from '../../src/config/constants.js';
import { logger } from '../../src/utils/logger.js';

/**
 * Result of session validation
 */
export interface ValidateSessionResult {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  } | null;
  error: {
    code: string;
    message: string;
    status: number;
  } | null;
}

/**
 * Validates user session by checking JWT token from Authorization header or session cookie
 *
 * @param req - The Vercel request object
 * @returns Object with user data or error
 *
 * @example
 * ```typescript
 * const { user, error } = await validateSession(req);
 * if (error) {
 *   return res.status(error.status).json({ error });
 * }
 * // Use user.id safely
 * ```
 */
export async function validateSession(req: VercelRequest): Promise<ValidateSessionResult> {
  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('Missing Supabase environment variables for auth validation');
    return {
      user: null,
      error: {
        code: ERROR_CODES.CONFIGURATION_ERROR,
        message: 'Authentication service not configured',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      }
    };
  }

  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // If no token in Authorization header, check for session cookie
  // Supabase stores session in cookies with name format: sb-{project-ref}-auth-token
  if (!token) {
    const cookies = req.headers.cookie;
    if (cookies) {
      const match = cookies.match(/sb-[^-]+-auth-token=([^;]+)/);
      if (match && match[1]) {
        try {
          // Cookie value is JSON encoded, extract access_token
          const decoded = JSON.parse(decodeURIComponent(match[1]));
          token = decoded.access_token;
        } catch (error) {
          // Invalid cookie format, continue without token
          logger.warn('Failed to parse auth cookie', { error });
        }
      }
    }
  }

  // No token found - return anonymous user indicator
  if (!token) {
    return {
      user: null,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'No authentication token provided',
        status: HTTP_STATUS.UNAUTHORIZED
      }
    };
  }

  // Create Supabase client with anon key (for JWT validation)
  // NOTE: We use anon key here (not service role) because we're validating user JWTs
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Validate the JWT token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.warn('Token validation failed', { message: error.message });
      return {
        user: null,
        error: {
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid or expired authentication token',
          status: HTTP_STATUS.UNAUTHORIZED
        }
      };
    }

    if (!user) {
      return {
        user: null,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
          status: HTTP_STATUS.UNAUTHORIZED
        }
      };
    }

    // Successfully validated
    return {
      user: {
        id: user.id,
        email: user.email,
        ...user
      },
      error: null
    };

  } catch (error) {
    logger.error('Session validation error', error as Error);
    return {
      user: null,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication service error',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      }
    };
  }
}

/**
 * Validates session and allows anonymous users with generated ID
 * This is useful for endpoints that support both authenticated and anonymous access
 *
 * @param req - The Vercel request object
 * @returns Object with user ID (authenticated or anonymous) and error
 */
export async function validateSessionOrAnonymous(req: VercelRequest): Promise<{
  userId: string;
  isAnonymous: boolean;
  user: ValidateSessionResult['user'];
  error: ValidateSessionResult['error'];
}> {
  const { user, error } = await validateSession(req);

  // If authenticated, return user ID
  if (user) {
    return {
      userId: user.id,
      isAnonymous: false,
      user,
      error: null
    };
  }

  // If not authenticated, check for anonymous ID from header (for backward compatibility)
  // TODO: In the future, this should be removed and all users should authenticate
  const anonId = req.headers['x-user-id'] as string;

  if (anonId && anonId.startsWith('anon_')) {
    return {
      userId: anonId,
      isAnonymous: true,
      user: null,
      error: null
    };
  }

  // No valid authentication or anonymous ID
  return {
    userId: '',
    isAnonymous: false,
    user: null,
    error: error || {
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required',
      status: 401
    }
  };
}
