import { supabase } from '@/integrations/supabase/client';
import { isValidRecord, safeFilter } from '@/utils/supabaseHelpers';

export interface Profile {
  id: string;
  role: string;
  updated_at: string;
  suspended: boolean;
  full_name?: string;
  avatar_url?: string;
  profile_status?: string;
  needs_recovery?: boolean;
}

/**
 * Retrieves a user profile from the database.
 * @param userId The ID of the user to retrieve the profile for.
 * @returns A promise that resolves with the user profile, or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
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

/**
 * Fetches dealer profile data for a user
 */
export const fetchDealerProfile = async (userId: string) => {
  try {
    // First get the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Then get the dealer profile 
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dealerError && dealerError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected if dealer profile doesn't exist yet
      console.error('Error fetching dealer profile:', dealerError);
    }

    // Combine the data
    return {
      profile: profileData as Profile || null,
      dealer: dealerData || null
    };
  } catch (err) {
    console.error('Error in fetchDealerProfile:', err);
    return null;
  }
};

/**
 * Function to safely handle profile data response with type checking
 */
export const safeGetProfileData = (profileData: any): Profile => {
  // If there's an error or profileData is null, return a default profile
  if (!profileData || profileData?.error) {
    // Cast to unknown first, then to Profile to avoid direct type assertion
    return {
      id: '',
      role: 'dealer',
      updated_at: new Date().toISOString(),
      suspended: false
    };
  }

  // If it's a valid profile, return it
  return profileData as Profile;
};
