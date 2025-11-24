import { getAuthHeaders, getCurrentUserId } from '../../utils/apiClient';

export type AiHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

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

  // Get user ID for tracking (logged but not used for auth)
  const userId = await getCurrentUserId();

  // 🚨 DEBUG - Log request data (dev only)
  if (import.meta.env.DEV) {
    console.log('🔍 AI Proxy Request Debug:', {
      userId: userId.substring(0, 8) + '...',
      history: safeHistory,
      message: safeMessage,
      model,
      historyType: Array.isArray(safeHistory),
      messageType: typeof safeMessage,
      messageEmpty: !safeMessage
    });
  }

  // Get authentication headers (JWT token or anonymous ID)
  const headers = await getAuthHeaders();

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

  // Get authentication headers (JWT token or anonymous ID)
  const headers = await getAuthHeaders();

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
