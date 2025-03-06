
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
      
      try {
        // Directly query the database as a backup check
        const { data: directData, error: directError } = await serviceClient
          .from('dealers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (directError) {
          console.error("Direct query also failed:", directError.message);
        } else if (directData) {
          console.log("Found dealer via direct query - RPC function may have issues");
          return directData;
        } else {
          console.log("No dealer found via direct query either - profile likely missing");
        }
      } catch (directQueryError) {
        console.error("Exception in direct dealer query:", directQueryError);
      }
      
      return null;
    }
    
    if (!data) {
      console.log(`No dealer profile found for user ${userId} using RPC function`);
      console.log(`This may indicate the dealer record doesn't exist or has a different user_id`);
      
      // Check if user exists in profiles table but not in dealers table
      try {
        const { data: profileData, error: profileError } = await serviceClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileData && !profileError) {
          console.log("User found in profiles but dealer profile is missing");
          
          // Return a special marker that indicates profile exists but needs completion
          return { 
            needsProfileCompletion: true,
            userId: userId,
            profileData: profileData 
          };
        }
      } catch (profileCheckError) {
        console.error("Exception checking profile:", profileCheckError);
      }
      
      return null;
    }
    
    console.log("Successfully retrieved dealer profile using RPC function");
    return data;
    
  } catch (error) {
    console.error("Exception in getDealerProfile:", error);
    return null;
  }
}
