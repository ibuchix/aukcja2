
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Define the context type
type DealerProfileContextType = {
  profile: DealerProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchAttempted: boolean;
  refetchProfile: () => Promise<void>;
};

// Create the context with default values
const DealerProfileContext = createContext<DealerProfileContextType>({
  profile: null,
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
        
        toast({
          title: "Failed to load profile",
          description: "There was an error loading your dealer profile.",
          variant: "destructive",
        });
      } else {
        console.log("Dealer profile fetched successfully:", data);
        setProfile(data);
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
