import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Bot, Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import { exportToPDF, exportToDocx } from '../utils/documentExport';
import { inferKeyFocus, inferSeniority, SeniorityLevel } from '../utils/smartSuggestions';
import { validateDocumentContent } from '../utils/textUtils';
import { trackEvent } from '../utils/analytics';
import { logger } from '../utils/logger';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  jobDescription?: { jobTitle?: string; companyName?: string } | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  disabled = false,
  jobDescription = null
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Phase 4: inline adjust/regenerate state
  const [adjustForId, setAdjustForId] = useState<string | null>(null);
  const [adjustRole, setAdjustRole] = useState('');
  const [adjustLevel, setAdjustLevel] = useState<SeniorityLevel | ''>('');
  const [adjustFocus, setAdjustFocus] = useState('');

  const scrollToBottom = () => {
    // Only scroll within the chat container, not the entire page
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'nearest', // Prevent page-level scrolling
      inline: 'nearest'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Remove auto-focus behavior that might cause page scrolling
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading && !disabled) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      // Removed auto-focus to prevent unwanted scrolling
    }
  };

  const handleQuickAction = (action: string) => {
    if (!isLoading && !disabled) {
      onSendMessage(action);
      // Removed auto-focus to prevent unwanted scrolling
    }
  };

  // Localized quick prompts still in English intentionally to guide AI; UI labels are localized
  const qaReqs = 'What are the key requirements for this role?';
  const qaSkills = 'How well do my skills match this position?';

  const handleExportPDF = async (content: string) => {
    try {
      await exportToPDF({
        content,
        jobTitle: jobDescription?.jobTitle,
        companyName: jobDescription?.companyName
      });
      trackEvent('export_pdf', { hasJobTitle: Boolean(jobDescription?.jobTitle), hasCompany: Boolean(jobDescription?.companyName) });
    } catch (error) {
      logger.error('Failed to export PDF', error instanceof Error ? error : { error });
      toast.error('errors.exportFailed');
    }
  };

  const handleExportDocx = async (content: string) => {
    try {
      await exportToDocx({
        content,
        jobTitle: jobDescription?.jobTitle,
        companyName: jobDescription?.companyName
      });
      trackEvent('export_docx', { hasJobTitle: Boolean(jobDescription?.jobTitle), hasCompany: Boolean(jobDescription?.companyName) });
    } catch (error) {
      logger.error('Failed to export DOCX', error instanceof Error ? error : { error });
      toast.error('errors.exportFailed');
    }
  };

  const isCoverLetter = (content: string) => {
    return validateDocumentContent(content, 'cover-letter');
  };

  const isOptimizedResume = (content: string) => {
    return validateDocumentContent(content, 'resume');
  };

  // Prefill adjust panel from Job Description
  const openAdjustPanel = (messageId: string) => {
    const preRole = jobDescription?.jobTitle || '';
    const preLevel = inferSeniority(undefined, jobDescription?.jobTitle) || '';
    // Prefer JD full content for focus inference if available (passed via parent component's jobDescription is title/company only)
    const preFocus = inferKeyFocus(jobDescription?.jobTitle || '') || '';
    setAdjustRole(preRole);
    setAdjustLevel(preLevel as SeniorityLevel | '');
    setAdjustFocus(preFocus);
    setAdjustForId(messageId);
  };

  const handleAdjustSubmit = () => {
    const payload = {
      targetRole: adjustRole || undefined,
      experienceLevel: adjustLevel || undefined,
      keyFocus: adjustFocus || undefined
    };
    onSendMessage(`__optimize_specs__:${JSON.stringify(payload)}`);
    setAdjustForId(null);
  };


  return (
    <div className="flex flex-col h-[600px] border border-gray-300 rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center space-x-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-800">{t('chat.title')}</h3>
      </div>

      {/* Secondary Quick Actions - Focused on analysis questions */}
      {!disabled && messages.length === 0 && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">{t('chat.analysisActions')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction(qaReqs)}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
            >
              📋 {t('chat.qaReqs')}
            </button>
            <button
              onClick={() => handleQuickAction(qaSkills)}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              📊 {t('chat.qaSkills')}
            </button>
          </div>
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>{t('chat.emptyTitle')}</p>
            <p className="text-xs mt-1">{t('chat.emptySubtitle')}</p>
          </div>
        ) : (
          <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    {message.role === 'assistant' ? (
                      <div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {(isCoverLetter(message.content) || isOptimizedResume(message.content)) && (
                          <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleExportPDF(message.content)}
                              className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>{t('chat.exportPDF')}</span>
                            </button>
                            <button
                              onClick={() => handleExportDocx(message.content)}
                              className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{t('chat.exportDOCX')}</span>
                            </button>
                            {isOptimizedResume(message.content) && (
                              <button
                                onClick={() => openAdjustPanel(message.id)}
                                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                                disabled={isLoading}
                              >
                                ✏️ Adjust & Regenerate
                              </button>
                            )}
                          </div>
                        )}
                        {isOptimizedResume(message.content) && adjustForId === message.id && (
                          <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Target Role</label>
                                <input
                                  type="text"
                                  value={adjustRole}
                                  onChange={(e) => setAdjustRole(e.target.value)}
                                  placeholder={jobDescription?.jobTitle || 'e.g., Senior Backend Engineer'}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Experience Level</label>
                                <select
                                  value={adjustLevel}
                                  onChange={(e) => setAdjustLevel(e.target.value as SeniorityLevel | '')}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                >
                                  <option value="">Infer</option>
                                  <option>Intern</option>
                                  <option>Junior</option>
                                  <option>Mid</option>
                                  <option>Senior</option>
                                  <option>Lead</option>
                                  <option>Staff</option>
                                  <option>Principal</option>
                                  <option>Manager</option>
                                  <option>Director</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Key Focus</label>
                                <input
                                  type="text"
                                  value={adjustFocus}
                                  onChange={(e) => setAdjustFocus(e.target.value)}
                                  placeholder="e.g., Leadership, Automation, Analytics"
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={handleAdjustSubmit}
                                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                disabled={isLoading}
                              >
                                Regenerate
                              </button>
                              <button
                                onClick={() => setAdjustForId(null)}
                                className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI Typing Indicator - Enhanced for UX */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-800 font-medium">AI is thinking...</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 mt-1">Analyzing your profile and job requirements</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={disabled ? t('chat.inputPlaceholderDisabled') : t('chat.inputPlaceholderReady')}
            disabled={disabled || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
