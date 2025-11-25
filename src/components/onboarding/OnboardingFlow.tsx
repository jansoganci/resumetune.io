// ================================================================
// ONBOARDING FLOW - MAIN ORCHESTRATOR
// ================================================================
// Manages multi-step onboarding wizard state and navigation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingStep, OnboardingFormData, BasicInfoData, ProfessionalInfoData, PrivacyConsentData } from '../../types/onboarding';
import { useUserProfile } from '../../hooks/useUserProfile';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingBasicInfo } from './OnboardingBasicInfo';
import { OnboardingProfessional } from './OnboardingProfessional';
import { OnboardingPrivacy } from './OnboardingPrivacy';
import { CheckCircle } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({});
  const [showCompletion, setShowCompletion] = useState(false);
  const { saveProfile, skipOnboarding, isLoading } = useUserProfile();
  const navigate = useNavigate();

  // Handle welcome -> basic info
  const handleWelcomeNext = () => {
    setCurrentStep('basic');
  };

  // Handle skip onboarding
  const handleSkip = async () => {
    await skipOnboarding();
    if (onSkip) {
      onSkip();
    } else {
      navigate('/');
    }
  };

  // Handle basic info -> professional
  const handleBasicInfoNext = (data: BasicInfoData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep('professional');
  };

  // Handle professional -> privacy
  const handleProfessionalNext = (data: ProfessionalInfoData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep('privacy');
  };

  // Handle privacy -> complete
  const handlePrivacySubmit = async (data: PrivacyConsentData) => {
    const completeData: OnboardingFormData = {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      email: formData.email || '',
      phone: formData.phone,
      currentPosition: formData.currentPosition || '',
      linkedinUrl: formData.linkedinUrl,
      portfolioUrl: formData.portfolioUrl,
      githubUrl: formData.githubUrl,
      city: formData.city,
      country: formData.country,
      dataConsent: data.dataConsent,
      marketingConsent: data.marketingConsent,
    };

    const success = await saveProfile(completeData);

    if (success) {
      setShowCompletion(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          navigate('/');
        }
      }, 2000);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'basic') {
      setCurrentStep('welcome');
    } else if (currentStep === 'professional') {
      setCurrentStep('basic');
    } else if (currentStep === 'privacy') {
      setCurrentStep('professional');
    }
  };

  // Completion screen
  if (showCompletion) {
    return (
      <OnboardingLayout>
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            All set! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Your profile has been created successfully. Redirecting you to the app...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout>
      {/* Progress bar (hide on welcome screen) */}
      {currentStep !== 'welcome' && (
        <OnboardingProgress currentStep={currentStep} />
      )}

      {/* Step components */}
      {currentStep === 'welcome' && (
        <OnboardingWelcome
          onNext={handleWelcomeNext}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 'basic' && (
        <OnboardingBasicInfo
          onNext={handleBasicInfoNext}
          onBack={handleBack}
          initialData={formData}
        />
      )}

      {currentStep === 'professional' && (
        <OnboardingProfessional
          onNext={handleProfessionalNext}
          onBack={handleBack}
          initialData={formData}
        />
      )}

      {currentStep === 'privacy' && (
        <OnboardingPrivacy
          onSubmit={handlePrivacySubmit}
          onBack={handleBack}
          isLoading={isLoading}
        />
      )}
    </OnboardingLayout>
  );
};
