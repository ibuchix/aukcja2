
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth/context";
import { supabase } from "@/integrations/supabase/client";
import { DealerRecord } from "@/utils/databaseTypes";

/**
 * Hook for fetching and managing the current dealer's profile
 */
export function useCurrentDealerProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchDealerProfile = async () => {
      if (!user || isAuthLoading) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching dealer profile for:", user.id);
        
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching dealer profile:", error);
          setError(error.message);
          
          // Show toast only for non-network errors
          if (!error.message.includes('network')) {
            toast({
              title: "Error loading profile",
              description: "There was a problem loading your profile information.",
              variant: "destructive",
            });
          }
          return;
        }
        
        if (data) {
          console.log("Dealer profile loaded successfully");
          if (isMounted) setDealerProfile(data as DealerRecord);
        } else {
          console.warn("No dealer profile found for user:", user.id);
          setError("No dealer profile found");
        }
      } catch (err) {
        console.error("Unexpected error fetching dealer profile:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDealerProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, toast]);

  return {
    dealerProfile,
    isLoading,
    error,
    hasProfile: !!dealerProfile,
    refresh: () => {
      setIsLoading(true);
      setError(null);
    }
  };
}
