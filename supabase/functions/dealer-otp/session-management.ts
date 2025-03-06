
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
    
    // Fix: Using the correct Auth API for session generation
    // In Supabase JS v2, we need to use admin.createSession for this purpose
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId
    });
    
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new HttpError(`Failed to create session: ${sessionError.message}`, 500);
    }
    
    if (!sessionData) {
      console.error('No session data returned');
      throw new HttpError('Failed to create session - no data returned', 500);
    }
    
    console.log('Session created successfully');
    
    // Return the session data
    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      token_type: sessionData.session.token_type
    };
    
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
