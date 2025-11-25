// ================================================================
// ONBOARDING WELCOME (STEP 1)
// ================================================================
// Welcome screen explaining the onboarding process

import React from 'react';
import { Rocket, Clock, Shield, Zap } from 'lucide-react';

interface OnboardingWelcomeProps {
  onNext: () => void;
  onSkip?: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  onNext,
  onSkip,
}) => {
  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to ResumeTune!
        </h2>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          Let's set up your profile in just 2 minutes. This will save you time on every job application.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="text-center p-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Quick Setup</h3>
          <p className="text-sm text-gray-600">
            Only 2 minutes to complete
          </p>
        </div>

        <div className="text-center p-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Auto-Fill Forms</h3>
          <p className="text-sm text-gray-600">
            Never re-enter info again
          </p>
        </div>

        <div className="text-center p-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Secure & Private</h3>
          <p className="text-sm text-gray-600">
            Encrypted and GDPR-compliant
          </p>
        </div>
      </div>

      {/* What we'll collect */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">
          What we'll collect:
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>Basic information (name, email, phone)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>Professional details (current position)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>Optional: LinkedIn, portfolio, GitHub links</span>
          </li>
        </ul>
      </div>

      {/* Privacy notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-900">
          <strong>Your privacy matters:</strong> We encrypt your data, never sell it to advertisers,
          and you can edit or delete it anytime.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Get Started
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            className="flex-1 sm:flex-none bg-white text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Skip for now
          </button>
        )}
      </div>

      {onSkip && (
        <p className="text-xs text-gray-500 text-center mt-4">
          You can complete your profile anytime from settings
        </p>
      )}
    </div>
  );
};
