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
