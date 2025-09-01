import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatInterface } from './ChatInterface';
import { ChatMessage } from '../types';

interface CollapsibleChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  jobDescription?: { jobTitle?: string; companyName?: string } | null;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export const CollapsibleChat: React.FC<CollapsibleChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  disabled = false,
  jobDescription = null,
  isExpanded: controlledExpanded,
  onExpandedChange
}) => {
  const { t } = useTranslation();
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use controlled expansion if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    if (onExpandedChange) {
      onExpandedChange(!isExpanded);
    } else {
      setInternalExpanded(!isExpanded);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('aiAdvisor')}</h3>
            <p className="text-sm text-gray-600">
              {messages.length > 0 
                ? `${messages.length} ${t('chat.messages')}`
                : t('chat.emptySubtitle')
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Status indicator */}
          {disabled ? (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {t('chat.completeProfile')}
            </span>
          ) : (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {t('chat.ready')}
            </span>
          )}
          
          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Chat content - Collapsible */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-gray-200">
          <ChatInterface
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            disabled={disabled}
            jobDescription={jobDescription}
          />
        </div>
      </div>
    </div>
  );
};
