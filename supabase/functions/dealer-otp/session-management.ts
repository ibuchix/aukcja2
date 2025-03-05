
import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a session for a user
 */
export async function createUserSession(supabase: SupabaseClient, userId: string) {
  console.log(`Creating session for user ${userId}`);
  
  try {
    // Get Supabase URL and service key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // Use direct API call to create a session with the service role
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        expires_in: 60 * 60 * 24 * 7 // 1 week
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Session creation API error:", errorData);
      throw new HttpError(`Session creation failed: ${response.status} ${response.statusText}`, 500);
    }
    
    const sessionData = await response.json();
    console.log("Session created successfully");
    return sessionData;
  } catch (error) {
    console.error("Session creation failed:", error);
    throw new HttpError("Failed to create user session", 500);
  }
}

/**
 * Gets dealer profile information
 */
export async function getDealerProfile(supabase: SupabaseClient, userId: string) {
  console.log(`Getting dealer profile for user ${userId}`);
  
  const { data: dealerData, error: dealerError } = await supabase
    .from('dealers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Don't throw error if dealer profile not found, just return null
  if (dealerError) {
    console.log("Dealer profile not found or error:", dealerError);
    return null;
  }
  
  return dealerData;
}
