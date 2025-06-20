
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
        
        if (!rpcError && rpcData && typeof rpcData === 'object' && !Array.isArray(rpcData)) {
          console.log("[Dealer Profile] RPC returned data:", rpcData);
          
          // Convert the RPC data to match DealerProfileData interface (snake_case)
          const transformedData: DealerProfileData = {
            id: (rpcData as any).id || '',
            user_id: (rpcData as any).user_id || (rpcData as any).userId || '',
            supervisor_name: (rpcData as any).supervisor_name || (rpcData as any).supervisorName || '',
            dealership_name: (rpcData as any).dealership_name || (rpcData as any).dealershipName || '',
            address: (rpcData as any).address || '',
            license_number: (rpcData as any).license_number || (rpcData as any).licenseNumber || '',
            tax_id: (rpcData as any).tax_id || (rpcData as any).taxId || '',
            business_registry_number: (rpcData as any).business_registry_number || (rpcData as any).businessRegistryNumber || '',
            verification_status: (rpcData as any).verification_status || (rpcData as any).verificationStatus || 'pending',
            is_verified: (rpcData as any).is_verified || (rpcData as any).isVerified || false,
            created_at: (rpcData as any).created_at || (rpcData as any).createdAt || '',
            updated_at: (rpcData as any).updated_at || (rpcData as any).updatedAt || '',
            needs_recovery: (rpcData as any).needs_recovery || (rpcData as any).needsRecovery || false
          };
          
          setProfileData(transformedData);
          setProfileStatus(transformedData.verification_status || 'pending');
          setNeedsRecovery(transformedData.needs_recovery || false);
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
          'verification_status' in data ? 
          data.verification_status as string : 'pending';
        
        setProfileStatus(status);
        
        const recoveryNeeded = isValidRecord(data) && 
          'needs_recovery' in data ? 
          Boolean(data.needs_recovery) : false;
        
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
