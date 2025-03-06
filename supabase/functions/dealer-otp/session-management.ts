
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
    
    // FIXED: Use the correct token creation endpoint
    const tokenUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}/token`;
    console.log(`Using token creation endpoint: ${tokenUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    };
    
    // Request body for token endpoint
    const requestBody = {
      // Standard token expiration, can be customized as needed
      expires_in: 60 * 60 * 24 * 7 // 1 week in seconds
    };
    
    console.log('Sending request to create user token...');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    // Enhanced error logging
    console.log(`Token creation API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating token: ${errorText}`);
      
      // Try to parse the error if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error details:', JSON.stringify(errorJson));
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      
      throw new HttpError(`Failed to create session: ${response.status} ${response.statusText}`, 500);
    }
    
    // Parse the token data from response
    const tokenData = await response.json();
    console.log('Successfully created user token');
    
    // Log token info (without exposing the actual tokens)
    console.log(`Access token received: ${tokenData.access_token ? 'Yes (length: ' + tokenData.access_token.length + ')' : 'No'}`);
    console.log(`Refresh token received: ${tokenData.refresh_token ? 'Yes (length: ' + tokenData.refresh_token.length + ')' : 'No'}`);
    console.log(`Token type: ${tokenData.token_type || 'not specified'}`);
    console.log(`Expires in: ${tokenData.expires_in || 'not specified'} seconds`);
    
    // Return the session data in the expected format
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 60 * 60 * 24 * 7, // Default to 1 week if not specified
      token_type: tokenData.token_type || 'bearer'
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
