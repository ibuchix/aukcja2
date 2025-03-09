
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";
import { Json } from "@/integrations/supabase/types";

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
    
    // First try the direct query with our RLS policies
    console.log("Trying direct query to dealers table with RLS policies");
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    // If direct query fails, try the RPC function that bypasses RLS
    if (error) {
      console.error("Error fetching dealer profile via direct query:", error);
      console.log("Falling back to security definer RPC function");
      
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_dealer_by_user_id',
        { p_user_id: userId }
      );
      
      if (rpcError) {
        console.error("RPC fallback also failed:", rpcError);
        
        // As a last resort, debug the access issue
        try {
          const { data: debugData } = await supabase.rpc(
            'debug_dealer_access',
            { p_user_id: userId }
          );
          
          console.log("Access debugging results:", debugData);
          
          if (debugData && debugData[0]) {
            const { has_access, record_exists, error_message } = debugData[0];
            console.log(`Access debug: has_access=${has_access}, record_exists=${record_exists}, error=${error_message}`);
            
            // If the debug function confirms the record doesn't exist, we can differentiate
            // between "no profile" and "access denied"
            if (has_access && !record_exists) {
              console.log("Confirmed: No dealer profile exists for this user");
              return { profile_status: "not_found", user_id: userId };
            }
          }
        } catch (debugError) {
          console.error("Could not run access debugging:", debugError);
        }
        
        return null;
      }
      
      if (!rpcData) {
        console.log("No profile data returned from RPC function");
        return { profile_status: "not_found", user_id: userId };
      }
      
      console.log("Profile successfully retrieved via RPC function");
      
      // Ensure data is properly shaped before returning
      if (typeof rpcData === 'object' && rpcData !== null && !Array.isArray(rpcData)) {
        // Type guard to ensure we're working with an object, not an array
        const rpcDataObj = rpcData as { [key: string]: Json };
        
        // Check for required fields and log any missing ones
        const requiredFields = ['supervisor_name', 'dealership_name', 'tax_id', 'business_registry_number', 'address'];
        const missingFields = requiredFields.filter(field => !rpcDataObj[field]);
        
        if (missingFields.length > 0) {
          console.warn("Dealer profile is incomplete. Missing fields:", missingFields);
        }
        
        // Return object with consistent format
        return {
          ...rpcDataObj,
          id: rpcDataObj.id?.toString() || null,
          user_id: rpcDataObj.user_id?.toString() || userId
        };
      }
      
      console.warn("RPC data not in expected format:", rpcData);
      return null;
    }
    
    // Handle successful direct query response
    if (data) {
      console.log("Dealer profile successfully retrieved via direct query");
      
      // Check for required fields and log any missing ones
      const requiredFields = ['supervisor_name', 'dealership_name', 'tax_id', 'business_registry_number', 'address'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.warn("Dealer profile is incomplete. Missing fields:", missingFields);
      }
      
      // Return object with consistent format
      return {
        ...data,
        id: data.id?.toString() || null,
        user_id: data.user_id?.toString() || userId
      };
    }
    
    console.log("No dealer profile found for user");
    return { profile_status: "not_found", user_id: userId };
  } catch (error) {
    console.error("Unexpected error during profile fetch:", error);
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
