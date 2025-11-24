// ================================================================
// CAPTCHA MODAL COMPONENT - PHASE 3.3
// ================================================================
// This component displays CAPTCHA challenges in a modal overlay
// Integrates with CaptchaContext and CaptchaChallenge

import React from 'react';
import { useCaptchaContext } from '../contexts/CaptchaContext';
import { CaptchaChallenge } from './CaptchaChallenge';
import { logger } from '../utils/logger';

export function CaptchaModal() {
  const {
    showCaptchaModal,
    closeCaptchaModal,
    challenge,
    isVerifying,
    error,
    canBypass,
    attemptBypass,
    bypassAttempts,
    maxBypassAttempts
  } = useCaptchaContext();

  // Don't render if modal is not shown
  if (!showCaptchaModal || !challenge) {
    return null;
  }

  const handleSuccess = (token: string) => {
    // The context will handle the verification and modal closing
    logger.debug('CAPTCHA verification successful', { token: token.substring(0, 10) + '...' });
  };

  const handleError = (error: string) => {
    logger.error('CAPTCHA verification error', new Error(error));
  };

  const handleCancel = () => {
    closeCaptchaModal();
  };

  const handleBypass = async () => {
    const success = await attemptBypass();
    if (success) {
      logger.info('CAPTCHA bypass successful');
    } else {
      logger.warn('CAPTCHA bypass failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeCaptchaModal}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Security Verification Required
          </h2>
          <button
            onClick={closeCaptchaModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* CAPTCHA Challenge */}
          <CaptchaChallenge
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={handleCancel}
            challengeType={challenge.challengeType}
            siteKey={challenge.siteKey}
            abuseScore={challenge.abuseScore}
            reason="Unusual activity detected from your IP address"
            expiresAt={challenge.expiresAt}
          />

          {/* Bypass Option */}
          {canBypass && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Need help?</p>
                  <p>You can request a bypass if you're having trouble.</p>
                  <p className="text-xs mt-1">
                    Attempts: {bypassAttempts}/{maxBypassAttempts}
                  </p>
                </div>
                <button
                  onClick={handleBypass}
                  disabled={isVerifying}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? 'Processing...' : 'Request Bypass'}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>This security check helps protect against automated abuse.</p>
              <p>Your privacy and security are our top priorities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
