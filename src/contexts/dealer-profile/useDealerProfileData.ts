import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerProfileData } from "./types";
import { isValidRecord, isSelectQueryError } from "@/utils/supabaseHelpers";

interface UseDealerProfileDataReturn {
  profileData: DealerProfileData | null;
  profileStatus: string;
  needsRecovery: boolean;
  loading: boolean;
  error: string | null;
  updateProfileData: (updates: Partial<DealerProfileData>) => Promise<void>;
  updateProfileStatus: (status: string) => Promise<void>;
}

export const useDealerProfileData = (userId: string | undefined): UseDealerProfileDataReturn => {
  const [profileData, setProfileData] = useState<DealerProfileData | null>(null);
  const [profileStatus, setProfileStatus] = useState<string>('not_fetched');
  const [needsRecovery, setNeedsRecovery] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      console.log("No user ID provided, skipping profile fetch.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch dealer profile
      const { data: dealerProfile, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dealerError) {
        if (dealerError.code === 'PGRST116') {
          // No profile found - this is expected if the profile doesn't exist yet
          setProfileData(null);
          setProfileStatus('not_found');
          setNeedsRecovery(true);
          return;
        }
        throw new Error(`Failed to fetch dealer profile: ${dealerError.message}`);
      }

      if (dealerProfile && isValidRecord(dealerProfile)) {
        setProfileData(dealerProfile);
        // Use a type guard to check if verification_status exists
        const status = typeof dealerProfile === 'object' && dealerProfile !== null &&
          'verification_status' in dealerProfile ? 
          dealerProfile.verification_status as string : 'pending';
        
        setProfileStatus(status);
        
        // Use a type guard for needs_recovery as well
        const needsRecoveryValue = typeof dealerProfile === 'object' && dealerProfile !== null &&
          'needs_recovery' in dealerProfile ? 
          Boolean(dealerProfile.needs_recovery) : false;
        
        setNeedsRecovery(needsRecoveryValue);
      } else {
        setProfileData(null);
        setProfileStatus('incomplete');
        setNeedsRecovery(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setProfileStatus('error');
      console.error("Error fetching dealer profile:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const updateProfileData = async (updates: Partial<DealerProfileData>) => {
    if (!userId) {
      setError("User ID is missing, cannot update profile.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('dealers')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update dealer profile: ${error.message}`);
      }

      if (isValidRecord(data)) {
        setProfileData(data);
      } else {
        console.warn("Invalid data returned after profile update.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error("Error updating dealer profile:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileStatus = async (status: string) => {
    if (!userId) {
      setError("User ID is missing, cannot update profile status.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Optimistically update local state
      setProfileStatus(status);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('dealers')
        .update({ verification_status: status })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile status: ${updateError.message}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error("Error updating profile status:", errorMessage);
      // Revert to previous status on error
      setProfileStatus(profileData?.verification_status || 'unknown');
    } finally {
      setLoading(false);
    }
  };

  return {
    profileData,
    profileStatus,
    needsRecovery,
    loading,
    error,
    updateProfileData,
    updateProfileStatus
  };
};
