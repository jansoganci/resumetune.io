// ================================================================
// ONBOARDING TYPES
// ================================================================
// TypeScript interfaces for onboarding flow and user profiles

/**
 * Onboarding form data collected during the flow
 */
export interface OnboardingFormData {
  // Basic Info (Step 2)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Professional Info (Step 3)
  currentPosition: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  city?: string;
  country?: string;

  // Privacy (Step 4)
  dataConsent: boolean;
  marketingConsent: boolean;
}

/**
 * Partial form data for individual steps
 */
export interface BasicInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ProfessionalInfoData {
  currentPosition: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  city?: string;
  country?: string;
}

export interface PrivacyConsentData {
  dataConsent: boolean;
  marketingConsent: boolean;
}

/**
 * Onboarding step types
 */
export type OnboardingStep = 'welcome' | 'basic' | 'professional' | 'privacy' | 'complete';

/**
 * User profile as stored in database
 */
export interface UserProfileDB {
  id: string;
  user_id: string;

  // Essential Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  current_position: string;

  // Optional Professional Links
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;

  // Location
  city: string | null;
  country: string | null;

  // Profile Content
  professional_summary: string | null;

  // Privacy
  data_consent: boolean;
  data_consent_date: string | null;
  marketing_consent: boolean;

  // Metadata
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped: boolean;
  created_at: string;
  updated_at: string;

  // GDPR
  data_retention_acknowledged: boolean;
  last_activity_at: string;
}

/**
 * User profile insert/update payload
 */
export interface UserProfileInsert {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  current_position: string;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  city?: string | null;
  country?: string | null;
  professional_summary?: string | null;
  data_consent: boolean;
  data_consent_date?: string;
  marketing_consent: boolean;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  onboarding_skipped?: boolean;
}

/**
 * User profile update payload (all fields optional)
 */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  current_position?: string;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  city?: string | null;
  country?: string | null;
  professional_summary?: string | null;
  data_consent?: boolean;
  marketing_consent?: boolean;
  onboarding_completed?: boolean;
}

/**
 * Validation error map
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * API response types
 */
export interface ProfileServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface OnboardingStatus {
  hasProfile: boolean;
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
  needsOnboarding: boolean;
}
