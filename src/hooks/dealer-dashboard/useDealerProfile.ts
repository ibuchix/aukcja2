
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { DealerRecord } from "@/utils/databaseTypes";
import { useAuth } from "@/contexts/AuthContext";
import { rawSupabaseClient } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";

export function useDealerProfile(user: User | null, isAuthLoading: boolean) {
  const [dealerProfile, setDealerProfile] = useState<DealerRecord | null>(null);
  const [profileDataLoading, setProfileDataLoading] = useState<boolean>(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
        console.log(`[RLS Debug] Using raw Supabase client to preserve authentication context`);
        
        // Verify session before making query
        const { data: sessionData, error: sessionError } = await rawSupabaseClient.auth.getSession();
        
        if (sessionError) {
          console.error("[RLS Debug] Session error:", sessionError);
          setFetchError(`Session error: ${sessionError.message}`);
          return;
        }
        
        if (!sessionData.session) {
          console.error("[RLS Debug] No active session found");
          setFetchError("No active session found. Please log in again.");
          return;
        }
        
        console.log(`[RLS Debug] Active session confirmed for user: ${sessionData.session.user.id}`);
        
        // Try with executeWithRetry for better reliability using raw client
        const result = await executeWithRetry(
          async () => {
            const { data, error } = await rawSupabaseClient
              .from('dealers')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (error) throw error;
            return data;
          },
          {
            maxRetries: 2,
            baseDelay: 500,
            shouldRetry: (error) => {
              console.log("[RLS Debug] Query error in retry:", error);
              // Only retry on specific errors that might be temporary
              return error.code === '42501' || error.code === 'PGRST301';
            }
          }
        ).catch(error => {
          console.error("[RLS Debug] Final error after retries:", error);
          setFetchError(error.message);
          return null;
        });
        
        if (result) {
          console.log("[RLS Debug] Dealer profile fetched successfully:", result);
          if (isMounted) setDealerProfile(result as DealerRecord);
        } else {
          console.log("[RLS Debug] No dealer profile found for user:", user.id);
        }
      } catch (error) {
        console.error("[RLS Debug] Unexpected error fetching profile:", error);
        setFetchError(error instanceof Error ? error.message : String(error));
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
      setFetchError(null);
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
    profileFetchAttempted,
    fetchError
  };
}
