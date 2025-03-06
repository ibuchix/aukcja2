import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a session for a user using Supabase Admin API
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
    
    // Generate auth link using current Admin API endpoint
    console.log(`User verified, generating auth link for ${userId}`);
    
    const generateLinkUrl = `${supabaseUrl}/auth/v1/admin/generate_link`;
    console.log(`Using generate_link endpoint: ${generateLinkUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    };
    
    const requestBody = {
      type: 'magiclink',
      email: userId, // The user's email
      options: {
        data: {
          userId: userId
        },
        redirect_to: null, // No redirect needed since we're handling programmatically
      }
    };
    
    console.log('Sending request to generate auth link...');
    const response = await fetch(generateLinkUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    // Debug the response
    console.log(`Generate link API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error generating auth link: ${errorText}`);
      throw new HttpError(`Failed to create session: ${response.status} ${response.statusText}`, 500);
    }
    
    const linkData = await response.json();
    console.log('Successfully generated auth link');
    
    // Extract the properties we need for the session
    return {
      access_token: linkData.properties.access_token,
      refresh_token: linkData.properties.refresh_token,
      expires_in: 60 * 60 * 24 * 7 // 1 week
    };
    
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
