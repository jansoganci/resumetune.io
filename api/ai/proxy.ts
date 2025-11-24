import { VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { compose, withCORS, withOptionalAuth, withMethods, withValidation, UserRequest } from '../_lib/middleware.js';
import { aiProxySchema } from '../_lib/schemas.js';
import { LIMITS, AI_MODELS, ERROR_CODES, HTTP_STATUS } from '../../src/config/constants';
import { createApiLogger } from '../../src/utils/logger';

const log = createApiLogger('/api/ai/proxy');

// ================================================================
// AI PROXY ENDPOINT
// ================================================================
// This endpoint handles all AI requests from the frontend
// Proxies requests to Google Gemini AI with proper error handling
// Supports both authenticated and anonymous users

async function handler(req: UserRequest, res: VercelResponse) {
  // Check for required environment variables
  if (!process.env.GEMINI_API_KEY) {
    log.error('Missing GEMINI_API_KEY environment variable');
    return res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({
      error: {
        code: ERROR_CODES.CONFIGURATION_ERROR,
        message: 'AI service not configured'
      }
    });
  }

  try {
    // Get validated data from middleware (already validated by Zod schema)
    const { history, message, model } = (req as any).validatedBody;

    // Get validated user ID from middleware
    const userId = req.userId;
    const isAnonymous = req.isAnonymous;

    log.info('AI request received', {
      userId: userId?.substring(0, 8),
      model,
      isAnonymous
    });

    // Check credits/quota before processing
    
    if (isAnonymous) {
      // For anonymous users: check daily quota limit
      try {
        const { getSupabaseClient } = await import('../_lib/supabase.js');
        const supabase = getSupabaseClient();
        
        const today = new Date().toISOString().slice(0, 10);
        const { data: usage } = await supabase
          .from('daily_usage')
          .select('ai_calls_count')
          .eq('user_id', userId)
          .eq('usage_date', today)
          .single();
          
        const currentUsage = usage?.ai_calls_count || 0;
        if (currentUsage >= LIMITS.ANONYMOUS_DAILY) {
          log.warn('Anonymous user quota exceeded', { userId: userId?.substring(0, 8), currentUsage });
          return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            error: {
              code: ERROR_CODES.QUOTA_EXCEEDED,
              message: `Daily limit of ${LIMITS.ANONYMOUS_DAILY} AI calls reached`
            }
          });
        }
      } catch (error) {
        log.warn('Quota check failed for anonymous user, proceeding', { userId: userId?.substring(0, 8) });
      }
    } else {
      // For authenticated users: NO credit consumption here
      // Credits are consumed by frontend checkAndConsumeLimit() before calling this API
      log.debug('AI request for authenticated user (credits pre-consumed)', {
        userId: userId?.substring(0, 8)
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ model });

    // Prepare chat history for Gemini
    const chatHistory = (history || []).map((item: any) => ({
      role: item.role === 'model' ? 'model' : 'user',
      parts: [{ text: item.parts?.[0]?.text || '' }]
    }));

    // Start chat session with history
    const chat = geminiModel.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: AI_MODELS.MAX_OUTPUT_TOKENS,
        temperature: AI_MODELS.TEMPERATURE,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from AI model');
    }

    log.info('AI response generated successfully', {
      userId: userId?.substring(0, 8),
      responseLength: text.length,
      model
    });

    // Increment usage for anonymous users (after successful AI call)
    if (isAnonymous) {
      try {
        const { getSupabaseClient } = await import('../_lib/supabase.js');
        const supabase = getSupabaseClient();
        const today = new Date().toISOString().slice(0, 10);
        
        await supabase.rpc('increment_daily_usage', {
          p_user_id: userId,
          p_usage_date: today
        });
        
        log.debug('Usage incremented for anonymous user', { userId: userId?.substring(0, 8) });
      } catch (error) {
        log.warn('Failed to increment usage for anonymous user', { userId: userId?.substring(0, 8), error });
      }
    }

    return res.status(200).json({
      text,
      model,
      usage: {
        tokensUsed: text.length // Approximate token count
      }
    });

  } catch (error) {
    log.error('AI Proxy error', error as Error, {
      userId: req.userId?.substring(0, 8)
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: {
            code: ERROR_CODES.INVALID_API_KEY,
            message: 'Invalid API key'
          }
        });
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
          error: {
            code: ERROR_CODES.QUOTA_EXCEEDED,
            message: 'AI service quota exceeded'
          }
        });
      }
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ERROR_CODES.AI_ERROR,
        message: 'AI service temporarily unavailable'
      }
    });
  }
}

// Apply middleware: CORS -> OptionalAuth -> Validation -> Method validation
export default compose([
  withCORS,
  withOptionalAuth,
  withValidation(aiProxySchema),
  (handler) => withMethods(['POST'], handler)
])(handler);
