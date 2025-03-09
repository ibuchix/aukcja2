
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";
import { fetchDealerProfile } from "@/contexts/auth/authUtils";
import { Json } from "@/integrations/supabase/types";

// Define the dealer profile type
export type DealerProfile = {
  id: string;
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  address: string;
  tax_id: string;
  business_registry_number: string;
  license_number: string;
  verification_status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile_status?: string;
};

// Define the display profile type which uses frontend-friendly field names
export type DisplayProfile = {
  supervisorName: string;
  dealershipName: string;
  taxId: string;
  businessRegistryNumber: string;
  address: string;
  licenseNumber: string;
  verificationStatus: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Add formatted display versions of fields
  formattedTaxId?: string;
  formattedBusinessRegistry?: string;
};

// Define the context type
type DealerProfileContextType = {
  profile: DealerProfile | null;
  displayProfile: DisplayProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  refetchProfile: () => Promise<void>;
  profileIsComplete: boolean;
  missingFields: string[];
  profileStatus: string;
};

// Create the context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  profile: null,
  displayProfile: null,
  isLoading: false,
  error: null,
  fetchAttempted: false,
  refetchProfile: async () => {},
  profileIsComplete: false,
  missingFields: [],
  profileStatus: "unknown",
});

// Create a provider component
export function DealerProfileProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: User | null;
}) {
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [displayProfile, setDisplayProfile] = useState<DisplayProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const [profileIsComplete, setProfileIsComplete] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [profileStatus, setProfileStatus] = useState<string>("unknown");
  const { toast } = useToast();

  // Function to check if a dealer profile is complete
  const checkProfileCompleteness = (data: any) => {
    const requiredFields = [
      'supervisor_name', 
      'dealership_name', 
      'tax_id', 
      'business_registry_number', 
      'address'
    ];
    
    const missing = requiredFields.filter(field => !data[field]);
    setMissingFields(missing);
    
    if (missing.length === 0) {
      console.log("Profile is complete with all required fields");
      setProfileIsComplete(true);
      return true;
    } else {
      console.warn("Profile is incomplete. Missing fields:", missing);
      setProfileIsComplete(false);
      return false;
    }
  };

  // Function to fetch dealer profile using our shared utility function
  const fetchProfile = async (retryCount = 0) => {
    if (!user) {
      setIsLoading(false);
      setFetchAttempted(true);
      setProfileStatus("no_user");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching dealer profile for user:", user.id);
      
      // Use our improved fetchDealerProfile function
      const dealerProfile = await fetchDealerProfile(user.id);
      
      if (dealerProfile) {
        // Check for special profile status
        if (dealerProfile.profile_status === "not_found") {
          console.log("No dealer profile found for user");
          setProfile(null);
          setDisplayProfile(null);
          setProfileStatus("not_found");
          setProfileIsComplete(false);
          setMissingFields(['profile_not_found']);
        } else {
          console.log("Dealer profile fetched successfully");
          setProfile(dealerProfile as DealerProfile);
          setProfileStatus("found");
          
          // Check profile completeness
          checkProfileCompleteness(dealerProfile);
          
          // Transform the database profile to display format
          const transformedProfile = mapDatabaseToDisplay(dealerProfile);
          setDisplayProfile(transformedProfile);
        }
      } else {
        console.log("No dealer profile found for user");
        setProfile(null);
        setDisplayProfile(null);
        setProfileStatus("error");
        setProfileIsComplete(false);
        setMissingFields(['profile_not_found']);
      }
    } catch (err) {
      console.error("Error fetching dealer profile:", err);
      setProfileStatus("error");
      
      // Implement retry logic
      if (retryCount < 2) {
        console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchProfile(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(err instanceof Error ? err.message : "Unknown error loading profile");
      
      toast({
        title: "Error loading profile",
        description: "There was a problem loading your dealer profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setFetchAttempted(true);
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setDisplayProfile(null);
      setIsLoading(false);
      setFetchAttempted(true);
      setProfileIsComplete(false);
      setMissingFields([]);
      setProfileStatus("no_user");
    }
  }, [user?.id]);

  // Refetch profile function - can be called manually
  const refetchProfile = async () => {
    await fetchProfile();
  };

  return (
    <DealerProfileContext.Provider
      value={{
        profile,
        displayProfile,
        isLoading,
        error,
        fetchAttempted,
        refetchProfile,
        profileIsComplete,
        missingFields,
        profileStatus,
      }}
    >
      {children}
    </DealerProfileContext.Provider>
  );
}

// Custom hook to use the dealer profile context
export function useDealerProfile() {
  const context = useContext(DealerProfileContext);
  
  if (context === undefined) {
    throw new Error("useDealerProfile must be used within a DealerProfileProvider");
  }
  
  return context;
}
