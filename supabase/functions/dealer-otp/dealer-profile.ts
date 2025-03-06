
import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient, callRpcSafely } from "../_shared/supabase-client.ts";

/**
 * Gets dealer profile information
 */
export async function getDealerProfile(supabase: SupabaseClient, userId: string) {
  console.log(`Getting dealer profile for user ${userId}`);
  
  // Ensure we have a service role client for this operation
  try {
    if (!userId) {
      console.error("getDealerProfile called with null/empty userId");
      return null;
    }

    // Use the shared service client creation helper
    const serviceClient = createServiceClient();
    console.log("Created service client for dealer profile lookup");
    
    // Use exact parameter name format that PostgreSQL function expects
    console.log(`Calling get_dealer_by_user_id with formatted parameter object`);
    const params = { "p_user_id": userId };
    console.log(`Parameters: ${JSON.stringify(params)}`);
    
    // Use the secure RPC function with improved parameter handling
    const { data, error } = await callRpcSafely(
      serviceClient,
      'get_dealer_by_user_id',
      params
    );
    
    if (error) {
      console.error("Error calling get_dealer_by_user_id:", error.message);
      console.error("Error details:", JSON.stringify(error));
      
      // Debug: Perform a direct SQL check when in development
      console.log(`Direct check: Verify dealer exists for user ${userId}`);
      return null;
    }
    
    if (!data) {
      console.log(`No dealer profile found for user ${userId} using RPC function`);
      console.log(`This may indicate the dealer record doesn't exist or has a different user_id`);
      return null;
    }
    
    console.log("Successfully retrieved dealer profile using RPC function");
    return data;
    
  } catch (error) {
    console.error("Exception in getDealerProfile:", error);
    return null;
  }
}
