// ================================================================
// CHAT ERROR FALLBACK - CHAT-SPECIFIC ERROR BOUNDARY
// ================================================================
// Friendly error UI specifically for the chat interface
// Preserves the rest of the page when chat fails

import React from 'react';
import { MessageCircleOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatErrorFallbackProps {
  onRetry?: () => void;
}

export const ChatErrorFallback: React.FC<ChatErrorFallbackProps> = ({ onRetry }) => {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload the page
      window.location.reload();
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-purple-100 rounded-full p-4">
          <MessageCircleOff className="w-8 h-8 text-purple-600" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            {t('errors.chatFailed') || 'Chat Temporarily Unavailable'}
          </h3>
          <p className="text-sm text-purple-800 max-w-md mx-auto">
            {t('errors.chatFailedDescription') ||
              'The AI chat feature encountered an issue. Your analysis results are still visible above. Try refreshing to restore chat functionality.'}
          </p>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[48px] shadow-md hover:shadow-lg"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{t('errors.retry') || 'Retry Chat'}</span>
        </button>

        <p className="text-xs text-purple-600">
          💡 Tip: You can still use other features while chat is down
        </p>
      </div>
    </div>
  );
};

// Convenience wrapper for render prop pattern
export const createChatErrorFallback = () => {
  return ({ onRetry }: { onRetry: () => void }) => (
    <ChatErrorFallback onRetry={onRetry} />
  );
};
