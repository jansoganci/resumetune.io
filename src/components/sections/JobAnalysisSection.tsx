// ================================================================
// JOB ANALYSIS SECTION COMPONENT - PHASE 2 REFACTOR
// ================================================================
// Manages job description input, analysis button, and progress indicators
// Extracted from HomePage to reduce complexity

import React, { useRef } from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { JobDescriptionInput } from '../JobDescriptionInput';
import { QuotaIndicator, QuotaIndicatorRef } from '../QuotaIndicator';
import { AnimateOnScroll } from '../../utils/animations';
import { AnalysisProgress } from '../ProgressIndicators';
import { AnimatedButton } from '../../utils/animations';
import { useProfile } from '../../contexts/ProfileContext';
import { removeFromStorage, STORAGE_KEYS } from '../../utils/storage';

interface JobAnalysisSectionProps {
  onAnalyze: (quotaRef: React.RefObject<QuotaIndicatorRef>) => void;
  isAnalyzing: boolean;
  analysisStep: 'analyzing' | 'matching' | 'generating' | 'complete';
  analysisProgress: number;
}

export function JobAnalysisSection({
  onAnalyze,
  isAnalyzing,
  analysisStep,
  analysisProgress,
}: JobAnalysisSectionProps) {
  const { t } = useTranslation();
  const quotaIndicatorRef = useRef<QuotaIndicatorRef>(null);
  const {
    jobDescription,
    handleJobDescriptionChange,
    setJobDescription,
    hasCompleteProfile,
  } = useProfile();

  const canAnalyze = hasCompleteProfile && !isAnalyzing;

  return (
    <>
      {/* Job Description Input */}
      <AnimateOnScroll animation="fadeInUp" delay="delay150">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <JobDescriptionInput
            value={jobDescription?.content || ''}
            onChange={handleJobDescriptionChange}
            onClear={() => {
              setJobDescription(null);
              removeFromStorage(STORAGE_KEYS.JOB_DESCRIPTION);
            }}
          />
        </div>
      </AnimateOnScroll>

      {/* Analysis Button */}
      <AnimateOnScroll animation="fadeInUp" delay="delay300">
        <div className="text-center">
          {/* Quota Indicator */}
          <div className="mb-3 flex justify-center">
            <QuotaIndicator ref={quotaIndicatorRef} />
          </div>

          <AnimatedButton
            onClick={() => onAnalyze(quotaIndicatorRef)}
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
    </>
  );
}
