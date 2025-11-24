// ================================================================
// CAPTCHA CHALLENGE COMPONENT - PHASE 3.3
// ================================================================
// This component implements the CAPTCHA challenge interface
// Integrates with hCaptcha service for abuse prevention

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';
import { EXTERNAL_URLS } from '../config/constants';

export interface CaptchaChallengeProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  challengeType: 'hcaptcha';
  siteKey: string;
  abuseScore: number;
  reason: string;
  expiresAt: string;
}

export interface CaptchaChallengeState {
  isLoading: boolean;
  isVerified: boolean;
  error: string | null;
  token: string | null;
}

export function CaptchaChallenge({
  onSuccess,
  onError,
  onCancel,
  challengeType,
  siteKey,
  abuseScore,
  reason,
  expiresAt
}: CaptchaChallengeProps) {
  const [state, setState] = useState<CaptchaChallengeState>({
    isLoading: true,
    isVerified: false,
    error: null,
    token: null
  });
  
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const hCaptchaRef = useRef<any>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Check if challenge is expired
  useEffect(() => {
    const checkExpiration = () => {
      const expirationTime = new Date(expiresAt);
      const currentTime = new Date();
      
      if (currentTime > expirationTime) {
        setIsExpired(true);
        setState(prev => ({
          ...prev,
          error: 'CAPTCHA challenge has expired. Please try again.',
          isLoading: false
        }));
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000); // Check every second

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Load hCaptcha script and initialize
  useEffect(() => {
    if (isExpired || challengeType !== 'hcaptcha') {
      return;
    }

    const loadHCaptcha = () => {
      // Check if hCaptcha is already loaded
      if (window.hcaptcha) {
        initializeHCaptcha();
        return;
      }

      // Load hCaptcha script
      const script = document.createElement('script');
      script.src = EXTERNAL_URLS.HCAPTCHA_SCRIPT;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.hcaptcha) {
          initializeHCaptcha();
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to load CAPTCHA service',
            isLoading: false
          }));
        }
      };

      script.onerror = () => {
        setState(prev => ({
          ...prev,
          error: 'Failed to load CAPTCHA service',
          isLoading: false
        }));
      };

      document.head.appendChild(script);
    };

    const initializeHCaptcha = () => {
      if (!captchaContainerRef.current || !window.hcaptcha) {
        return;
      }

      try {
        const id = window.hcaptcha.render(captchaContainerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: handleCaptchaSuccess,
          'expired-callback': handleCaptchaExpired,
          'error-callback': handleCaptchaError
        });

        hCaptchaRef.current = id;
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        logger.error('Failed to initialize hCaptcha', error instanceof Error ? error : { error });
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize CAPTCHA',
          isLoading: false
        }));
      }
    };

    loadHCaptcha();
  }, [challengeType, siteKey, isExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hCaptchaRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.reset(hCaptchaRef.current);
        } catch (error) {
          logger.error('Failed to cleanup hCaptcha', error instanceof Error ? error : { error });
        }
      }
    };
  }, []);

  const handleCaptchaSuccess = (token: string) => {
    setState(prev => ({
      ...prev,
      isVerified: true,
      token,
      error: null
    }));
    
    // Call success callback
    onSuccess(token);
  };

  const handleCaptchaExpired = () => {
    setState(prev => ({
      ...prev,
      isVerified: false,
      token: null,
      error: 'CAPTCHA verification expired. Please try again.'
    }));
    
    // Reset the CAPTCHA
    if (hCaptchaRef.current && window.hcaptcha) {
      try {
        window.hcaptcha.reset(hCaptchaRef.current);
      } catch (error) {
        logger.error('Failed to reset hCaptcha', error instanceof Error ? error : { error });
      }
    }
  };

  const handleCaptchaError = () => {
    setState(prev => ({
      ...prev,
      error: 'CAPTCHA verification failed. Please try again.'
    }));
  };

  const handleRetry = () => {
    if (hCaptchaRef.current && window.hcaptcha) {
      try {
        window.hcaptcha.reset(hCaptchaRef.current);
        setState(prev => ({
          ...prev,
          error: null,
          isVerified: false,
          token: null
        }));
      } catch (error) {
        logger.error('Failed to reset hCaptcha', error instanceof Error ? error : { error });
      }
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="captcha-wrapper bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security check...</p>
        </div>
      </div>
    );
  }

  // Show expired state
  if (isExpired) {
    return (
      <div className="captcha-wrapper bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">⏰</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Challenge Expired</h3>
          <p className="text-red-600 mb-4">{state.error}</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.error && !state.isVerified) {
    return (
      <div className="captcha-wrapper bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Error</h3>
          <p className="text-red-600 mb-4">{state.error}</p>
          <div className="space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (state.isVerified && state.token) {
    return (
      <div className="captcha-wrapper bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="text-green-600 text-2xl mb-2">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Verification Complete</h3>
          <p className="text-green-600 mb-4">Security check passed successfully!</p>
        </div>
      </div>
    );
  }

  // Show main CAPTCHA interface
  return (
    <div className="captcha-wrapper bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-6">
        <div className="text-blue-600 text-2xl mb-2">🛡️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Security Check Required</h3>
        <p className="text-gray-600 mb-2">
          Due to unusual activity from your IP address, we need to verify you're human.
        </p>
        <div className="text-sm text-gray-500">
          <p>Abuse Score: {abuseScore}/100</p>
          <p>Reason: {reason}</p>
          <p>Expires: {new Date(expiresAt).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <div 
          ref={captchaContainerRef} 
          className="flex justify-center"
        ></div>
      </div>

      <div className="text-center">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>This helps protect against automated abuse.</p>
        <p>Powered by hCaptcha</p>
      </div>
    </div>
  );
}

// Add hCaptcha types to window object
declare global {
  interface Window {
    hcaptcha: {
      render: (container: HTMLElement, options: any) => string;
      reset: (id: string) => void;
      getResponse: (id: string) => string;
    };
  }
}
