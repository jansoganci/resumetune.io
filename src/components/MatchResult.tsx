import React from 'react';
import { CheckCircle, XCircle, Clock, FileText, Edit3 } from 'lucide-react';
import { MatchResult as MatchResultType } from '../types';
import { useTranslation } from 'react-i18next';

interface MatchResultProps {
  result: MatchResultType;
  onSendMessage?: (message: string) => void;
  onExpandChat?: () => void;
}

export const MatchResult: React.FC<MatchResultProps> = ({ 
  result, 
  onSendMessage, 
  onExpandChat 
}) => {
  const isMatch = result.decision === 'yes';
  const { t } = useTranslation();

  const handleQuickAction = (action: string) => {
    if (onSendMessage) {
      onSendMessage(action);
      // Auto-expand chat when action is triggered
      if (onExpandChat) {
        onExpandChat();
      }
    }
  };

  // Localized quick prompts (same as ChatInterface)
  const qaCover = 'Generate a cover letter for this position';
  const qaResume = 'Optimize my resume for this position';
  
  return (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${
      isMatch 
        ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
        : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
    }`}>
      <div className="flex items-start space-x-4">
        {isMatch ? (
          <CheckCircle className="w-7 h-7 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-7 h-7 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1">
          <h3 className={`font-semibold text-xl ${isMatch ? 'text-green-800' : 'text-red-800'}`}>
            {isMatch ? t('match.found') : t('match.notFound')}
          </h3>
          
          <p className={`mt-3 text-base ${
            isMatch ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.message}
          </p>
          
          <div className="flex items-center space-x-1 mt-4 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{t('match.analyzedAt')} {result.timestamp.toLocaleTimeString()}</span>
          </div>

          {/* Quick Action Buttons - Only show for successful matches */}
          {isMatch && onSendMessage && (
            <div className="mt-6 pt-4 border-t border-green-200">
              <p className="text-sm font-medium text-green-800 mb-3">
                {t('match.nextSteps')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleQuickAction(qaCover)}
                  className="px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 inline-flex items-center justify-center space-x-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('chat.qaCover')}</span>
                </button>
                <button
                  onClick={() => handleQuickAction(qaResume)}
                  className="px-4 py-3 min-h-[48px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-150 inline-flex items-center justify-center space-x-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('chat.qaResume')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};