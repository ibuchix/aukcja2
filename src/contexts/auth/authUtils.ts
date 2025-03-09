
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";

/**
 * Fetches the dealer profile for a given user ID with enhanced error handling and fallbacks
 */
export async function fetchDealerProfile(userId: string) {
  try {
    console.log(`Fetching profile for user: ${userId}`);
    
    // Get current session to verify token validity
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error during profile fetch:", sessionError);
      return null;
    }
    
    if (!sessionData.session) {
      console.error("No active session found when fetching dealer profile");
      return null;
    }
    
    // First try the direct query (with RLS policies)
    console.log("Trying direct query to dealers table");
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching dealer profile:", error);
      console.error("Error details:", JSON.stringify(error));
      
      // Try the RPC function as fallback
      console.log("Trying fallback RPC method");
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'get_dealer_by_user_id',
          { p_user_id: userId }
        );
        
        if (!rpcError && rpcData) {
          console.log("Dealer profile fetched successfully via RPC function", rpcData);
          
          // Return consistent profile format
          return {
            ...rpcData,
            // Convert any non-string IDs to strings for consistency
            id: rpcData.id?.toString() || null,
            user_id: rpcData.user_id?.toString() || userId
          };
        } else if (rpcError) {
          console.warn("RPC function failed:", rpcError);
        }
      } catch (rpcFallbackError) {
        console.warn("RPC function error caught:", rpcFallbackError);
      }
      
      return null;
    }

    if (data) {
      console.log("Dealer profile fetched successfully via direct query", data);
      
      // Ensure consistent format
      return {
        ...data,
        // Convert any non-string IDs to strings for consistency
        id: data.id?.toString() || null,
        user_id: data.user_id?.toString() || userId
      };
    } else {
      console.log("No dealer profile found for user via direct query");
      return null;
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    return null;
  }
}

/**
 * Signs the user out
 */
export async function signOutUser() {
  try {
    console.log("Signing out user");
    
    // First clear local storage to ensure no stale data
    try {
      localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
      localStorage.removeItem('dealer_auth_token');
    } catch (storageError) {
      console.warn("Error clearing local storage:", storageError);
      // Continue despite error
    }
    
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this client
    });
    
    if (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }
    
    console.log("User signed out successfully");
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
}

/**
 * Refreshes the user session
 */
export async function refreshUserSession() {
  try {
    console.log("Manually refreshing session");
    
    // Get current session
    const { data: currentSession, error: currentSessionError } = await supabase.auth.getSession();
    
    if (currentSessionError) {
      console.error("Error getting current session:", currentSessionError);
      return { success: false, error: currentSessionError };
    }
    
    // If we don't have a current session, we can't refresh
    if (!currentSession.session) {
      console.warn("No current session to refresh");
      return { success: false, error: new Error("No active session") };
    }
    
    // Now refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Session refresh error:", error);
      
      // If refresh fails, we need to redirect to login
      return { 
        success: false, 
        error,
        needsReauth: true 
      };
    }
    
    if (data.session) {
      console.log("Session refreshed successfully, expires at:", 
                 new Date(data.session.expires_at! * 1000).toLocaleString());
    } else {
      console.warn("Session refresh returned no session");
      return { success: false, needsReauth: true };
    }
    
    return { success: true, session: data.session, user: data.session?.user };
  } catch (error) {
    console.error("Session refresh error:", error);
    return { success: false, error, needsReauth: true };
  }
}
