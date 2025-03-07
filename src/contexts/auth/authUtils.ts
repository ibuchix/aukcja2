
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the dealer profile for a given user ID
 */
export async function fetchDealerProfile(userId: string) {
  try {
    console.log(`Fetching profile for user: ${userId}`);
    
    // Get current session to verify token validity
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.error("No active session found when fetching dealer profile");
      return null;
    }
    
    // Quick check to verify auth works
    const { data: authId, error: authError } = await supabase.rpc('debug_auth_user_id');
    
    if (authError) {
      console.error("Auth verification failed:", authError);
      return null;
    }
    
    if (authId !== userId) {
      console.warn(`Auth mismatch: JWT has ${authId} but trying to fetch profile for ${userId}`);
    }
    
    // Now that RLS is properly configured, we can query the database directly
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching dealer profile:", error);
      return null;
    }

    if (data) {
      console.log("Dealer profile fetched successfully via direct query");
      return data;
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
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only sign out from this client
    });
    
    if (error) {
      console.error("Sign out error:", error);
      return { success: false, error };
    }
    
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
    
    // First clear session cache to ensure we're not using stale data
    localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
    
    // Now refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Session refresh error:", error);
      return { success: false, error };
    }
    
    if (data.session) {
      console.log("Session refreshed successfully, expires at:", 
                 new Date(data.session.expires_at! * 1000).toLocaleString());
    } else {
      console.warn("Session refresh returned no session");
    }
    
    return { success: true, session: data.session, user: data.session?.user };
  } catch (error) {
    console.error("Session refresh error:", error);
    return { success: false, error };
  }
}
