
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
  initiateProfileRecovery: () => void;
  refreshProfile: () => Promise<void>;
};

// Create context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  displayProfile: null,
  rawProfile: null,
  isLoading: true,
  error: null,
  fetchAttempted: false,
  profileStatus: "loading",
  needsRecovery: false,
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
        return;
      }
      
      // Fetch profile with the user ID from the session
      const profileData = await fetchDealerProfile(session.user.id);
      
      if (!profileData) {
        setError("Failed to fetch dealer profile. Please try again later.");
        setProfileStatus("error");
        setFetchAttempted(true);
        return;
      }
      
      // Handle profile statuses
      if (profileData.profile_status === "not_found") {
        console.log("Dealer profile not found, setting status to not_found");
        setProfileStatus("not_found");
        setNeedsRecovery(Boolean(profileData.needs_recovery));
        setRawProfile(profileData);
      } else if (profileData.profile_status === "incomplete") {
        console.log("Dealer profile is incomplete, setting status to incomplete");
        setProfileStatus("incomplete");
        setNeedsRecovery(Boolean(profileData.needs_recovery));
        setRawProfile(profileData);
      } else {
        // Set profile data and status to complete
        setRawProfile(profileData);
        setDisplayProfile(mapDatabaseToDisplay(profileData));
        setProfileStatus("complete");
      }
      
      setFetchAttempted(true);
    } catch (error) {
      console.error("Error fetching dealer profile:", error);
      setError("An unexpected error occurred while fetching your profile.");
      setProfileStatus("error");
      setFetchAttempted(true);
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
        initiateProfileRecovery,
        refreshProfile
      }}
    >
      {children}
    </DealerProfileContext.Provider>
  );
};

export const useDealerProfile = () => useContext(DealerProfileContext);
