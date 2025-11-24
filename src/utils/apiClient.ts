import { supabase } from '../config/supabase';

/**
 * Get authentication headers for API requests
 * Returns Authorization header with JWT token for authenticated users
 * Returns x-user-id header with anonymous ID for anonymous users
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Authenticated user - send JWT token
      headers['Authorization'] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch (error) {
    console.warn('Failed to get session:', error);
  }

  // Anonymous user - send anonymous ID
  let anonId = localStorage.getItem('anon-id');
  if (!anonId) {
    // Generate new anonymous ID
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('anon-id', anonId);
  }
  headers['x-user-id'] = anonId;

  return headers;
}

/**
 * Get current user ID (authenticated or anonymous)
 * Useful for tracking and analytics
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    console.warn('Failed to get user ID:', error);
  }

  // Return anonymous ID
  let anonId = localStorage.getItem('anon-id');
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('anon-id', anonId);
  }
  return anonId;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    return false;
  }
}
