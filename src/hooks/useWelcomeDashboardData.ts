
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { hasProperty } from "@/utils/supabaseHelpers";
import { DealerRecord } from "@/utils/databaseTypes";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [recentActivity, setRecentActivity] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set a timeout to simulate loading recent activity - reduced from 1500ms to 800ms
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Add a safety timeout to ensure loading state doesn't get stuck forever
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isProfileLoading) {
        console.log("Safety timeout triggered - forcing profile loading to complete");
        setIsProfileLoading(false);
      }
    }, 3000); // Reduced from 5 seconds to 3 seconds

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
          
          // Get dealer profile using get_dealer_by_user_id function instead
          // We'll pass the email to the RPC, but have it use the user_id internally
          const { data: userData, error: userError } = await supabase.rpc(
            'get_user_id_by_email',
            { p_email: user.email }
          );
          
          if (userError) {
            console.error("Error fetching user ID by email:", userError);
          } else if (userData) {
            // Check if userData has an id property and it's not null
            const userId = hasProperty(userData, 'id') ? userData.id : null;
            
            if (userId) {
              // Now we have the user ID, get the dealer profile
              // Ensure userId is definitely a string type before using it
              const userIdString = String(userId);
              
              const { data: dealerData, error: dealerError } = await supabase.rpc(
                'get_dealer_by_user_id',
                { p_user_id: userIdString }
              );
              
              if (dealerError) {
                console.error("Error fetching dealer by user ID:", dealerError);
              } else if (dealerData) {
                console.log("Dealer profile fetched by user ID after email lookup:", dealerData);
                // Check if dealerData has the required properties to be a DealerRecord
                if (typeof dealerData === 'object' && dealerData !== null) {
                  data = dealerData as unknown as DealerRecord;
                }
              }
            }
          }
        }

        if (error) {
          console.error("Error fetching dealer profile:", error);
          // Only show toast for real errors, not for "not found"
          if (error.code !== 'PGRST116') {
            toast({
              title: "Error loading profile",
              description: "There was a problem loading your dealer profile: " + error.message,
              variant: "destructive",
            });
          }
        } else if (data) {
          console.log("Dealer profile fetched successfully:", data);
          // Set the profile data regardless of whose it is - we'll display it anyway
          setDealerProfile(data as DealerRecord);
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

    // Only make the API call if we actually have a user to look up
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
