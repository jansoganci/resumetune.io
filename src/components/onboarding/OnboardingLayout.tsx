// ================================================================
// ONBOARDING LAYOUT
// ================================================================
// Shared layout wrapper for onboarding flow

import React from 'react';
import { Sparkles } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      {showLogo && (
        <header className="w-full py-6 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ResumeTune</h1>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            Your data is encrypted and secure.{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
