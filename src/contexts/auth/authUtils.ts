
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseToDisplay } from "@/utils/dealerProfileMapping";
import { Json } from "@/integrations/supabase/types";
import { refreshAuthToken } from "@/utils/sessionRefresh";
import { isSelectQueryError } from "@/utils/supabaseHelpers";

// Required fields for a complete dealer profile
const REQUIRED_DEALER_FIELDS = [
  'supervisor_name', 
  'dealership_name', 
  'tax_id', 
  'business_registry_number', 
  'address'
];

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
          
          if (debugData && Array.isArray(debugData) && debugData.length > 0) {
            const { has_access, record_exists, error_message } = debugData[0];
            console.log(`Access debug: has_access=${has_access}, record_exists=${record_exists}, error=${error_message}`);
            
            // If the debug function confirms the record doesn't exist, we can differentiate
            // between "no profile" and "access denied"
            if (has_access && !record_exists) {
              console.log("Confirmed: No dealer profile exists for this user");
              return { profile_status: "not_found", user_id: userId, needs_recovery: true };
            }
          }
        } catch (debugError) {
          console.error("Could not run access debugging:", debugError);
        }
        
        return null;
      }
      
      if (!rpcData) {
        console.log("No profile data returned from RPC function");
        return { profile_status: "not_found", user_id: userId, needs_recovery: true };
      }
      
      console.log("Profile successfully retrieved via RPC function");
      
      // TYPE SAFETY IMPROVEMENT: Check if rpcData is an object, not an array or a SelectQueryError
      if (
        typeof rpcData === 'object' && 
        rpcData !== null && 
        !Array.isArray(rpcData) &&
        !isSelectQueryError(rpcData)
      ) {
        // Now we can safely cast it to an object with string keys
        const rpcDataObj = rpcData as Record<string, Json>;
        
        // Check for required fields and log any missing ones
        const missingFields = checkForMissingFields(rpcDataObj);
        
        // Determine if profile is complete based on missing fields
        const isComplete = missingFields.length === 0;
        
        // Return object with consistent format and safe type conversions
        return {
          ...rpcDataObj,
          id: rpcDataObj.id ? String(rpcDataObj.id) : null,
          user_id: rpcDataObj.user_id ? String(rpcDataObj.user_id) : userId,
          profile_status: isComplete ? "complete" : "incomplete",
          missing_fields: missingFields,
          is_complete: isComplete
        };
      }
      
      console.warn("RPC data not in expected format:", rpcData);
      return null;
    }
    
    // Handle successful direct query response
    if (data) {
      console.log("Dealer profile successfully retrieved via direct query");
      
      // Check for required fields and log any missing ones
      const missingFields = checkForMissingFields(data);
      
      // Determine if profile is complete based on missing fields
      const isComplete = missingFields.length === 0;
      
      // Return object with consistent format and safe type conversions
      return {
        ...data,
        id: data.id ? String(data.id) : null,
        user_id: data.user_id ? String(data.user_id) : userId,
        profile_status: isComplete ? "complete" : "incomplete",
        missing_fields: missingFields,
        is_complete: isComplete
      };
    }
    
    console.log("No dealer profile found for user");
    return { profile_status: "not_found", user_id: userId, needs_recovery: true };
  } catch (error) {
    console.error("Unexpected error during profile fetch:", error);
    return null;
  }
}

/**
 * Helper function to check for missing required fields in a dealer profile
 */
function checkForMissingFields(profileData: Record<string, any>): string[] {
  if (!profileData) return REQUIRED_DEALER_FIELDS;
  
  return REQUIRED_DEALER_FIELDS.filter(field => {
    const value = profileData[field];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
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
    
    // Use the centralized refresh function
    const result = await refreshAuthToken();
    
    if (!result.success) {
      console.error("Session refresh error:", result.error);
      return { 
        success: false, 
        error: result.error,
        needsReauth: result.needsReauth 
      };
    }
    
    return { 
      success: true, 
      session: result.session, 
      user: result.session?.user 
    };
  } catch (error) {
    console.error("Session refresh error:", error);
    return { success: false, error, needsReauth: true };
  }
}
