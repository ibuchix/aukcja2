
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";

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
};

// Define the context type
type DealerProfileContextType = {
  profile: DealerProfile | null;
  displayProfile: DisplayProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  refetchProfile: () => Promise<void>;
};

// Create the context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  profile: null,
  displayProfile: null,
  isLoading: false,
  error: null,
  fetchAttempted: false,
  refetchProfile: async () => {},
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to fetch dealer profile
  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching dealer profile for user:", user.id);
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error("Error fetching dealer profile:", error);
        setError(error.message);
        setProfile(null);
        setDisplayProfile(null);
        
        toast({
          title: "Failed to load profile",
          description: "There was an error loading your dealer profile.",
          variant: "destructive",
        });
      } else {
        console.log("Dealer profile fetched successfully:", data);
        setProfile(data);
        
        // Transform the database profile to display format
        const transformedProfile = mapDatabaseToDisplay(data);
        setDisplayProfile(transformedProfile);
      }
    } catch (err) {
      console.error("Unexpected error fetching dealer profile:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred while loading your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setFetchAttempted(true);
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
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
