
import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a session for a user using Supabase Admin API
 */
export async function createUserSession(supabase: SupabaseClient, userId: string, userEmail: string) {
  console.log(`Creating session for user ${userId} with email ${userEmail.substring(0, 3)}...`);
  
  try {
    // Get Supabase URL and service key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // First verify that the user exists in auth.users
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
    
    // UPDATED: Use the direct session creation endpoint
    const sessionUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}/session`;
    console.log(`Using session creation endpoint: ${sessionUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    };
    
    // New request body structure for session endpoint
    const requestBody = {
      expires_in: 60 * 60 * 24 * 7 // 1 week in seconds
    };
    
    console.log('Sending request to create session...');
    const response = await fetch(sessionUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    // Enhanced error logging
    console.log(`Session creation API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating session: ${errorText}`);
      
      // Try to parse the error if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error details:', JSON.stringify(errorJson));
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      
      throw new HttpError(`Failed to create session: ${response.status} ${response.statusText}`, 500);
    }
    
    // Parse the session data from response
    const sessionData = await response.json();
    console.log('Successfully created session');
    
    // Log session token info (without exposing the actual tokens)
    console.log(`Access token received: ${sessionData.access_token ? 'Yes (length: ' + sessionData.access_token.length + ')' : 'No'}`);
    console.log(`Refresh token received: ${sessionData.refresh_token ? 'Yes (length: ' + sessionData.refresh_token.length + ')' : 'No'}`);
    console.log(`Expires in: ${sessionData.expires_in || 'not specified'} seconds`);
    
    // Return the session data in the expected format
    return {
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_in: sessionData.expires_in || 60 * 60 * 24 * 7 // Default to 1 week if not specified
    };
    
  } catch (error) {
    console.error("Session creation failed:", error);
    // Include the error message in the thrown error for better debugging
    if (error instanceof HttpError) {
      throw error; // Re-throw HttpError instances as they already have status codes
    } else {
      throw new HttpError(`Failed to create user session: ${error.message || 'Unknown error'}`, 500);
    }
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
