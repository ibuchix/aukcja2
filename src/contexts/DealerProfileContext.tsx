
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "@/contexts/auth/authUtils";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";
import { supabase } from "@/integrations/supabase/client";

// Profile status types
type ProfileStatus = "loading" | "complete" | "not_found" | "incomplete" | "error";

// Context type definition
type DealerProfileContextType = {
  displayProfile: any | null;
  rawProfile: any | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  profileStatus: ProfileStatus;
  needsRecovery: boolean;
  missingFields: string[];
  profileIsComplete: boolean;
  initiateProfileRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

// Required fields for a complete profile
const REQUIRED_PROFILE_FIELDS = [
  'supervisor_name', 
  'dealership_name', 
  'tax_id', 
  'business_registry_number', 
  'address'
];

// Create context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  displayProfile: null,
  rawProfile: null,
  isLoading: true,
  error: null,
  fetchAttempted: false,
  profileStatus: "loading",
  needsRecovery: false,
  missingFields: [],
  profileIsComplete: false,
  initiateProfileRecovery: () => {},
  refreshProfile: async () => {},
});

export const DealerProfileProvider = ({ children }: { children: ReactNode }) => {
  const [rawProfile, setRawProfile] = useState<any>(null);
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

  // Fetch dealer profile on context init
  useEffect(() => {
    fetchDealerProfileData();
  }, []);

  // Handler for profile recovery
  const initiateProfileRecovery = () => {
    const userData = {
      userId: rawProfile?.user_id,
      recovery: true,
      email: supabase.auth.getSession().then(({ data }) => data.session?.user?.email || '')
    };
    
    navigate('/complete-registration', { state: userData });
    
    toast({
      title: "Profile Recovery Initiated",
      description: "Please complete your dealer profile information.",
    });
  };

  // Check if a profile is complete based on required fields
  const checkProfileCompleteness = (profileData: any): { isComplete: boolean, missing: string[] } => {
    if (!profileData) {
      return { isComplete: false, missing: ["profile_not_found"] };
    }

    // Special case for profile_status explicitly set by backend
    if (profileData.profile_status === "not_found") {
      return { isComplete: false, missing: ["profile_not_found"] };
    }
    
    if (profileData.profile_status === "incomplete") {
      // Use missing_fields if provided by the backend
      const missing = Array.isArray(profileData.missing_fields) ? profileData.missing_fields : [];
      return { isComplete: false, missing };
    }

    // For normal profiles, check required fields
    const missing = REQUIRED_PROFILE_FIELDS.filter(field => {
      const value = profileData[field];
      return value === undefined || value === null || value === '';
    });

    return { isComplete: missing.length === 0, missing };
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
      
      // Process the profile data and determine completeness
      setRawProfile(profileData);
      
      // Transform raw profile to display format if it's not a special status profile
      if (profileData.profile_status !== "not_found" && profileData.profile_status !== "incomplete") {
        setDisplayProfile(mapDatabaseToDisplay(profileData));
      }
      
      // Check profile completeness
      const { isComplete, missing } = checkProfileCompleteness(profileData);
      
      // Update state based on profile completeness
      setMissingFields(missing);
      setProfileIsComplete(isComplete);
      
      if (profileData.profile_status === "not_found") {
        console.log("Dealer profile not found, setting status to not_found");
        setProfileStatus("not_found");
        setNeedsRecovery(Boolean(profileData.needs_recovery));
      } else if (profileData.profile_status === "incomplete" || !isComplete) {
        console.log("Dealer profile is incomplete");
        setProfileStatus("incomplete");
        setNeedsRecovery(Boolean(profileData.needs_recovery));
      } else {
        setProfileStatus("complete");
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

  return (
    <DealerProfileContext.Provider
      value={{
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
        refreshProfile
      }}
    >
      {children}
    </DealerProfileContext.Provider>
  );
};

export const useDealerProfile = () => useContext(DealerProfileContext);
