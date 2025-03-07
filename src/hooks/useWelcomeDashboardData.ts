
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { hasProperty } from "@/utils/supabaseHelpers";
import { DealerRecord } from "@/utils/databaseTypes";
import { useAuth } from "@/contexts/AuthContext";

export function useWelcomeDashboardData(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [recentActivity, setRecentActivity] = useState<boolean>(false);
  const [profileDataLoading, setProfileDataLoading] = useState<boolean>(true);
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
          if (isMounted) setProfileDataLoading(false);
          return;
        }

        console.log(`Fetching dealer profile for user ID: ${user.id}`);
        
        // First, ensure we have a valid session before making the request
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.log("No active session found, attempting to refresh...");
          // Try to refresh the session before proceeding
          await refreshSession();
        }
        
        // Attempt to fetch dealer profile directly
        let { data, error, status } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching dealer profile (${status}):`, error);
          
          if (status === 401) {
            console.log("Authentication error (401). Attempting session refresh...");
            // Try to refresh the session and retry the fetch
            await refreshSession();
            
            // Retry the fetch after session refresh
            const retryResult = await supabase
              .from('dealers')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (retryResult.error) {
              console.error("Retry failed after session refresh:", retryResult.error);
            } else if (retryResult.data) {
              console.log("Dealer profile fetched successfully after retry:", retryResult.data);
              if (isMounted) setDealerProfile(retryResult.data as DealerRecord);
            }
          }
        } else if (data) {
          console.log("Dealer profile fetched successfully:", data);
          if (isMounted) setDealerProfile(data as DealerRecord);
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
                if (typeof dealerData === 'object' && dealerData !== null && isMounted) {
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
      } finally {
        if (isMounted) setProfileDataLoading(false);
      }
    };

    // Only fetch if we have a user and we're not currently loading auth
    if (user && !isAuthLoading) {
      setProfileDataLoading(true);
      fetchDealerProfile();
    } else if (!user && !isAuthLoading) {
      setProfileDataLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, toast, refreshSession]);

  return {
    dealerProfile,
    recentActivity,
    profileDataLoading 
  };
}
