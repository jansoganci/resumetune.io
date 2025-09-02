export type AiHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

// Get user ID from Supabase session or generate anonymous ID
async function getUserId(): Promise<string> {
  try {
    // Import supabase client dynamically to avoid circular dependency issues
    const { supabase } = await import('../../config/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    console.warn('Failed to get user from Supabase session:', error);
  }
  
  // Fallback to anonymous ID stored in localStorage
  let anonId = localStorage.getItem('anon-id');
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('anon-id', anonId);
  }
  return anonId;
}

export async function sendAiMessage(
  history: AiHistoryItem[],
  message: string,
  model = 'gemini-1.5-flash'
): Promise<string> {
  // Keep payload manageable: limit history depth and cap char length conservatively
  const MAX_CHARS = 16000;
  const safeHistory = (history || []).slice(-8).map(h => ({
    role: h.role,
    parts: [{ text: (h.parts?.[0]?.text || '').slice(0, MAX_CHARS) }]
  }));
  const safeMessage = (message || '').slice(0, MAX_CHARS);

  // Get user ID for quota tracking
  const userId = await getUserId();

  // 🚨 DEBUG - Log request data (dev only)
  if (import.meta.env.DEV) {
    console.log('🔍 AI Proxy Request Debug:', {
      history: safeHistory,
      message: safeMessage,
      model,
      historyType: Array.isArray(safeHistory),
      messageType: typeof safeMessage,
      messageEmpty: !safeMessage
    });
  }

  const response = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify({ history: safeHistory, message: safeMessage, model })
  });

  // Handle CAPTCHA requirement
  if (response.status === 429 && response.headers.get('X-Captcha-Required') === 'true') {
    throw new Error('CAPTCHA_REQUIRED');
  }

  if (!response.ok) {
    try {
      const data = await response.json();
      const msg = (data?.error?.message || data?.error || data?.message || 'AI request failed');
      throw new Error(msg);
    } catch (_) {
      throw new Error('AI request failed');
    }
  }

  const data = await response.json();
  return data.text as string;
}

// Enhanced AI message function with CAPTCHA support
export async function sendAiMessageWithCaptcha(
  history: AiHistoryItem[],
  message: string,
  model = 'gemini-1.5-flash',
  captchaToken?: string
): Promise<string> {
  // Keep payload manageable: limit history depth and cap char length conservatively
  const MAX_CHARS = 16000;
  const safeHistory = (history || []).slice(-8).map(h => ({
    role: h.role,
    parts: [{ text: (h.parts?.[0]?.text || '').slice(0, MAX_CHARS) }]
  }));
  const safeMessage = (message || '').slice(0, MAX_CHARS);

  // Get user ID for quota tracking
  const userId = await getUserId();

  // Prepare headers
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'x-user-id': userId
  };

  // Add CAPTCHA token if provided
  if (captchaToken) {
    headers['X-Captcha-Token'] = captchaToken;
  }

  const response = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers,
    body: JSON.stringify({ history: safeHistory, message: safeMessage, model })
  });

  // Handle CAPTCHA requirement
  if (response.status === 429 && response.headers.get('X-Captcha-Required') === 'true') {
    throw new Error('CAPTCHA_REQUIRED');
  }

  if (!response.ok) {
    try {
      const data = await response.json();
      const msg = (data?.error?.message || data?.error || data?.message || 'AI request failed');
      throw new Error(msg);
    } catch (_) {
      throw new Error('AI request failed');
    }
  }

  const data = await response.json();
  return data.text as string;
}
