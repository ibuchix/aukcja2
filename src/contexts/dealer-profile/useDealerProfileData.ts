
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
      // First try using the security definer function (bypasses RLS)
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_dealer_by_user_id', { p_user_id: userId });
        
        if (!rpcError && rpcData) {
          console.log("[Dealer Profile] RPC returned data:", rpcData);
          
          // The RPC function returns snake_case data, so we need to transform it
          const transformedData = {
            id: rpcData.id,
            userId: rpcData.user_id,
            supervisorName: rpcData.supervisor_name,
            dealershipName: rpcData.dealership_name,
            address: rpcData.address,
            licenseNumber: rpcData.license_number,
            taxId: rpcData.tax_id,
            businessRegistryNumber: rpcData.business_registry_number,
            verificationStatus: rpcData.verification_status,
            isVerified: rpcData.is_verified,
            createdAt: rpcData.created_at,
            updatedAt: rpcData.updated_at,
            // Handle potential additional fields
            needsRecovery: rpcData.needs_recovery || false
          };
          
          setProfileData(transformedData as DealerProfileData);
          setProfileStatus(transformedData.verificationStatus || 'pending');
          setNeedsRecovery(transformedData.needsRecovery);
          setLoading(false);
          return;
        } else if (rpcError) {
          console.warn('Could not fetch dealer profile using RPC, falling back to direct query', rpcError);
        }
      } catch (rpcErr) {
        console.error('Error with RPC method:', rpcErr);
        // Continue to fallback
      }

      // If RPC failed or returned invalid data, fallback to direct query
      const { data, error: queryError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No profile found - this is expected if the profile doesn't exist yet
          setProfileData(null);
          setProfileStatus('not_found');
          setNeedsRecovery(true);
          return;
        }
        throw new Error(`Failed to fetch dealer profile: ${queryError.message}`);
      }

      if (data && isValidRecord<DealerProfileData>(data)) {
        // Enhanced client should have already transformed this data
        setProfileData(data as DealerProfileData);
        
        const status = isValidRecord(data) && 
          'verificationStatus' in data ? 
          data.verificationStatus as string : 'pending';
        
        setProfileStatus(status);
        
        const recoveryNeeded = isValidRecord(data) && 
          'needsRecovery' in data ? 
          Boolean(data.needsRecovery) : false;
        
        setNeedsRecovery(recoveryNeeded);
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

      if (isValidRecord<DealerProfileData>(data)) {
        setProfileData(data as DealerProfileData);
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
      setProfileStatus(profileData?.verificationStatus || 'unknown');
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
