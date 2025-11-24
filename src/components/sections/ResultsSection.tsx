// ================================================================
// RESULTS SECTION COMPONENT - PHASE 2 REFACTOR
// ================================================================
// Displays match results and chat interface
// Extracted from HomePage to reduce complexity

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MatchResult as MatchResultComponent } from '../MatchResult';
import { CollapsibleChat } from '../CollapsibleChat';
import { AnimateOnScroll, SuccessCelebration } from '../../utils/animations';
import { ConfettiCelebration } from '../MicroFeedback';
import { MatchResult, ChatMessage, JobDescription } from '../../types';
import { useProfile } from '../../contexts/ProfileContext';

interface ResultsSectionProps {
  matchResult: MatchResult | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
}

export function ResultsSection({
  matchResult,
  chatMessages,
  isChatLoading,
  onSendMessage,
}: ResultsSectionProps) {
  const { t } = useTranslation();
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { hasCompleteProfile, jobDescription } = useProfile();

  // Show celebration when match result is successful
  React.useEffect(() => {
    if (matchResult?.decision === 'yes') {
      setShowCelebration(true);
    }
  }, [matchResult]);

  const canChat = hasCompleteProfile;

  return (
    <>
      {/* Match Result */}
      {matchResult && (
        <AnimateOnScroll animation="slideInFromBottom" triggerOnce={false}>
          <SuccessCelebration
            show={matchResult.decision === 'yes'}
            type="bounce"
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('match.analysisTitle')}
              </h3>
              <MatchResultComponent
                result={matchResult}
                onSendMessage={canChat ? onSendMessage : undefined}
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
          onSendMessage={onSendMessage}
          isLoading={isChatLoading}
          disabled={!canChat}
          jobDescription={jobDescription}
          isExpanded={isChatExpanded}
          onExpandedChange={setIsChatExpanded}
        />
      </AnimateOnScroll>

      {/* Confetti celebration for successful matches */}
      <ConfettiCelebration show={showCelebration} />
    </>
  );
}
