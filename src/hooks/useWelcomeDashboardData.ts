
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set a timeout to simulate loading recent activity
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      try {
        if (!user) return;

        setIsProfileLoading(true);
        
        // Fetch dealer profile from the dealers table
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching dealer profile:", error);
          toast({
            title: "Failed to load profile",
            description: "There was a problem loading your dealer profile",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          console.log("Dealer profile fetched:", data);
          setDealerProfile(data);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsProfileLoading(false); // Set loading to false when done
      }
    };

    if (user && !isAuthLoading) {
      fetchDealerProfile();
    }
  }, [user, isAuthLoading, toast]);

  const profileDataLoading = isAuthLoading || isProfileLoading;

  return {
    dealerProfile,
    recentActivity,
    profileDataLoading
  };
}
