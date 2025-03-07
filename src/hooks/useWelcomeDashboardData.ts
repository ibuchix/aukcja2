
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { hasProperty } from "@/utils/supabaseHelpers";
import { DealerRecord } from "@/utils/databaseTypes";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [recentActivity, setRecentActivity] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set a timeout to simulate loading recent activity
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      try {
        if (!user) {
          console.log("No user available for profile fetch");
          return;
        }

        console.log(`Fetching dealer profile for user ID: ${user.id}`);
        
        // Attempt to fetch dealer profile directly
        let { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching dealer profile:", error);
          // Don't show toast for now to avoid disrupting UI
        } else if (data) {
          console.log("Dealer profile fetched successfully:", data);
          setDealerProfile(data as DealerRecord);
        } else if (user.email) {
          console.log(`No profile found by user ID, trying by email: ${user.email}`);
          
          try {
            // Try to get user ID by email
            const { data: userData, error: userError } = await supabase.rpc(
              'get_user_id_by_email',
              { p_email: user.email }
            );
            
            if (userError) {
              console.error("Error fetching user ID by email:", userError);
            } else if (userData && hasProperty(userData, 'id')) {
              const userIdString = String(userData.id);
              
              const { data: dealerData, error: dealerError } = await supabase.rpc(
                'get_dealer_by_user_id',
                { p_user_id: userIdString }
              );
              
              if (dealerError) {
                console.error("Error fetching dealer by user ID:", dealerError);
              } else if (dealerData) {
                console.log("Dealer profile fetched by user ID after email lookup:", dealerData);
                if (typeof dealerData === 'object' && dealerData !== null) {
                  setDealerProfile(dealerData as unknown as DealerRecord);
                }
              }
            }
          } catch (rpcError) {
            console.error("RPC error during profile lookup:", rpcError);
          }
        } else {
          console.log("No dealer profile found for user:", user.id);
        }
      } catch (error) {
        console.error("Unexpected error fetching profile:", error);
      }
    };

    // Only fetch if we have a user
    if (user) {
      fetchDealerProfile();
    }
  }, [user, toast]);

  return {
    dealerProfile,
    recentActivity,
    profileDataLoading: false // Always return false for loading
  };
}
