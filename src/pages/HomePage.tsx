// ================================================================
// HOME PAGE - PHASE 2 REFACTORED
// ================================================================
// Clean orchestrator for main application flow
// Reduced from 433 → ~140 lines by extracting context, hooks, and sections

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { InfoModal } from '../components/InfoModal';
import { ShortcutHint } from '../components/MicroFeedback';
import { ProfileProvider, useProfile } from '../contexts/ProfileContext';
import { useGeminiService } from '../hooks/useGeminiService';
import { useKeyboardShortcuts, createAppShortcuts } from '../hooks/useKeyboardShortcuts';
import { ProfileSection } from '../components/sections/ProfileSection';
import { JobAnalysisSection } from '../components/sections/JobAnalysisSection';
import { ResultsSection } from '../components/sections/ResultsSection';
import { QuotaIndicatorRef } from '../components/QuotaIndicator';

function HomePageContent() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showShortcutHint] = useState(false);

  // Get profile data from context
  const {
    userProfile,
    contactInfo,
    cvData,
    jobDescription,
    hasCompleteProfile,
    fillSampleData,
  } = useProfile();

  // Check if profile is empty (for showing sample data prompt)
  const isProfileEmpty = !userProfile && !contactInfo && !cvData;

  // Gemini service for AI operations
  const geminiService = useGeminiService();

  // Handler for analysis - receives quota ref from JobAnalysisSection
  const handleAnalyze = (quotaRef: React.RefObject<QuotaIndicatorRef>) => {
    geminiService.checkMatch(userProfile, cvData, jobDescription);
  };

  // Handler for chat messages
  const handleSendMessage = (message: string) => {
    geminiService.sendMessage(message, userProfile, contactInfo, cvData, jobDescription);
  };

  // Keyboard shortcuts
  const canAnalyze = hasCompleteProfile && !geminiService.isAnalyzing;
  useKeyboardShortcuts({
    shortcuts: createAppShortcuts({
      analyze: canAnalyze ? () => handleAnalyze({ current: null }) : undefined,
      showHelp: () => setIsInfoModalOpen(true),
    }),
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header onInfoClick={() => setIsInfoModalOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Empty State: Try Sample Data Banner */}
        {isProfileEmpty && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm animate-fadeInUp">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center justify-center md:justify-start">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  New here? Try it instantly!
                </h3>
                <p className="text-sm text-blue-800">
                  See ResumeTune in action with sample data. Click the button to auto-fill everything and get results in seconds.
                </p>
              </div>
              <button
                onClick={fillSampleData}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap min-h-[48px] flex items-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Try Sample Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Management Section */}
        <ProfileSection />

        {/* Job Analysis Section */}
        <JobAnalysisSection
          onAnalyze={handleAnalyze}
          isAnalyzing={geminiService.isAnalyzing}
          analysisStep={geminiService.analysisStep}
          analysisProgress={geminiService.analysisProgress}
        />

        {/* Results Section */}
        <ResultsSection
          matchResult={geminiService.matchResult}
          chatMessages={geminiService.chatMessages}
          isChatLoading={geminiService.isChatLoading}
          onSendMessage={handleSendMessage}
        />
      </main>

      <Footer />

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
    </div>
  );
}

// Wrap with ProfileProvider
export default function HomePage() {
  return (
    <ProfileProvider onAnalysisReset={() => {}}>
      <HomePageContent />
    </ProfileProvider>
  );
}
