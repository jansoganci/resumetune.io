// ================================================================
// GEMINI SERVICE HOOK - PHASE 2 REFACTOR
// ================================================================
// Encapsulates Gemini AI service logic and state management
// Extracts complex AI orchestration from HomePage component

import { useState, useCallback, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage, MatchResult, CVData, JobDescription, UserProfile } from '../types';
import { ContactInfo } from '../components/ContactInfoInput';
import { handleApiError } from '../utils/errors';
import { useToast } from '../components/ToastProvider';
import { trackEvent } from '../utils/analytics';
import { QuotaIndicatorRef } from '../components/QuotaIndicator';

interface UseGeminiServiceOptions {
  quotaIndicatorRef?: React.RefObject<QuotaIndicatorRef>;
  onMatchSuccess?: (result: MatchResult) => void;
}

export function useGeminiService(options: UseGeminiServiceOptions = {}) {
  const [geminiService] = useState(() => new GeminiService());
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'analyzing' | 'matching' | 'generating' | 'complete'>('analyzing');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const toast = useToast();

  const resetAnalysis = useCallback(() => {
    setMatchResult(null);
    setChatMessages([]);
    geminiService.reset();
  }, [geminiService]);

  const initializeChat = useCallback(async (
    cvData: CVData,
    jobDescription: JobDescription,
    userProfile?: UserProfile
  ) => {
    try {
      await geminiService.initializeChat(cvData, jobDescription, userProfile);
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
      throw err;
    }
  }, [geminiService, toast]);

  const checkMatch = useCallback(async (
    userProfile: UserProfile | null,
    cvData: CVData | null,
    jobDescription: JobDescription | null
  ) => {
    if (!userProfile) {
      toast.error('errors.invalidInput');
      return;
    }

    if (!cvData || !jobDescription) {
      toast.error('errors.invalidInput');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('analyzing');
    setAnalysisProgress(0);
    toast.clear();

    try {
      trackEvent('start_analysis');
    } catch {}

    try {
      // Step 1: Initialize chat (analyzing)
      setAnalysisProgress(20);
      await initializeChat(cvData, jobDescription, userProfile);

      // Step 2: Match analysis (matching)
      setAnalysisStep('matching');
      setAnalysisProgress(50);

      // Simulate realistic analysis time with progress updates
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(70);

      // Step 3: Generate results (generating)
      setAnalysisStep('generating');
      setAnalysisProgress(85);

      const result = await geminiService.checkMatch();

      // Step 4: Complete
      setAnalysisStep('complete');
      setAnalysisProgress(100);

      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        trackEvent('job_match_done', { score: result.decision === 'yes' ? 1 : 0 });
      } catch {}

      setMatchResult(result);

      // Refresh quota after successful job match
      options.quotaIndicatorRef?.current?.refresh();

      // Notify parent of successful match
      options.onMatchSuccess?.(result);

    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [geminiService, initializeChat, toast, options]);

  const sendMessage = useCallback(async (
    message: string,
    userProfile: UserProfile | null,
    contactInfo: ContactInfo | null,
    cvData: CVData | null,
    jobDescription: JobDescription | null
  ) => {
    if (!userProfile) {
      toast.error('errors.invalidInput');
      return;
    }

    if (!contactInfo) {
      toast.error('errors.invalidInput');
      return;
    }

    if (!cvData || !jobDescription) {
      toast.error('errors.invalidInput');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);
    toast.clear();

    try {
      if (chatMessages.length === 0) {
        await initializeChat(cvData, jobDescription, userProfile);
      }

      const response = await geminiService.sendMessage(message, contactInfo);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Refresh quota after successful cover letter generation
      options.quotaIndicatorRef?.current?.refresh();
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    } finally {
      setIsChatLoading(false);
    }
  }, [geminiService, chatMessages.length, initializeChat, toast, options]);

  return {
    matchResult,
    chatMessages,
    isAnalyzing,
    analysisStep,
    analysisProgress,
    isChatLoading,
    checkMatch,
    sendMessage,
    resetAnalysis,
  };
}
