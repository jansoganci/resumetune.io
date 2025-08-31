// ================================================================
// CAPTCHA SERVICE INTEGRATION - PHASE 3.1
// ================================================================
// This service implements hCaptcha integration for abuse prevention
// Provides CAPTCHA verification and challenge management

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  challengeId?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface CaptchaChallenge {
  id: string;
  challengeType: 'hcaptcha';
  token: string;
  ipAddressHash: string;
  userId?: string;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
}

/**
 * hCaptcha service configuration
 * Environment variables required:
 * - HCAPTCHA_SECRET_KEY: Secret key from hCaptcha dashboard
 * - HCAPTCHA_SITE_KEY: Public site key for frontend
 */
export class CaptchaService {
  private readonly secretKey: string;
  private readonly siteKey: string;
  private readonly verifyUrl = 'https://hcaptcha.com/siteverify';

  constructor() {
    this.secretKey = process.env.HCAPTCHA_SECRET_KEY || '';
    this.siteKey = process.env.HCAPTCHA_SITE_KEY || '';
    
    if (!this.secretKey) {
      console.warn('HCAPTCHA_SECRET_KEY not set - CAPTCHA verification will fail');
    }
    
    if (!this.siteKey) {
      console.warn('HCAPTCHA_SITE_KEY not set - CAPTCHA frontend will not work');
    }
  }

  /**
   * Verify hCaptcha token from frontend
   */
  async verifyCaptchaToken(token: string, clientIP?: string): Promise<CaptchaVerificationResult> {
    try {
      if (!this.secretKey) {
        return {
          success: false,
          error: 'CAPTCHA service not configured'
        };
      }

      if (!token) {
        return {
          success: false,
          error: 'No CAPTCHA token provided'
        };
      }

      // Prepare verification request
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      
      if (clientIP) {
        formData.append('remoteip', clientIP);
      }

      // Send verification request to hCaptcha
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`hCaptcha API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          challengeId: result.challenge_ts,
          verifiedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        };
      } else {
        // hCaptcha verification failed
        const errorCodes = result['error-codes'] || [];
        const errorMessage = this.getErrorMessage(errorCodes);
        
        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      
      return {
        success: false,
        error: 'CAPTCHA verification failed'
      };
    }
  }

  /**
   * Get human-readable error message from hCaptcha error codes
   */
  private getErrorMessage(errorCodes: string[]): string {
    const errorMessages: Record<string, string> = {
      'missing-input-secret': 'Missing secret key',
      'invalid-input-secret': 'Invalid secret key',
      'missing-input-response': 'Missing CAPTCHA response',
      'invalid-input-response': 'Invalid CAPTCHA response',
      'bad-request': 'Bad request',
      'timeout-or-duplicate': 'CAPTCHA expired or duplicate',
      'invalid-remoteip': 'Invalid remote IP address',
      'sitekey-secret-mismatch': 'Site key and secret mismatch'
    };

    if (errorCodes.length === 0) {
      return 'Unknown CAPTCHA error';
    }

    const messages = errorCodes.map(code => errorMessages[code] || code);
    return messages.join(', ');
  }

  /**
   * Check if CAPTCHA service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.secretKey && this.siteKey);
  }

  /**
   * Get public site key for frontend
   */
  getSiteKey(): string {
    return this.siteKey;
  }

  /**
   * Generate a unique challenge ID
   */
  generateChallengeId(): string {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate CAPTCHA token format (basic validation)
   */
  validateTokenFormat(token: string): boolean {
    // hCaptcha tokens are typically long alphanumeric strings
    return !!(token && token.length > 20 && /^[a-zA-Z0-9_-]+$/.test(token));
  }
}

// Export singleton instance
export const captchaService = new CaptchaService();

/**
 * Utility function to check if CAPTCHA is required for a request
 * This will be expanded in Phase 3.2 with conditional logic
 */
export function isCaptchaRequired(abuseScore: number): boolean {
  // Basic threshold: CAPTCHA required for abuse score >= 80
  // This will be enhanced in Phase 3.2
  return abuseScore >= 80;
}

/**
 * Utility function to get CAPTCHA challenge type
 * Currently only supports hCaptcha, expandable in future
 */
export function getCaptchaChallengeType(): 'hcaptcha' {
  return 'hcaptcha';
}
