
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Get the session to access the token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      console.error("No active session found");
      return false;
    }
    
    // Use fetch directly to call the RPC function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error("Error checking admin status:", await response.text());
      return false;
    }
    
    const data = await response.json();
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
    // Get the session to access the token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      console.error("No active session found");
      return false;
    }
    
    // Use fetch directly to call the RPC function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_dealer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      console.error("Error checking dealer status:", await response.text());
      return false;
    }
    
    const data = await response.json();
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
    // Get the session to access the token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) {
      console.error("No active session found");
      return false;
    }
    
    // Use fetch directly to call the RPC function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_perform_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId
      })
    });
    
    if (!response.ok) {
      console.error("Permission check error:", await response.text());
      return false;
    }
    
    const data = await response.json();
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
    
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No authenticated user found");
      return false;
    }
    
    if (!session?.access_token) {
      console.error("No access token found");
      return false;
    }
    
    // Use fetch directly to call the perform_admin_action function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/perform_admin_action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details
      })
    });
    
    if (!response.ok) {
      console.error("Error logging admin action:", await response.text());
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error performing admin action:", err);
    return false;
  }
}
