// ================================================================
// ONBOARDING PROFESSIONAL INFO (STEP 3)
// ================================================================
// Collects professional information and links

import React, { useState } from 'react';
import { Briefcase, Linkedin, Globe, Github, ChevronLeft } from 'lucide-react';
import { ProfessionalInfoData, ValidationErrors } from '../../types/onboarding';

interface OnboardingProfessionalProps {
  onNext: (data: ProfessionalInfoData) => void;
  onBack: () => void;
  initialData?: Partial<ProfessionalInfoData>;
}

export const OnboardingProfessional: React.FC<OnboardingProfessionalProps> = ({
  onNext,
  onBack,
  initialData,
}) => {
  const [currentPosition, setCurrentPosition] = useState(initialData?.currentPosition || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(initialData?.portfolioUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '');
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Current position validation
    if (!currentPosition.trim()) {
      newErrors.currentPosition = 'Current position is required';
    } else if (currentPosition.trim().length < 2) {
      newErrors.currentPosition = 'Position must be at least 2 characters';
    }

    // URL validations (optional fields)
    const urlPattern = /^https?:\/\/.+/;

    if (linkedinUrl && linkedinUrl.trim() && !urlPattern.test(linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (portfolioUrl && portfolioUrl.trim() && !urlPattern.test(portfolioUrl)) {
      newErrors.portfolioUrl = 'Please enter a valid URL (starting with http:// or https://)';
    }

    if (githubUrl && githubUrl.trim() && !urlPattern.test(githubUrl)) {
      newErrors.githubUrl = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onNext({
        currentPosition: currentPosition.trim(),
        linkedinUrl: linkedinUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      });
    }
  };

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your career
        </h2>
        <p className="text-gray-600">
          Help us tailor your job applications
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Position */}
        <div>
          <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-2">
            Current Position <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="currentPosition"
              value={currentPosition}
              onChange={(e) => {
                setCurrentPosition(e.target.value);
                if (errors.currentPosition) {
                  setErrors({ ...errors, currentPosition: undefined });
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.currentPosition ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Senior Full-Stack Developer"
              required
            />
          </div>
          {errors.currentPosition && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPosition}</p>
          )}
        </div>

        {/* LinkedIn */}
        <div>
          <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              id="linkedinUrl"
              value={linkedinUrl}
              onChange={(e) => {
                setLinkedinUrl(e.target.value);
                if (errors.linkedinUrl) {
                  setErrors({ ...errors, linkedinUrl: undefined });
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          {errors.linkedinUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl}</p>
          )}
        </div>

        {/* Portfolio */}
        <div>
          <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Website <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              id="portfolioUrl"
              value={portfolioUrl}
              onChange={(e) => {
                setPortfolioUrl(e.target.value);
                if (errors.portfolioUrl) {
                  setErrors({ ...errors, portfolioUrl: undefined });
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.portfolioUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://yourportfolio.com"
            />
          </div>
          {errors.portfolioUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.portfolioUrl}</p>
          )}
        </div>

        {/* GitHub */}
        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              id="githubUrl"
              value={githubUrl}
              onChange={(e) => {
                setGithubUrl(e.target.value);
                if (errors.githubUrl) {
                  setErrors({ ...errors, githubUrl: undefined });
                }
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.githubUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://github.com/yourusername"
            />
          </div>
          {errors.githubUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.githubUrl}</p>
          )}
        </div>

        {/* Helper text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Adding your professional links helps employers learn more about you
            and makes your applications stand out.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};
