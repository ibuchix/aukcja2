
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeFilter, isValidRecord } from '@/utils/supabaseHelpers';
import { DealerProfileData } from '@/types/dealer';
import { Profile } from '@/types/profile';
import { getProfileStatus, checkProfileNeedsRecovery } from './profileUtils';

export const useDealerProfileData = (userId: string | null | undefined) => {
  const [profileData, setProfileData] = useState<DealerProfileData | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [needsRecovery, setNeedsRecovery] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user profile to check status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          throw new Error(`Error fetching user profile: ${profileError.message}`);
        }

        // Get profile status
        if (profileData && isValidRecord<Profile>(profileData)) {
          const profile = profileData as Profile;
          setProfileStatus(profile.profile_status || 'inactive');
          setNeedsRecovery(profile.needs_recovery || false);
        }

        // Fetch dealer profile
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (dealerError && dealerError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is expected if profile doesn't exist yet
          throw new Error(`Error fetching dealer profile: ${dealerError.message}`);
        }

        if (dealerData && isValidRecord<DealerProfileData>(dealerData)) {
          setProfileData(dealerData as DealerProfileData);
          
          // Set profile status based on dealer data
          const status = getProfileStatus(dealerData as DealerProfileData);
          setProfileStatus(status);
          
          // Check if profile needs recovery
          const needsRecovery = checkProfileNeedsRecovery(dealerData as DealerProfileData);
          setNeedsRecovery(needsRecovery);
        } else {
          // No dealer profile found
          setProfileStatus('not_found');
          setNeedsRecovery(true);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error in useDealerProfileData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const updateProfileData = async (data: Partial<DealerProfileData>) => {
    if (!profileData || !profileData.id) {
      setError('Cannot update: No profile data available');
      return { success: false, error: 'No profile data available' };
    }

    try {
      const { error } = await supabase
        .from('dealers')
        .update(data)
        .eq('id', profileData.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const updateProfileStatus = async (status: string) => {
    if (!userId) {
      setError('Cannot update: No user ID available');
      return { success: false, error: 'No user ID available' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_status: status })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setProfileStatus(status);
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile status';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return {
    profileData,
    profileStatus,
    needsRecovery,
    loading,
    error,
    updateProfileData,
    updateProfileStatus,
  };
};
