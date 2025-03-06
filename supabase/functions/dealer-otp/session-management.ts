
import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient, createClient } from '@supabase/supabase-js';

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

    // Create admin client for session management
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
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

    // Call the create-dealer-session edge function
    const createSessionResponse = await fetch(`${supabaseUrl}/functions/v1/create-dealer-session`, {
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
    
    if (!sessionData.success || !sessionData.session) {
      console.error('Invalid session data returned:', sessionData);
      throw new HttpError('Failed to create valid session', 500);
    }
    
    console.log('Session created successfully');
    
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
