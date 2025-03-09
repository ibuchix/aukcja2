
import { User } from "@supabase/supabase-js";
import { useRecentActivity } from "./dealer-dashboard/useRecentActivity";
import { useDirectQueryTest } from "./dealer-dashboard/useDirectQueryTest";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const recentActivity = useRecentActivity();
  const directQueryResult = useDirectQueryTest(user, isAuthLoading);
  
  // Add the missing dealer profile-related state
  const [dealerProfile, setDealerProfile] = useState<any | null>(null);
  const [profileDataLoading, setProfileDataLoading] = useState<boolean>(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Fetch dealer profile data
  useEffect(() => {
    const fetchDealerProfile = async () => {
      if (!user || isAuthLoading) {
        setProfileDataLoading(false);
        return;
      }
      
      try {
        setProfileDataLoading(true);
        setFetchError(null);
        
        console.log("Fetching dealer profile for user:", user.id);
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching dealer profile:", error);
          setFetchError(error.message);
          setDealerProfile(null);
        } else {
          console.log("Dealer profile fetched successfully:", data);
          setDealerProfile(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching dealer profile:", err);
        setFetchError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setProfileDataLoading(false);
        setProfileFetchAttempted(true);
      }
    };
    
    fetchDealerProfile();
  }, [user, isAuthLoading]);

  return {
    recentActivity,
    directQueryResult,
    dealerProfile,
    profileDataLoading,
    profileFetchAttempted,
    fetchError
  };
}
