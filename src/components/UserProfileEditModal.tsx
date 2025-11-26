// ================================================================
// USER PROFILE EDIT MODAL
// ================================================================
// Modal for editing user profile from onboarding database
// Reuses onboarding form components for consistency

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { UserProfileDB, UserProfileUpdate } from '../types/onboarding';
import { OnboardingBasicInfo } from './onboarding/OnboardingBasicInfo';
import { OnboardingProfessional } from './onboarding/OnboardingProfessional';

interface UserProfileEditModalProps {
  profile: UserProfileDB;
  onSave: (updates: UserProfileUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserProfileEditModal: React.FC<UserProfileEditModalProps> = ({
  profile,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<'basic' | 'professional'>('basic');
  const [formData, setFormData] = useState({
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone || undefined,
    currentPosition: profile.current_position,
    linkedinUrl: profile.linkedin_url || undefined,
    portfolioUrl: profile.portfolio_url || undefined,
    githubUrl: profile.github_url || undefined,
  });

  const handleBasicNext = (data: { firstName: string; lastName: string; email: string; phone?: string }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep('professional');
  };

  const handleProfessionalNext = async (data: {
    currentPosition: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    githubUrl?: string;
  }) => {
    const updates: UserProfileUpdate = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      current_position: data.currentPosition,
      linkedin_url: data.linkedinUrl || null,
      portfolio_url: data.portfolioUrl || null,
      github_url: data.githubUrl || null,
    };

    await onSave(updates);
  };

  const handleBack = () => {
    setCurrentStep('basic');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep === 'basic' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`w-3 h-3 rounded-full ${currentStep === 'professional' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {currentStep === 'basic' ? 'Step 1 of 2: Basic Information' : 'Step 2 of 2: Professional Information'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'basic' && (
            <OnboardingBasicInfo
              onNext={handleBasicNext}
              onBack={onCancel}
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
        </div>
      </div>
    </div>
  );
};
