
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
    
    // Now create the session with enhanced debugging
    console.log(`User verified, creating session for ${userId}`);
    
    // Log the complete URL and headers for debugging
    const sessionUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}/session`;
    console.log(`Session creation URL: ${sessionUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    };
    console.log(`Using headers: ${JSON.stringify(Object.keys(headers))}`);
    
    const sessionBody = {
      expires_in: 60 * 60 * 24 * 7 // 1 week
    };
    console.log(`Request body: ${JSON.stringify(sessionBody)}`);
    
    const response = await fetch(sessionUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(sessionBody)
    });
    
    // Debug the response in detail
    console.log(`Session API response status: ${response.status} ${response.statusText}`);
    
    // Check for failed requests with detailed error information
    if (!response.ok) {
      // Try to get the response body for more details
      let errorDetails = "";
      try {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } else {
          // For non-JSON responses, get the text
          errorDetails = await response.text();
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorDetails = response.statusText;
      }
      
      console.error(`Session creation API error: ${response.status} ${errorDetails}`);
      
      // If it's a 404, try alternative URL format as fallback
      if (response.status === 404) {
        console.log("Trying alternative admin session endpoint format...");
        
        // Try alternative session creation endpoint
        const alternativeUrl = `${supabaseUrl}/auth/v1/session`;
        console.log(`Trying alternative URL: ${alternativeUrl}`);
        
        const alternativeResponse = await fetch(alternativeUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            ...sessionBody,
            user_id: userId
          })
        });
        
        // Check if alternative worked
        if (alternativeResponse.ok) {
          console.log("Alternative session endpoint succeeded!");
          const sessionData = await alternativeResponse.json();
          return sessionData;
        } else {
          console.error(`Alternative session endpoint also failed: ${alternativeResponse.status}`);
        }
      }
      
      throw new HttpError(`Session creation failed: ${response.status} ${errorDetails}`, 500);
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
