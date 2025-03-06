
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
        if (!user || !user.id) {
          console.log("No user or user ID available for profile fetch");
          return;
        }

        setIsProfileLoading(true);
        console.log(`Fetching dealer profile for user ID: ${user.id}`);
        
        // Fetch dealer profile from the dealers table
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching dealer profile:", error);
          toast({
            title: "Failed to load profile",
            description: "There was a problem loading your dealer profile. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          console.log("Dealer profile fetched successfully:", data);
          // Verify that the profile matches the current user
          if (data.user_id === user.id) {
            setDealerProfile(data);
          } else {
            console.error("Profile user_id mismatch", { 
              profileUserId: data.user_id, 
              currentUserId: user.id 
            });
            toast({
              title: "Profile data mismatch",
              description: "There was an issue with your profile data. Please contact support.",
              variant: "destructive",
            });
          }
        } else {
          console.log("No dealer profile found for user:", user.id);
          toast({
            title: "Profile not found",
            description: "We couldn't find your dealer profile. Please complete your registration.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (user && !isAuthLoading) {
      fetchDealerProfile();
    } else if (!user && !isAuthLoading) {
      setIsProfileLoading(false);
    }
  }, [user, isAuthLoading, toast]);

  const profileDataLoading = isAuthLoading || isProfileLoading;

  return {
    dealerProfile,
    recentActivity,
    profileDataLoading
  };
}
