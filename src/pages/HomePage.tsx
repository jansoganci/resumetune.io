import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ToastProvider';
import { handleApiError } from '../utils/errors';
import { ContactInfo } from '../components/ContactInfoInput';
import { JobDescriptionInput } from '../components/JobDescriptionInput';
import { MatchResult } from '../components/MatchResult';
import { CollapsibleChat } from '../components/CollapsibleChat';
import { InfoModal } from '../components/InfoModal';
import { ProfileStatusBar } from '../components/ProfileStatusBar';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { AnimateOnScroll, SuccessCelebration, AnimatedButton } from '../utils/animations';
import { AnalysisProgress } from '../components/ProgressIndicators';
import { useKeyboardShortcuts, createAppShortcuts } from '../hooks/useKeyboardShortcuts';
import { ConfettiCelebration, ShortcutHint } from '../components/MicroFeedback';
import { GeminiService } from '../services/geminiService';
import { ChatMessage, MatchResult as MatchResultType, CVData, JobDescription, UserProfile } from '../types';
import { saveToStorage, loadFromStorage, removeFromStorage, STORAGE_KEYS } from '../utils/storage';
import { trackEvent } from '../utils/analytics';
import Footer from '../components/Footer';

export default function HomePage() {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResultType | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'analyzing' | 'matching' | 'generating' | 'complete'>('analyzing');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShortcutHint] = useState(false);
  const [geminiService] = useState(() => new GeminiService());
  const toast = useToast();

  // Load saved data on component mount
  useEffect(() => {
    const savedProfile = loadFromStorage(STORAGE_KEYS.USER_PROFILE);
    const savedContactInfo = loadFromStorage(STORAGE_KEYS.CONTACT_INFO);
    const savedCV = loadFromStorage(STORAGE_KEYS.CV_DATA);
    const savedJob = loadFromStorage(STORAGE_KEYS.JOB_DESCRIPTION);
    
    if (savedProfile) {
      setUserProfile({
        ...savedProfile,
        savedAt: new Date(savedProfile.savedAt)
      });
    }
    
    if (savedContactInfo) {
      setContactInfo({
        ...savedContactInfo,
        savedAt: new Date(savedContactInfo.savedAt)
      });
    }
    
    if (savedCV) {
      setCvData({
        ...savedCV,
        uploadedAt: new Date(savedCV.uploadedAt)
      });
    }
    
    if (savedJob) {
      setJobDescription({
        ...savedJob,
        addedAt: new Date(savedJob.addedAt)
      });
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setMatchResult(null);
    setChatMessages([]);
    geminiService.reset();
  }, [geminiService]);

  const handleProfileSave = useCallback((content: string) => {
    const newProfile = {
      content,
      savedAt: new Date()
    };
    setUserProfile(newProfile);
    saveToStorage(STORAGE_KEYS.USER_PROFILE, newProfile);
    toast.clear();
    resetAnalysis();
  }, [toast, resetAnalysis]);

  const handleContactInfoSave = useCallback((contactData: ContactInfo) => {
    const newContactInfo = {
      ...contactData,
      savedAt: new Date()
    };
    
    setContactInfo(newContactInfo);
    saveToStorage(STORAGE_KEYS.CONTACT_INFO, newContactInfo);
    toast.clear();
  }, [toast]);

  const handleCVUpload = useCallback((content: string, fileName: string) => {
    const newCVData = {
      content,
      fileName,
      uploadedAt: new Date()
    };
    setCvData(newCVData);
    saveToStorage(STORAGE_KEYS.CV_DATA, newCVData);
    toast.clear();
    resetAnalysis();
  }, [toast, resetAnalysis]);

  const handleJobDescriptionChange = useCallback((content: string, jobTitle?: string, companyName?: string) => {
    const newJobData = {
      content,
      jobTitle,
      companyName,
      addedAt: new Date()
    };
    setJobDescription(newJobData);
    saveToStorage(STORAGE_KEYS.JOB_DESCRIPTION, newJobData);
    toast.clear();
    setMatchResult(null);
  }, [toast]);

  const initializeChat = useCallback(async () => {
    if (!cvData || !jobDescription) return;

    try {
      await geminiService.initializeChat(cvData, jobDescription, userProfile || undefined);
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    }
  }, [cvData, jobDescription, userProfile, geminiService, toast]);

  const handleCheckMatch = useCallback(async () => {
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
    try { trackEvent('start_analysis'); } catch {}

    try {
      // Step 1: Initialize chat (analyzing)
      setAnalysisProgress(20);
      await initializeChat();
      
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
      
      try { trackEvent('job_match_done', { score: result.decision === 'yes' ? 1 : 0 }); } catch {}
      setMatchResult(result);
      
      // Show celebration for successful matches
      if (result.decision === 'yes') {
        setShowCelebration(true);
      }
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [userProfile, cvData, jobDescription, toast, initializeChat, geminiService]);

  const handleSendMessage = useCallback(async (message: string) => {
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
        await initializeChat();
      }

      const response = await geminiService.sendMessage(message, contactInfo);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    } finally {
      setIsChatLoading(false);
    }
  }, [userProfile, contactInfo, cvData, jobDescription, toast, chatMessages.length, initializeChat, geminiService]);

  const handleClearAllProfile = () => {
    setUserProfile(null);
    setContactInfo(null);
    setCvData(null);
    removeFromStorage(STORAGE_KEYS.USER_PROFILE);
    removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
    removeFromStorage(STORAGE_KEYS.CV_DATA);
    resetAnalysis();
  };

  const canAnalyze = userProfile && contactInfo && cvData && jobDescription && !isAnalyzing;
  const canChat = userProfile && contactInfo && cvData && jobDescription;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: createAppShortcuts({
      analyze: canAnalyze ? handleCheckMatch : undefined,
      editProfile: () => setIsProfileEditModalOpen(true),
      expandChat: canChat ? () => setIsChatExpanded(!isChatExpanded) : undefined,
      showHelp: () => setIsInfoModalOpen(true),
    }),
    enabled: true
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header onInfoClick={() => setIsInfoModalOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Status Bar */}
        <AnimateOnScroll animation="slideInFromTop" delay="delay75">
          <ProfileStatusBar
            userProfile={userProfile}
            contactInfo={contactInfo}
            cvData={cvData}
            onEdit={() => setIsProfileEditModalOpen(true)}
            onClear={handleClearAllProfile}
          />
        </AnimateOnScroll>

        {/* Hero Job Description Section */}
        <AnimateOnScroll animation="fadeInUp" delay="delay150">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <JobDescriptionInput
              value={jobDescription?.content || ''}
              onChange={handleJobDescriptionChange}
              onClear={() => {
                setJobDescription(null);
                removeFromStorage(STORAGE_KEYS.JOB_DESCRIPTION);
                setMatchResult(null);
              }}
            />
          </div>
        </AnimateOnScroll>

        {/* Primary Analysis Button */}
        <AnimateOnScroll animation="fadeInUp" delay="delay300">
          <div className="text-center">
            <AnimatedButton
              onClick={handleCheckMatch}
              disabled={!canAnalyze}
              isLoading={isAnalyzing}
              size="lg"
              className="text-lg px-8 py-4"
            >
              {isAnalyzing ? (
                <span>{t('analyzingMatch')}</span>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  <span>{t('checkJobMatch')}</span>
                </>
              )}
            </AnimatedButton>
          </div>
        </AnimateOnScroll>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <AnimateOnScroll animation="slideInFromBottom" triggerOnce={false}>
            <AnalysisProgress 
              currentStep={analysisStep}
              progress={analysisProgress}
            />
          </AnimateOnScroll>
        )}

        {/* Match Result */}
        {matchResult && (
          <AnimateOnScroll animation="slideInFromBottom" triggerOnce={false}>
            <SuccessCelebration 
              show={matchResult.decision === 'yes'} 
              type="bounce"
            >
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('match.analysisTitle')}</h3>
                <MatchResult 
                  result={matchResult} 
                  onSendMessage={canChat ? handleSendMessage : undefined}
                  onExpandChat={() => setIsChatExpanded(true)}
                />
              </div>
            </SuccessCelebration>
          </AnimateOnScroll>
        )}

        {/* Collapsible Chat Interface */}
        <AnimateOnScroll animation="fadeInUp" delay="delay450">
          <CollapsibleChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            disabled={!canChat}
            jobDescription={jobDescription}
            isExpanded={isChatExpanded}
            onExpandedChange={setIsChatExpanded}
          />
        </AnimateOnScroll>
      </main>

      <Footer />
      
      {/* Confetti celebration for successful matches */}
      <ConfettiCelebration show={showCelebration} />
      
      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <ShortcutHint 
          shortcut="Ctrl+Enter"
          description="Quick analyze"
          show={Boolean(showShortcutHint && canAnalyze && jobDescription?.content)}
        />
      </div>
      
      {/* Info Modal */}
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        userProfile={userProfile}
        contactInfo={contactInfo}
        cvData={cvData}
        onProfileSave={handleProfileSave}
        onContactInfoSave={handleContactInfoSave}
        onCVUpload={handleCVUpload}
        onClearProfile={() => {
          setUserProfile(null);
          removeFromStorage(STORAGE_KEYS.USER_PROFILE);
          resetAnalysis();
        }}
        onClearContactInfo={() => {
          setContactInfo(null);
          removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
        }}
        onClearCV={() => {
          setCvData(null);
          removeFromStorage(STORAGE_KEYS.CV_DATA);
          resetAnalysis();
        }}
      />
    </div>
  );
}
