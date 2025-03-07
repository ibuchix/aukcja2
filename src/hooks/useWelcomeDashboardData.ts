
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
  const [directQueryResult, setDirectQueryResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();
  const { refreshSession } = useAuth();

  useEffect(() => {
    // Set a timeout to simulate loading recent activity
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Simple direct query test that runs once when component mounts
  useEffect(() => {
    const runDirectQueryTest = async () => {
      if (!user) return;
      
      try {
        console.log(`[Direct Query Test] Running test query for user: ${user.id}`);
        
        // Test 1: Try to get user's own profile via RPC
        const { data: userIdFromRpc, error: rpcError } = await supabase.rpc('debug_auth_user_id');
        
        if (rpcError) {
          console.error("[Direct Query Test] RPC test failed:", rpcError);
          setDirectQueryResult({
            success: false,
            message: `RPC test failed: ${rpcError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] RPC test succeeded:", userIdFromRpc);
        
        // Test 2: Try a simple count query with RLS protection
        const { count, error: countError } = await supabase
          .from('dealers')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error("[Direct Query Test] Count query failed:", countError);
          setDirectQueryResult({
            success: false,
            message: `Count query failed: ${countError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] Count query succeeded. Visible dealer rows:", count);
        
        // Test 3: Try to get specific fields from the dealer table
        const { data: nameData, error: nameError } = await supabase
          .from('dealers')
          .select('dealership_name, supervisor_name')
          .eq('user_id', user.id)
          .single();
          
        if (nameError) {
          console.error("[Direct Query Test] Name query failed:", nameError);
          setDirectQueryResult({
            success: false,
            message: `Name query failed: ${nameError.message}`
          });
          return;
        }
        
        console.log("[Direct Query Test] Name query succeeded:", nameData);
        
        // All tests passed
        setDirectQueryResult({
          success: true,
          message: `All direct queries succeeded. User ID matches: ${userIdFromRpc === user.id}. Found ${count} dealer records visible to this user.`
        });
        
      } catch (error) {
        console.error("[Direct Query Test] Unexpected error:", error);
        setDirectQueryResult({
          success: false,
          message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    };
    
    if (user && !isAuthLoading) {
      runDirectQueryTest();
    }
  }, [user, isAuthLoading]);

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
    profileFetchAttempted,
    directQueryResult
  };
}
