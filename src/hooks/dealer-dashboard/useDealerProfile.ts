
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DealerRecord } from "@/utils/databaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useDealerProfile(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [profileDataLoading, setProfileDataLoading] = useState<boolean>(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState<boolean>(false);
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  // Fetch dealer profile
  useEffect(() => {
    let isMounted = true;
    
    const fetchDealerProfile = async () => {
      try {
        if (!user) {
          console.log("No user available for profile fetch");
          if (isMounted) {
            setProfileDataLoading(false);
            setProfileFetchAttempted(true);
          }
          return;
        }

        console.log(`[RLS Debug] Fetching dealer profile for user ID: ${user.id}`);
        
        // Direct database access with improved error handling
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle missing data more gracefully
        
        if (error) {
          console.error("[RLS Debug] Error fetching dealer profile:", error);
          
          if (error.code === 'PGRST116') {
            console.log("[RLS Debug] No data found - this is not necessarily an error");
            toast({
              title: "Profile data not found",
              description: "We couldn't find your dealer profile. Please complete your registration.",
              variant: "destructive",
            });
          } else {
            console.log("[RLS Debug] Request details:", {
              userId: user.id,
              errorCode: error.code,
              errorMessage: error.message,
              errorDetails: error.details
            });
            
            toast({
              title: "Data loading error",
              description: "There was an error loading your profile data. Please try again.",
              variant: "destructive",
            });
          }
        }
        
        if (data) {
          console.log("[RLS Debug] Dealer profile fetched successfully:", data);
          if (isMounted) setDealerProfile(data as DealerRecord);
        } else {
          console.log("[RLS Debug] No dealer profile found for user:", user.id);
        }
      } catch (error) {
        console.error("[RLS Debug] Unexpected error fetching profile:", error);
      } finally {
        if (isMounted) {
          setProfileDataLoading(false);
          setProfileFetchAttempted(true);
        }
      }
    };

    // Only fetch if we have a user and we're not currently loading auth
    if (user && !isAuthLoading) {
      setProfileDataLoading(true);
      fetchDealerProfile();
    } else if (!user && !isAuthLoading) {
      setProfileDataLoading(false);
      setProfileFetchAttempted(true);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, toast, refreshSession]);

  return {
    dealerProfile,
    profileDataLoading,
    profileFetchAttempted
  };
}
