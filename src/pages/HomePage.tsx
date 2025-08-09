import { useState, useEffect, useCallback } from 'react';
import { FileText, Zap, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ToastProvider';
import { handleApiError } from '../utils/errors';
import { ProfileInput } from '../components/ProfileInput';
import { ContactInfoInput, ContactInfo } from '../components/ContactInfoInput';
import { FileUpload } from '../components/FileUpload';
import { JobDescriptionInput } from '../components/JobDescriptionInput';
import { MatchResult } from '../components/MatchResult';
import { ChatInterface } from '../components/ChatInterface';
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
  const [isChatLoading, setIsChatLoading] = useState(false);
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
    toast.clear();
    try { trackEvent('start_analysis'); } catch {}

    try {
      await initializeChat();
      const result = await geminiService.checkMatch();
      try { trackEvent('job_match_done', { score: result.decision === 'yes' ? 1 : 0 }); } catch {}
      setMatchResult(result);
    } catch (err) {
      const { messageKey, params } = handleApiError(err);
      toast.error(messageKey, params);
    } finally {
      setIsAnalyzing(false);
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



  const canAnalyze = userProfile && contactInfo && cvData && jobDescription && !isAnalyzing;
  const canChat = userProfile && contactInfo && cvData && jobDescription;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Main App Interface */}
        <div id="get-started" className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Profile Input */}
          <div>
            <ProfileInput
              profile={userProfile?.content || ''}
              onProfileSave={handleProfileSave}
              onClear={() => {
                setUserProfile(null);
                removeFromStorage(STORAGE_KEYS.USER_PROFILE);
                resetAnalysis();
              }}
            />
          </div>

          {/* Contact Info Input */}
          <div>
            <ContactInfoInput
              contactInfo={contactInfo}
              onContactInfoSave={handleContactInfoSave}
              onClear={() => {
                setContactInfo(null);
                removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
              }}
            />
          </div>

          {/* CV Upload */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-medium text-gray-900">{t('yourCV')}</span>
              {cvData && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {t('source.pasted')}: {cvData.fileName}
                </span>
              )}
            </div>
            <FileUpload
              label={t('addYourCV')}
              onFileProcessed={handleCVUpload}
              currentFile={cvData?.fileName}
              compact={true}
              onClear={() => {
                setCvData(null);
                removeFromStorage(STORAGE_KEYS.CV_DATA);
                resetAnalysis();
              }}
            />
          </div>

          {/* Job Description - Always Visible */}
          <div>
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

          {/* Analysis Button */}
          <div className="text-center">
            <button
              onClick={handleCheckMatch}
              disabled={!canAnalyze}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('analyzingMatch')}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t('checkJobMatch')}</span>
                </>
              )}
            </button>
          </div>

          {/* Match Result - Right Below Button */}
          {matchResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Analysis</h3>
              <MatchResult result={matchResult} />
            </div>
          )}
        </div>

        {/* AI Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {t('disclaimerTitle')}
          </h3>
          <div className="space-y-3 text-amber-800 text-sm">
            <p>
              <strong>{t('disclaimer.aiGeneratedTitle')}</strong> {t('disclaimer.aiGeneratedBody')}
            </p>
            <p>
              <strong>{t('disclaimer.responsibilityTitle')}</strong> {t('disclaimer.responsibilityBody')}
            </p>
            <p>
              <strong>{t('disclaimer.privacyTitle')}</strong> {t('disclaimer.privacyBody')}
            </p>
            <p>
              <strong>{t('disclaimer.liabilityTitle')}</strong> {t('disclaimer.liabilityBody')}
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        {canChat && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('aiAdvisor')}</h3>
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              disabled={!canChat}
              jobDescription={jobDescription}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">{t('howToDetailed.stepsTitle')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>{t('howToDetailed.step1')}</li>
            <li>{t('howToDetailed.step2')}</li>
            <li>{t('howToDetailed.step3')}</li>
            <li>{t('howToDetailed.step4')}</li>
            <li>{t('howToDetailed.step5')}</li>
            <li>{t('howToDetailed.step6')}</li>
          </ol>
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>{t('howToDetailed.bestPracticeTitle')}</strong> {t('howToDetailed.bestPracticeBody')}
            </p>
          </div>
          <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">{t('howToDetailed.whyTextTitle')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-700">
              <div>{t('howToDetailed.whyTextBullet1')}</div>
              <div>{t('howToDetailed.whyTextBullet2')}</div>
              <div>{t('howToDetailed.whyTextBullet3')}</div>
              <div>{t('howToDetailed.whyTextBullet4')}</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
