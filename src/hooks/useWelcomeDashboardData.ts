
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DealerRecord } from "@/utils/databaseTypes";
import { useAuth } from "@/contexts/AuthContext";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [recentActivity, setRecentActivity] = useState<boolean>(false);
  const [profileDataLoading, setProfileDataLoading] = useState<boolean>(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState<boolean>(false);
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  useEffect(() => {
    // Set a timeout to simulate loading recent activity
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

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

        console.log(`Fetching dealer profile for user ID: ${user.id}`);
        
        // Use the imported function from authUtils that now uses the edge function
        const { data, error } = await supabase.functions.invoke('get-dealer-profile', {
          method: 'GET',
          params: { userId: user.id }
        });
        
        if (error) {
          console.error("Error fetching dealer profile:", error);
          // Continue execution - we'll handle the null profile case
        }
        
        if (data && data.data) {
          console.log("Dealer profile fetched successfully:", data.data);
          if (isMounted) setDealerProfile(data.data as DealerRecord);
        } else {
          console.log("No dealer profile found for user:", user.id);
        }
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
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
    recentActivity,
    profileDataLoading,
    profileFetchAttempted
  };
}
