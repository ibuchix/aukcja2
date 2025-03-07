import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the dealer profile for a given user ID
 */
export async function fetchDealerProfile(userId: string) {
  try {
    console.log(`Fetching profile for user: ${userId}`);
    
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
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Session refresh error:", error);
      return { success: false, error };
    }
    
    return { success: true, session: data.session, user: data.session?.user };
  } catch (error) {
    console.error("Session refresh error:", error);
    return { success: false, error };
  }
}
