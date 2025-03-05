
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
    
    // First, verify that the user exists in auth.users
    // This additional check helps diagnose user ID issues
    console.log(`Verifying user ${userId} exists before creating session`);
    const userCheckResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Debug user verification response
    const userCheckStatus = userCheckResponse.status;
    console.log(`User verification status: ${userCheckStatus}`);
    
    if (userCheckStatus === 404) {
      console.error(`User ${userId} not found in auth system`);
      
      // Additional debug - check if this user ID exists in our database
      const { data: userInDB, error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (dbError) {
        console.error(`Error checking user in profiles: ${dbError.message}`);
      } else if (userInDB) {
        console.error(`User exists in profiles but not in auth system. Profile ID: ${userInDB.id}`);
      } else {
        console.error(`User does not exist in profiles table either`);
      }
      
      throw new HttpError(`User with ID ${userId} not found in auth system`, 404);
    }
    
    if (!userCheckResponse.ok) {
      const errorText = await userCheckResponse.text();
      console.error(`Error verifying user: ${errorText}`);
      throw new HttpError(`Failed to verify user: ${userCheckResponse.status} ${userCheckResponse.statusText}`, 500);
    }
    
    // Now create the session
    console.log(`User verified, creating session for ${userId}`);
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // No need to specify user_id in the body when it's in the URL
        expires_in: 60 * 60 * 24 * 7 // 1 week
      })
    });
    
    // Debug the response
    console.log(`Session API response status: ${response.status} ${response.statusText}`);
    
    // Check for failed requests
    if (!response.ok) {
      // Safely try to get error details (but don't assume JSON)
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        // Only try to parse JSON if the content type indicates JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } else {
          // For non-JSON responses, get the text
          errorDetails = await response.text();
        }
      } catch (parseError) {
        // If parsing fails, use the response status text
        console.error("Error parsing response:", parseError);
        errorDetails = `Parse error: ${response.statusText}`;
      }
      
      console.error("Session creation API error:", errorDetails);
      throw new HttpError(`Session creation failed: ${errorDetails}`, 500);
    }
    
    // Safe JSON parsing with content type check
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("Unexpected non-JSON response:", await response.text());
      throw new HttpError("API returned non-JSON response", 500);
    }
    
    // Now safely parse the JSON
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
