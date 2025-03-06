
import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { callRpcSafely } from "../_shared/supabase-client.ts";

/**
 * Generates a temporary exchange token for client-side session creation
 */
export async function generateExchangeToken(userId: string, email: string) {
  console.log(`Generating exchange token for user ${userId}`);
  
  try {
    // Get JWT secret
    const jwtSecret = Deno.env.get("JWT_SECRET");
    
    if (!jwtSecret) {
      throw new Error("Missing JWT secret");
    }
    
    // Create a key for signing from the JWT secret
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Create a temporary token with a short expiry (5 minutes)
    const exchangeToken = await create(
      { 
        alg: "HS256", 
        typ: "JWT" 
      },
      { 
        sub: userId,
        email: email,
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minute expiry
        type: "dealer-exchange-token"
      },
      key
    );
    
    console.log("Exchange token generated successfully");
    return exchangeToken;
    
  } catch (error) {
    console.error("Exchange token generation failed:", error);
    throw new HttpError(`Failed to generate token: ${error.message || 'Unknown error'}`, 500);
  }
}

/**
 * Creates a session for a user using Supabase Admin API
 */
export async function createUserSession(supabase: SupabaseClient, userId: string, userEmail: string) {
  console.log(`Creating session for user ${userId} with email ${userEmail.substring(0, 3)}...`);
  
  try {
    // Get Supabase URL and service key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const projectId = supabaseUrl?.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
    
    if (!supabaseUrl || !serviceRoleKey || !projectId) {
      throw new Error('Missing required Supabase environment variables or invalid URL format');
    }

    // Create admin client for session management with properly formatted headers
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            // Ensure correct case for headers
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      }
    );
    
    // First verify that the user exists
    console.log(`Verifying user ${userId} exists before creating session`);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error(`Error verifying user: ${userError?.message || 'User not found'}`);
      throw new HttpError(`User with ID ${userId} not found`, 404);
    }
    
    console.log('User verified, creating session...');

    // Correctly construct the full URL for the edge function
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/create-dealer-session`;
    console.log(`Calling edge function at: ${edgeFunctionUrl}`);

    // Call the create-dealer-session edge function with the full URL and proper headers
    const createSessionResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        userId: userId,
        email: userEmail
      })
    });
    
    if (!createSessionResponse.ok) {
      const errorText = await createSessionResponse.text();
      console.error('Error response from create-dealer-session:', errorText);
      throw new HttpError(`Failed to create session: ${errorText || createSessionResponse.statusText}`, createSessionResponse.status);
    }
    
    const sessionData = await createSessionResponse.json();
    
    if (!sessionData.success) {
      console.error('Invalid session data returned:', sessionData);
      throw new HttpError('Failed to create valid session', 500);
    }
    
    console.log('Session created successfully');
    
    // Return the exchange token if available, otherwise the session
    if (sessionData.exchangeToken) {
      return { exchangeToken: sessionData.exchangeToken };
    }
    
    // Return the session object from the edge function
    return sessionData.session;
    
  } catch (error) {
    console.error("Session creation failed:", error);
    if (error instanceof HttpError) {
      throw error;
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
  
  // Ensure we have a service role client for this operation
  try {
    // Create a fresh service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase credentials for service role access");
      throw new Error("Missing service role credentials");
    }
    
    // Create a new client with the service role key
    const serviceClient = createClient(
      supabaseUrl, 
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      }
    );
    
    console.log("Created service client for dealer profile lookup");
    
    // Use the secure RPC function only - no fallback to direct query
    const { data, error } = await callRpcSafely(
      serviceClient,
      'get_dealer_by_user_id',
      { p_user_id: userId }
    );
    
    if (error) {
      console.error("Error calling get_dealer_by_user_id:", error.message);
      console.error("Error details:", JSON.stringify(error));
      return null;
    }
    
    if (!data) {
      console.log(`No dealer profile found for user ${userId} using RPC function`);
      return null;
    }
    
    console.log("Successfully retrieved dealer profile using RPC function");
    return data;
    
  } catch (error) {
    console.error("Exception in getDealerProfile:", error);
    return null;
  }
}
