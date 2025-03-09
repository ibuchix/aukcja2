
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to fetch dealer profile with improved error handling and retries
  const fetchProfile = async (retryCount = 0) => {
    if (!user) {
      setIsLoading(false);
      setFetchAttempted(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching dealer profile for user:", user.id);
      
      // First try direct query with RLS policies
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results more gracefully

      if (error) {
        console.error("Error fetching dealer profile:", error);
        
        // Try the RPC function as fallback if available
        try {
          console.log("Attempting to use get_dealer_by_user_id RPC fallback");
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            'get_dealer_by_user_id',
            { p_user_id: user.id }
          );
          
          if (!rpcError && rpcData) {
            console.log("Profile fetched successfully via RPC function");
            setProfile(rpcData);
            
            // Transform data consistently using our mapping function
            const transformedProfile = mapDatabaseToDisplay(rpcData);
            setDisplayProfile(transformedProfile);
            setError(null);
            return;
          } else {
            // If RPC also failed, throw the original error
            throw error;
          }
        } catch (rpcError) {
          console.warn("RPC fallback also failed:", rpcError);
          throw error;
        }
      }

      console.log("Dealer profile fetched successfully:", data);
      setProfile(data);
      
      if (data) {
        // Transform the database profile to display format consistently
        const transformedProfile = mapDatabaseToDisplay(data);
        setDisplayProfile(transformedProfile);
      } else {
        setDisplayProfile(null);
      }
    } catch (err) {
      console.error("Error fetching dealer profile:", err);
      
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
