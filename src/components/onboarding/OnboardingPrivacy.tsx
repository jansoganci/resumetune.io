// ================================================================
// ONBOARDING PRIVACY (STEP 4)
// ================================================================
// Privacy consent and data usage explanation

import React, { useState } from 'react';
import { Shield, Lock, Eye, Trash2, Download, ChevronLeft } from 'lucide-react';
import { PrivacyConsentData } from '../../types/onboarding';

interface OnboardingPrivacyProps {
  onSubmit: (data: PrivacyConsentData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const OnboardingPrivacy: React.FC<OnboardingPrivacyProps> = ({
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [dataConsent, setDataConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dataConsent) {
      onSubmit({ dataConsent, marketingConsent });
    }
  };

  return (
    <div className="p-8 md:p-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your privacy matters
        </h2>
        <p className="text-gray-600">
          We take data protection seriously
        </p>
      </div>

      {/* How we protect your data */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          How we protect your data
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start text-sm text-blue-900">
            <span className="text-green-600 mr-3 mt-0.5">✓</span>
            <span><strong>Encrypted storage:</strong> Your data is encrypted using AES-256 in our secure database</span>
          </li>
          <li className="flex items-start text-sm text-blue-900">
            <span className="text-green-600 mr-3 mt-0.5">✓</span>
            <span><strong>Never sold:</strong> We never sell your data to third parties or advertisers</span>
          </li>
          <li className="flex items-start text-sm text-blue-900">
            <span className="text-green-600 mr-3 mt-0.5">✓</span>
            <span><strong>No tracking:</strong> Not used for ads, tracking, or marketing without consent</span>
          </li>
          <li className="flex items-start text-sm text-blue-900">
            <span className="text-green-600 mr-3 mt-0.5">✓</span>
            <span><strong>Full control:</strong> Edit or delete your information anytime</span>
          </li>
          <li className="flex items-start text-sm text-blue-900">
            <span className="text-green-600 mr-3 mt-0.5">✓</span>
            <span><strong>GDPR & CCPA compliant:</strong> We follow international data protection laws</span>
          </li>
        </ul>
      </div>

      {/* Your rights */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Your rights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Access</h4>
              <p className="text-xs text-gray-600 mt-1">View & export your data</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Edit</h4>
              <p className="text-xs text-gray-600 mt-1">Update anytime</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Trash2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Delete</h4>
              <p className="text-xs text-gray-600 mt-1">Remove all data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data consent (required) */}
        <label className="flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            <strong className="text-gray-900 block mb-1">
              I consent to data processing <span className="text-red-500">*</span>
            </strong>
            I understand my data will be stored securely and used only to generate job applications.
            I can access, edit, or delete my data at any time from my account settings.
          </span>
        </label>

        {/* Marketing consent (optional) */}
        <label className="flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            <strong className="text-gray-900 block mb-1">
              Marketing communications <span className="text-gray-500">(Optional)</span>
            </strong>
            Send me job search tips, product updates, and special offers. Unsubscribe anytime.
          </span>
        </label>

        {/* Terms notice */}
        <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>.
            Your information is encrypted and protected according to GDPR and CCPA standards.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <button
            type="submit"
            disabled={!dataConsent || isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Completing Setup...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </div>

        {/* Consent required notice */}
        {!dataConsent && (
          <p className="text-xs text-amber-700 text-center bg-amber-50 p-3 rounded-lg">
            ⚠️ You must consent to data processing to use ResumeTune
          </p>
        )}
      </form>
    </div>
  );
};
