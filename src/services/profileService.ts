// ================================================================
// PROFILE SERVICE
// ================================================================
// Supabase operations for user profiles and onboarding

import { supabase } from '../config/supabase';
import {
  UserProfileDB,
  UserProfileInsert,
  UserProfileUpdate,
  OnboardingFormData,
  ProfileServiceResponse,
  OnboardingStatus,
} from '../types/onboarding';

/**
 * Get user's profile from database
 */
export async function getUserProfile(
  userId?: string
): Promise<ProfileServiceResponse<UserProfileDB>> {
  try {
    // If no userId provided, use current authenticated user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable)
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Check if user has a profile
 */
export async function hasUserProfile(userId?: string): Promise<boolean> {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }

    const { data } = await supabase.rpc('has_user_profile', { p_user_id: userId });
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Get onboarding status for current user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        hasProfile: false,
        onboardingCompleted: false,
        onboardingSkipped: false,
        needsOnboarding: true,
      };
    }

    const { data: profile } = await getUserProfile(user.id);

    if (!profile) {
      return {
        hasProfile: false,
        onboardingCompleted: false,
        onboardingSkipped: false,
        needsOnboarding: true,
      };
    }

    return {
      hasProfile: true,
      onboardingCompleted: profile.onboarding_completed,
      onboardingSkipped: profile.onboarding_skipped,
      needsOnboarding: !profile.onboarding_completed && !profile.onboarding_skipped,
    };
  } catch {
    return {
      hasProfile: false,
      onboardingCompleted: false,
      onboardingSkipped: false,
      needsOnboarding: true,
    };
  }
}

/**
 * Save user profile (create or update)
 */
export async function saveUserProfile(
  formData: OnboardingFormData
): Promise<ProfileServiceResponse<UserProfileDB>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const profileData: UserProfileInsert = {
      user_id: user.id,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || null,
      current_position: formData.currentPosition.trim(),
      linkedin_url: formData.linkedinUrl?.trim() || null,
      portfolio_url: formData.portfolioUrl?.trim() || null,
      github_url: formData.githubUrl?.trim() || null,
      city: formData.city?.trim() || null,
      country: formData.country?.trim() || null,
      data_consent: formData.dataConsent,
      data_consent_date: formData.dataConsent ? new Date().toISOString() : undefined,
      marketing_consent: formData.marketingConsent,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_skipped: false,
    };

    // Upsert: insert or update if exists
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: UserProfileUpdate
): Promise<ProfileServiceResponse<UserProfileDB>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark onboarding as completed (called via RPC function)
 */
export async function completeOnboarding(): Promise<ProfileServiceResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase.rpc('complete_onboarding', {
      p_user_id: user.id,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Mark onboarding as skipped
 */
export async function skipOnboarding(): Promise<ProfileServiceResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase.rpc('skip_onboarding', {
      p_user_id: user.id,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * GDPR: Export all user data as JSON
 */
export async function exportUserData(): Promise<ProfileServiceResponse<Record<string, unknown>>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase.rpc('export_user_data', {
      p_user_id: user.id,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data as Record<string, unknown>, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * GDPR: Delete all user data (irreversible!)
 */
export async function deleteAllUserData(): Promise<ProfileServiceResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase.rpc('delete_all_user_data', {
      p_user_id: user.id,
    });

    if (error) {
      return { data: null, error };
    }

    // After deleting data, sign out the user
    await supabase.auth.signOut();

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Download user data as JSON file (GDPR export)
 */
export async function downloadUserDataExport(): Promise<void> {
  const { data, error } = await exportUserData();

  if (error || !data) {
    throw new Error('Failed to export user data');
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resumetune-data-export-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
