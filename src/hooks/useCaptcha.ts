// ================================================================
// CAPTCHA HOOK - PHASE 3.3
// ================================================================
// This hook provides CAPTCHA state management and verification flow
// Integrates with the backend CAPTCHA service

import { useState, useCallback } from 'react';

export interface CaptchaChallenge {
  challengeId: string;
  challengeType: 'hcaptcha';
  siteKey: string;
  expiresAt: string;
  abuseScore: number;
}

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  challengeId: string;
  verifiedAt: string;
  expiresAt: string;
}

export interface UseCaptchaReturn {
  // State
  isCaptchaRequired: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  error: string | null;
  challenge: CaptchaChallenge | null;
  
  // Actions
  checkCaptchaRequirement: () => Promise<boolean>;
  createChallenge: () => Promise<CaptchaChallenge | null>;
  verifyCaptcha: (token: string) => Promise<boolean>;
  resetCaptcha: () => void;
  cancelCaptcha: () => void;
}

export function useCaptcha(): UseCaptchaReturn {
  const [isCaptchaRequired, setIsCaptchaRequired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);

  // Check if CAPTCHA is required for the current user/IP
  const checkCaptchaRequirement = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Call the consolidated CAPTCHA API to check requirement
      const response = await fetch('/api/captcha?action=check-requirement', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check CAPTCHA requirement');
      }

      const result = await response.json();
      setIsCaptchaRequired(result.captchaRequired);
      
      return result.captchaRequired;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('CAPTCHA requirement check failed:', err);
      return false;
    }
  }, []);

  // Create a new CAPTCHA challenge
  const createChallenge = useCallback(async (): Promise<CaptchaChallenge | null> => {
    try {
      setError(null);
      setIsVerifying(true);
      
      // Call the consolidated CAPTCHA API to create challenge
      const response = await fetch('/api/captcha?action=create-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create CAPTCHA challenge');
      }

      const challengeData: CaptchaChallenge = await response.json();
      setChallenge(challengeData);
      setIsCaptchaRequired(true);
      
      return challengeData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('CAPTCHA challenge creation failed:', err);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Verify CAPTCHA token
  const verifyCaptcha = useCallback(async (token: string): Promise<boolean> => {
    if (!challenge) {
      setError('No active CAPTCHA challenge');
      return false;
    }

    try {
      setError(null);
      setIsVerifying(true);
      
      // Call the consolidated CAPTCHA API to verify
      const response = await fetch('/api/captcha?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          challengeId: challenge.challengeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'CAPTCHA verification failed');
      }

      const result: CaptchaVerificationResult = await response.json();
      
      if (result.success) {
        setIsVerified(true);
        setIsCaptchaRequired(false);
        setError(null);
        return true;
      } else {
        setError(result.error || 'Verification failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('CAPTCHA verification failed:', err);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [challenge]);

  // Reset CAPTCHA state
  const resetCaptcha = useCallback(() => {
    setIsCaptchaRequired(false);
    setIsVerifying(false);
    setIsVerified(false);
    setError(null);
    setChallenge(null);
  }, []);

  // Cancel CAPTCHA
  const cancelCaptcha = useCallback(() => {
    setIsCaptchaRequired(false);
    setIsVerifying(false);
    setError(null);
    setChallenge(null);
  }, []);

  return {
    // State
    isCaptchaRequired,
    isVerifying,
    isVerified,
    error,
    challenge,
    
    // Actions
    checkCaptchaRequirement,
    createChallenge,
    verifyCaptcha,
    resetCaptcha,
    cancelCaptcha,
  };
}
