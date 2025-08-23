import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ================================================================
// AI PROXY ENDPOINT
// ================================================================
// This endpoint handles all AI requests from the frontend
// It proxies requests to Google Gemini AI with proper error handling

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (MVP): allow site origins only
  const origin = req.headers.origin || '';
  const allowed = ['https://resumetune.io', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  // Check for required environment variables
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return res.status(501).json({ 
      error: { 
        code: 'CONFIGURATION_ERROR', 
        message: 'AI service not configured' 
      } 
    });
  }

  try {
    // Parse request body
    const { history, message, model = 'gemini-1.5-flash' } = req.body;

    if (!message) {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Message is required' }
      });
    }

    // Get user ID for logging
    const userId = req.headers['x-user-id'] as string;
    console.log(`🤖 AI request from user ${userId?.substring(0, 8)}... with model ${model}`);

    // Check credits/quota before processing
    const isAnonymous = userId?.startsWith('anon_');
    
    if (isAnonymous) {
      // For anonymous users: check daily quota limit
      try {
        const { getSupabaseClient } = await import('../stripe/supabase-integration.js');
        const supabase = getSupabaseClient();
        
        const today = new Date().toISOString().slice(0, 10);
        const { data: usage } = await supabase
          .from('daily_usage')
          .select('ai_calls_count')
          .eq('user_id', userId)
          .eq('usage_date', today)
          .single();
          
        const currentUsage = usage?.ai_calls_count || 0;
        if (currentUsage >= 3) {
          return res.status(429).json({ 
            error: { code: 'QUOTA_EXCEEDED', message: 'Daily limit of 3 AI calls reached' }
          });
        }
      } catch (error) {
        console.warn('⚠️ Quota check failed for anonymous user, proceeding...');
      }
    } else {
      // For authenticated users: consume credit
      try {
        const { getSupabaseClient } = await import('../stripe/supabase-integration.js');
        const supabase = getSupabaseClient();
        
        // Check current credits
        const { data: user } = await supabase
          .from('users')
          .select('credits_balance')
          .eq('id', userId)
          .single();
          
        const currentCredits = user?.credits_balance || 0;
        if (currentCredits <= 0) {
          return res.status(402).json({ 
            error: { 
              code: 'INSUFFICIENT_CREDITS', 
              message: 'No credits remaining' 
            }
          });
        }
        
        // Consume credit
        const { error: updateError } = await supabase
          .from('users')
          .update({
            credits_balance: Math.max(0, currentCredits - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('❌ Credit consumption failed:', updateError);
          return res.status(500).json({
            error: { code: 'CREDIT_ERROR', message: 'Failed to process credits' }
          });
        }
        
        console.log(`💳 Credit consumed: ${currentCredits} → ${currentCredits - 1} for user ${userId?.substring(0, 8)}...`);
      } catch (error) {
        console.error('❌ Credit consumption failed:', error);
        return res.status(500).json({
          error: { code: 'CREDIT_ERROR', message: 'Failed to process credits' }
        });
      }
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
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from AI model');
    }

    console.log(`✅ AI response generated successfully (${text.length} chars)`);

    // Increment usage for anonymous users (after successful AI call)
    if (isAnonymous) {
      try {
        const { getSupabaseClient } = await import('../stripe/supabase-integration.js');
        const supabase = getSupabaseClient();
        const today = new Date().toISOString().slice(0, 10);
        
        await supabase.rpc('increment_daily_usage', {
          p_user_id: userId,
          p_usage_date: today
        });
        
        console.log(`📊 Usage incremented for anonymous user ${userId?.substring(0, 8)}...`);
      } catch (error) {
        console.warn('⚠️ Failed to increment usage for anonymous user:', error);
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
    console.error('❌ AI Proxy error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return res.status(401).json({
          error: { code: 'INVALID_API_KEY', message: 'Invalid API key' }
        });
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return res.status(429).json({
          error: { code: 'QUOTA_EXCEEDED', message: 'AI service quota exceeded' }
        });
      }
    }
    
    return res.status(500).json({
      error: { 
        code: 'AI_ERROR', 
        message: 'AI service temporarily unavailable' 
      }
    });
  }
}
