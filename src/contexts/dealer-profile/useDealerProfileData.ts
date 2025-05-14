
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "@/contexts/auth/authUtils";
import { mapDatabaseToDisplay } from "@/utils/dealer-profile-utils/mappers";
import { supabase } from "@/integrations/supabase/client";
import { checkProfileCompleteness } from "./profileUtils";
import { ProfileStatus } from "./types";
import { isValidRecord } from '@/utils/supabaseHelpers';

export interface DealerProfileData {
  id?: string;
  user_id?: string;
  dealership_name?: string;
  supervisor_name?: string;
  tax_id?: string;
  business_registry_number?: string;
  address?: string;
  verification_status?: string;
  is_verified?: boolean;
  license_number?: string;
  created_at?: string;
  updated_at?: string;
  profile_status?: string;
  needs_recovery?: boolean;
  [key: string]: any;
}

export function useDealerProfileData() {
  const [rawProfile, setRawProfile] = useState<DealerProfileData | null>(null);
  const [displayProfile, setDisplayProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [needsRecovery, setNeedsRecovery] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [profileIsComplete, setProfileIsComplete] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handler for profile recovery
  const initiateProfileRecovery = () => {
    if (!rawProfile?.user_id) {
      toast({
        title: "Error",
        description: "Cannot recover profile: missing user ID",
        variant: "destructive"
      });
      return;
    }
    
    const userData = {
      userId: rawProfile.user_id,
      recovery: true,
      email: supabase.auth.getSession().then(({ data }) => data.session?.user?.email || '')
    };
    
    navigate('/complete-registration', { state: userData });
    
    toast({
      title: "Profile Recovery Initiated",
      description: "Please complete your dealer profile information.",
    });
  };

  // Function to fetch the dealer profile
  const fetchDealerProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log("No authenticated user found when fetching dealer profile");
        setProfileStatus("not_found");
        setFetchAttempted(true);
        setMissingFields(["profile_not_found"]);
        setProfileIsComplete(false);
        setIsLoading(false);
        return;
      }
      
      // Fetch profile with the user ID from the session
      const profileData = await fetchDealerProfile(session.user.id);
      
      if (!profileData) {
        setError("Failed to fetch dealer profile. Please try again later.");
        setProfileStatus("error");
        setFetchAttempted(true);
        setMissingFields(["profile_not_found"]);
        setProfileIsComplete(false);
        setIsLoading(false);
        return;
      }
      
      // Check if the profileData is a valid dealer profile
      if (isValidRecord<DealerProfileData>(profileData)) {
        // Process the profile data and determine completeness
        setRawProfile(profileData);
        
        // Create a type-safe profile object with optional fields
        const safeProfile: DealerProfileData = {
          ...profileData,
          profile_status: profileData.profile_status || undefined,
          needs_recovery: Boolean(profileData.needs_recovery)
        };
        
        // Transform raw profile to display format if it's not a special status profile
        if (safeProfile.profile_status !== "not_found" && safeProfile.profile_status !== "incomplete") {
          setDisplayProfile(mapDatabaseToDisplay(profileData));
        }
        
        // Check profile completeness
        const { isComplete, missing } = checkProfileCompleteness(profileData);
        
        // Update state based on profile completeness
        setMissingFields(missing);
        setProfileIsComplete(isComplete);
        
        if (safeProfile.profile_status === "not_found") {
          console.log("Dealer profile not found, setting status to not_found");
          setProfileStatus("not_found");
          setNeedsRecovery(Boolean(safeProfile.needs_recovery));
        } else if (safeProfile.profile_status === "incomplete" || !isComplete) {
          console.log("Dealer profile is incomplete");
          setProfileStatus("incomplete");
          setNeedsRecovery(Boolean(safeProfile.needs_recovery));
        } else {
          setProfileStatus("complete");
        }
      } else {
        // Invalid profile data
        setError("Invalid dealer profile data format");
        setProfileStatus("error");
        setMissingFields(["invalid_profile"]);
        setProfileIsComplete(false);
      }
      
      setFetchAttempted(true);
    } catch (error) {
      console.error("Error fetching dealer profile:", error);
      setError("An unexpected error occurred while fetching your profile.");
      setProfileStatus("error");
      setFetchAttempted(true);
      setMissingFields([]);
      setProfileIsComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually refresh the profile
  const refreshProfile = async () => {
    await fetchDealerProfileData();
  };

  return {
    displayProfile,
    rawProfile,
    isLoading,
    error,
    fetchAttempted,
    profileStatus,
    needsRecovery,
    missingFields,
    profileIsComplete,
    initiateProfileRecovery,
    refreshProfile,
    fetchDealerProfileData
  };
}
