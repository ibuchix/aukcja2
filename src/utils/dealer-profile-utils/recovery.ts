
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Attempts to recover a missing dealer profile for the current user
 * Use this when a user has auth record but is missing profile or dealer record
 */
export async function recoverDealerProfile() {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.error("No authenticated user to recover profile");
      return { success: false, error: "Not authenticated" };
    }
    
    const userId = session.user.id;
    console.log(`Attempting to recover profile for user ID: ${userId}`);
    
    // First check if we already have a profile record (excluding role - use user_roles table)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, suspended, updated_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      // Check if this is a permission error
      if (profileError.code === '42501') {
        console.error("Permission denied when checking profile. This may require admin intervention.");
        return { 
          success: false, 
          error: profileError,
          needsAdminHelp: true,
          message: "Profile recovery requires administrator assistance due to permission issues."
        };
      }
      console.error("Error checking profile:", profileError);
    }
    
    // If no profile exists, create one
    if (!profileData) {
      console.log("No profile found, creating recovery profile");
      
      // Get user metadata from auth
      const { data: userData } = await supabase.auth.getUser();
      const userMetadata = userData?.user?.user_metadata || {};
      const name = userMetadata.name || userData?.user?.email?.split('@')[0] || 'Dealer';
      
      // Create basic profile (role is managed in user_roles table, not profiles)
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: name,
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        // Check if this is a permission error
        if (createError.code === '42501') {
          console.error("Permission denied when creating profile. This may require admin intervention.");
          return { 
            success: false, 
            error: createError,
            needsAdminHelp: true,
            message: "Profile creation requires administrator assistance due to permission issues."
          };
        }
        
        console.error("Failed to create recovery profile:", createError);
        return { success: false, error: createError };
      }
    }
    
    // Now check if dealer record exists
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (dealerError) {
      // Check if this is a permission error
      if (dealerError.code === '42501') {
        console.error("Permission denied when checking dealer record. This may require admin intervention.");
        return { 
          success: false, 
          error: dealerError,
          needsAdminHelp: true,
          message: "Dealer record check requires administrator assistance due to permission issues."
        };
      }
      console.error("Error checking dealer record:", dealerError);
    }
    
    // If no dealer record exists, we'll need to redirect to the completion form
    if (!dealerData) {
      console.log("No dealer record found, redirect needed to complete registration");
      
      return { 
        success: true, 
        needsCompletion: true,
        message: "Profile partially recovered. Please complete your dealer information."
      };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error("Error in profile recovery:", error);
    return { success: false, error };
  }
}

/**
 * Checks if the current user has complete profile and dealer records
 * Returns true if both exist and are complete, false otherwise
 */
export async function verifyUserProfileIntegrity(): Promise<{complete: boolean, needsRecovery: boolean}> {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return { complete: false, needsRecovery: false };
    }
    
    const userId = session.user.id;
    
    // Check if profile exists (excluding role - use user_roles table for role checks)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, suspended, updated_at')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      // Check if this is a permission error - don't trigger recovery for permission issues
      if (profileError.code === '42501') {
        console.warn("Profile integrity check: Permission denied when checking profile");
        return { complete: false, needsRecovery: false };
      }
      console.warn("Profile integrity check: Error checking profile", profileError);
      return { complete: false, needsRecovery: true };
    }
    
    if (!profileData) {
      console.warn("Profile integrity check: Missing profile record");
      return { complete: false, needsRecovery: true };
    }
    
    // Check if dealer record exists
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (dealerError) {
      // Check if this is a permission error - don't trigger recovery for permission issues  
      if (dealerError.code === '42501') {
        console.warn("Profile integrity check: Permission denied when checking dealer record");
        return { complete: false, needsRecovery: false };
      }
      console.warn("Profile integrity check: Error checking dealer record", dealerError);
      return { complete: false, needsRecovery: true };
    }
    
    if (!dealerData) {
      console.warn("Profile integrity check: Missing dealer record");
      return { complete: false, needsRecovery: true };
    }
    
    // All records exist
    return { complete: true, needsRecovery: false };
    
  } catch (error) {
    console.error("Error checking profile integrity:", error);
    return { complete: false, needsRecovery: false };
  }
}
