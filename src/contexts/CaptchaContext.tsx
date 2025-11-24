// ================================================================
// CAPTCHA CONTEXT - PHASE 3.3
// ================================================================
// This context provides CAPTCHA state management across the application
// Integrates with useCaptcha hook and abuse protection system

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useCaptcha, CaptchaChallenge } from '../hooks/useCaptcha';

export interface CaptchaContextType {
  // State from useCaptcha hook
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
  
  // Global CAPTCHA state
  showCaptchaModal: boolean;
  openCaptchaModal: () => void;
  closeCaptchaModal: () => void;
  
  // CAPTCHA bypass state
  bypassAttempts: number;
  maxBypassAttempts: number;
  canBypass: boolean;
  attemptBypass: () => Promise<boolean>;
}

const CaptchaContext = createContext<CaptchaContextType | undefined>(undefined);

export function useCaptchaContext(): CaptchaContextType {
  const context = useContext(CaptchaContext);
  if (context === undefined) {
    throw new Error('useCaptchaContext must be used within a CaptchaProvider');
  }
  return context;
}

interface CaptchaProviderProps {
  children: ReactNode;
  maxBypassAttempts?: number;
}

export function CaptchaProvider({ 
  children, 
  maxBypassAttempts = 3 
}: CaptchaProviderProps) {
  // Use the useCaptcha hook for core functionality
  const captchaHook = useCaptcha();
  
  // Global CAPTCHA modal state
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  
  // CAPTCHA bypass state
  const [bypassAttempts, setBypassAttempts] = useState(0);
  const canBypass = bypassAttempts < maxBypassAttempts;

  // Open CAPTCHA modal
  const openCaptchaModal = useCallback(() => {
    setShowCaptchaModal(true);
  }, []);

  // Close CAPTCHA modal
  const closeCaptchaModal = useCallback(() => {
    setShowCaptchaModal(false);
  }, []);

  // Attempt CAPTCHA bypass
  const attemptBypass = useCallback(async (): Promise<boolean> => {
    if (!canBypass) {
      return false;
    }

    try {
      // Call consolidated CAPTCHA API for bypass
      const response = await fetch('/api/captcha?action=bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Bypass successful
          setBypassAttempts(prev => prev + 1);
          captchaHook.resetCaptcha();
          closeCaptchaModal();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      import('../utils/logger').then(({ logger }) => {
        logger.error('CAPTCHA bypass attempt failed', error instanceof Error ? error : { error });
      }).catch(() => {});
      return false;
    }
  }, [canBypass, captchaHook, closeCaptchaModal]);

  // Enhanced createChallenge that opens modal
  const createChallenge = useCallback(async (): Promise<CaptchaChallenge | null> => {
    const challenge = await captchaHook.createChallenge();
    if (challenge) {
      openCaptchaModal();
    }
    return challenge;
  }, [captchaHook, openCaptchaModal]);

  // Enhanced verifyCaptcha that closes modal on success
  const verifyCaptcha = useCallback(async (token: string): Promise<boolean> => {
    const success = await captchaHook.verifyCaptcha(token);
    if (success) {
      closeCaptchaModal();
    }
    return success;
  }, [captchaHook, closeCaptchaModal]);

  // Enhanced resetCaptcha that closes modal
  const resetCaptcha = useCallback(() => {
    captchaHook.resetCaptcha();
    closeCaptchaModal();
    setBypassAttempts(0);
  }, [captchaHook, closeCaptchaModal]);

  // Enhanced cancelCaptcha that closes modal
  const cancelCaptcha = useCallback(() => {
    captchaHook.cancelCaptcha();
    closeCaptchaModal();
  }, [captchaHook, closeCaptchaModal]);

  const contextValue: CaptchaContextType = {
    // State from useCaptcha hook
    isCaptchaRequired: captchaHook.isCaptchaRequired,
    isVerifying: captchaHook.isVerifying,
    isVerified: captchaHook.isVerified,
    error: captchaHook.error,
    challenge: captchaHook.challenge,
    
    // Actions
    checkCaptchaRequirement: captchaHook.checkCaptchaRequirement,
    createChallenge,
    verifyCaptcha,
    resetCaptcha,
    cancelCaptcha,
    
    // Global CAPTCHA state
    showCaptchaModal,
    openCaptchaModal,
    closeCaptchaModal,
    
    // CAPTCHA bypass state
    bypassAttempts,
    maxBypassAttempts,
    canBypass,
    attemptBypass,
  };

  return (
    <CaptchaContext.Provider value={contextValue}>
      {children}
    </CaptchaContext.Provider>
  );
}
