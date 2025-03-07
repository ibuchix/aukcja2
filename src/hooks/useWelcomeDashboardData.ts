
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { hasProperty } from "@/utils/supabaseHelpers";

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

  // Add a safety timeout to ensure loading state doesn't get stuck forever
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isProfileLoading) {
        console.log("Safety timeout triggered - forcing profile loading to complete");
        setIsProfileLoading(false);
      }
    }, 5000); // 5 second safety timeout

    return () => clearTimeout(safetyTimer);
  }, [isProfileLoading]);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      try {
        if (!user) {
          console.log("No user available for profile fetch");
          setIsProfileLoading(false);
          return;
        }

        setIsProfileLoading(true);
        console.log(`Fetching dealer profile for user ID: ${user.id}`);
        
        // First try to fetch by user ID
        let { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no result and we have user email, try fetching by email
        if (!data && !error && user.email) {
          console.log(`No profile found by user ID, trying by email: ${user.email}`);
          
          // Get dealer profile directly using user's email
          // This assumes auth.users and dealers are related by email
          const { data: emailData, error: emailError } = await supabase.rpc(
            'get_dealer_by_email',
            { p_email: user.email }
          );
          
          if (emailError) {
            console.error("Error fetching dealer by email:", emailError);
          } else if (emailData) {
            console.log("Dealer profile fetched by email:", emailData);
            data = emailData;
          }
        }

        if (error) {
          console.error("Error fetching dealer profile:", error);
          toast({
            title: "Failed to load profile",
            description: "There was a problem loading your dealer profile. Please try again.",
            variant: "destructive",
          });
        } else if (data) {
          console.log("Dealer profile fetched successfully:", data);
          // Set the profile data regardless of whose it is - we'll display it anyway
          setDealerProfile(data);
        } else {
          console.log("No dealer profile found for user:", user.id);
          // Instead of showing an error toast, we'll just continue with null profile
          // and show a message in the UI
        }
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
        // Don't show toast here, just log the error and continue
      } finally {
        console.log("Profile fetch operation completed - setting loading to false");
        setIsProfileLoading(false);
      }
    };

    if (user && !isAuthLoading) {
      fetchDealerProfile();
    } else if (!isAuthLoading) {
      console.log("No authenticated user or still loading auth - skipping profile fetch");
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
