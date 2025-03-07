
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DealerRecord } from "@/utils/databaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

        console.log(`[RLS Debug] Fetching dealer profile for user ID: ${user.id}`);
        
        // Check JWT claim before making the query
        try {
          const { data: jwtUserId, error: jwtError } = await supabase.rpc('debug_auth_user_id');
          console.log("[RLS Debug] JWT user ID check:", {
            jwtUserId,
            error: jwtError?.message,
            matchesCurrentUser: jwtUserId === user.id
          });
          
          if (jwtError || jwtUserId !== user.id) {
            console.warn("[RLS Debug] JWT user ID mismatch or error. Refreshing session...");
            await refreshSession();
          }
        } catch (jwtCheckError) {
          console.error("[RLS Debug] Error checking JWT user ID:", jwtCheckError);
        }
        
        // Direct database access with RLS
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("[RLS Debug] Error fetching dealer profile:", error);
          console.log("[RLS Debug] Request details:", {
            userId: user.id,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details
          });
          
          // Attempt to check if the dealers table has any records (this will be filtered by RLS)
          const { count, error: countError } = await supabase
            .from('dealers')
            .select('*', { count: 'exact', head: true });
            
          console.log("[RLS Debug] Dealers table count check:", { 
            count, 
            error: countError?.message 
          });
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
    recentActivity,
    profileDataLoading,
    profileFetchAttempted
  };
}
