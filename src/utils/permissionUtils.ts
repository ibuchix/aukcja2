
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Unexpected error checking admin status:", err);
    return false;
  }
}

/**
 * Checks if the current user is a dealer
 */
export async function isDealer(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_dealer');
    
    if (error) {
      console.error("Error checking dealer status:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Unexpected error checking dealer status:", err);
    return false;
  }
}

/**
 * Checks if the current user has permission to perform an action on an entity
 */
export async function checkPermission(
  action: string, 
  entityType: string, 
  entityId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('can_perform_action', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId
    });
    
    if (error) {
      console.error("Permission check error:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error checking permissions:", err);
    return false;
  }
}

/**
 * Performs an admin action with proper logging
 */
export async function performAdminAction(
  action: string,
  entityType: string,
  entityId: string,
  details: any = {}
): Promise<boolean> {
  try {
    // First check if user is admin
    const adminStatus = await isAdmin();
    
    if (!adminStatus) {
      console.error("Non-admin attempted to perform admin action");
      return false;
    }
    
    // Get current user ID
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No authenticated user found");
      return false;
    }
    
    // Log the admin action
    const { data, error } = await supabase.rpc('log_admin_action', {
      p_admin_id: userId,
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details
    });
    
    if (error) {
      console.error("Error logging admin action:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error performing admin action:", err);
    return false;
  }
}
