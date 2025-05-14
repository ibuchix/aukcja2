import { supabase } from '@/integrations/supabase/client';
import { isValidRecord, safeFilter } from '@/utils/supabaseHelpers';
import { Profile } from '@/types/profile';

/**
 * Retrieves a user profile from the database.
 * @param userId The ID of the user to retrieve the profile for.
 * @returns A promise that resolves with the user profile, or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!isValidRecord(data)) {
      console.warn('Invalid user profile data:', data);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
};

/**
 * Signs out the current user
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sign out' 
    };
  }
};

/**
 * Refreshes the user session
 */
export const refreshUserSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    
    return { 
      success: true, 
      session: data.session, 
      user: data.user 
    };
  } catch (error) {
    console.error('Session refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh session' 
    };
  }
};
