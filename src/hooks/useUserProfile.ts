// ================================================================
// USE USER PROFILE HOOK
// ================================================================
// React hook for managing user profile with Supabase

import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  saveUserProfile as saveProfileService,
  updateUserProfile as updateProfileService,
  getOnboardingStatus,
  skipOnboarding as skipOnboardingService,
  deleteAllUserData,
  downloadUserDataExport,
} from '../services/profileService';
import {
  UserProfileDB,
  OnboardingFormData,
  UserProfileUpdate,
  OnboardingStatus,
} from '../types/onboarding';
import { useToast } from '../components/ToastProvider';

interface UseUserProfileReturn {
  // State
  profile: UserProfileDB | null;
  onboardingStatus: OnboardingStatus | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (formData: OnboardingFormData) => Promise<boolean>;
  updateProfile: (updates: UserProfileUpdate) => Promise<boolean>;
  skipOnboarding: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  exportData: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

/**
 * Hook for managing user profile and onboarding
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfileDB | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  /**
   * Load user profile from database
   */
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await getUserProfile();

      if (profileError) {
        setError(profileError);
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (err) {
      setError(err as Error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh onboarding status
   */
  const refreshOnboardingStatus = useCallback(async () => {
    try {
      const status = await getOnboardingStatus();
      setOnboardingStatus(status);
    } catch (err) {
      console.error('Failed to refresh onboarding status:', err);
    }
  }, []);

  /**
   * Save user profile (onboarding completion)
   */
  const saveProfile = useCallback(
    async (formData: OnboardingFormData): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: saveError } = await saveProfileService(formData);

        if (saveError) {
          setError(saveError);
          toast.error(`Failed to save profile: ${saveError.message}`);
          return false;
        }

        setProfile(data);
        await refreshOnboardingStatus();
        toast.success('Profile saved successfully!');
        return true;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(`Failed to save profile: ${error.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, refreshOnboardingStatus]
  );

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: UserProfileUpdate): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await updateProfileService(updates);

        if (updateError) {
          setError(updateError);
          toast.error(`Failed to update profile: ${updateError.message}`);
          return false;
        }

        setProfile(data);
        toast.success('Profile updated successfully!');
        return true;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(`Failed to update profile: ${error.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  /**
   * Skip onboarding
   */
  const skipOnboarding = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: skipError } = await skipOnboardingService();

      if (skipError) {
        setError(skipError);
        toast.error(`Failed to skip onboarding: ${skipError.message}`);
        return false;
      }

      await refreshOnboardingStatus();
      toast.success('Onboarding skipped. You can complete it anytime from your profile.');
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to skip onboarding: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshOnboardingStatus]);

  /**
   * Delete user account (GDPR)
   */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This will permanently delete all your data and cannot be undone.'
    );

    if (!confirmed) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await deleteAllUserData();

      if (deleteError) {
        setError(deleteError);
        toast.error(`Failed to delete account: ${deleteError.message}`);
        return false;
      }

      toast.success('Account deleted successfully. Goodbye! 👋');
      // User will be redirected by auth state change
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to delete account: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Export user data (GDPR)
   */
  const exportData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await downloadUserDataExport();
      toast.success('Data exported successfully! Check your downloads.');
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load profile and onboarding status on mount
  useEffect(() => {
    loadProfile();
    refreshOnboardingStatus();
  }, [loadProfile, refreshOnboardingStatus]);

  return {
    profile,
    onboardingStatus,
    isLoading,
    error,
    loadProfile,
    saveProfile,
    updateProfile,
    skipOnboarding,
    deleteAccount,
    exportData,
    refreshOnboardingStatus,
  };
}
