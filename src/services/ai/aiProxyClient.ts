export type AiHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export async function sendAiMessage(
  history: AiHistoryItem[],
  message: string,
  model = 'gemini-1.5-flash'
): Promise<string> {
  // Keep payload small in dev: last 8 entries and trimmed
  const safeHistory = (history || []).slice(-8).map(h => ({
    role: h.role,
    parts: [{ text: (h.parts?.[0]?.text || '').slice(0, 4000) }]
  }));
  const safeMessage = (message || '').slice(0, 4000);

  const response = await fetch('/api/ai/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: safeHistory, message: safeMessage, model })
  });

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


