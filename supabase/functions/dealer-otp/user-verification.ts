
import { HttpError, NotFoundError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user exists by email
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  try {
    // Test database access first
    try {
      const { error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error("Database access test failed:", testError);
        throw new HttpError("Failed to verify email address - database access error", 500);
      }
    } catch (dbError) {
      console.error("Database access test exception:", dbError);
      throw new HttpError("Failed to verify email address - database connection error", 500);
    }
    
    // Use the database function to safely check if email exists
    const { data, error } = await supabase
      .rpc('check_email_exists', { email_to_check: email });
    
    if (error) {
      console.error("Error checking if email exists:", error);
      throw new HttpError(`Failed to verify email address: ${error.message}`, 500);
    }
    
    // Check if the data is in the expected format
    const userExists = typeof data === 'object' && data && 'exists' in data 
      ? data.exists 
      : typeof data === 'number' 
        ? data > 0 
        : false;
    
    if (!userExists) {
      console.log("User not found for email:", email);
      throw new NotFoundError("Invalid email address");
    }
    
    // Get user ID using database function
    const { data: userData, error: userIdError } = await supabase
      .rpc('get_user_id_by_email', { p_email: email });
    
    if (userIdError || !userData) {
      console.error("Error getting user ID:", userIdError);
      throw new HttpError(`Failed to verify email address: ${userIdError?.message || 'User ID not found'}`, 500);
    }
    
    console.log("User found with ID:", userData.id);
    return { id: userData.id };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof HttpError) {
      throw error;
    }
    console.error("Exception in verifyUserExists:", error);
    throw new HttpError("Failed to verify email address", 500);
  }
}

/**
 * Gets user information by email
 */
export async function getUserByEmail(supabase: SupabaseClient, email: string) {
  console.log(`Getting user information for ${email}`);
  
  try {
    // Get user ID using our database function
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_id_by_email', { p_email: email });
    
    if (userError) {
      console.error("User fetch failed:", userError);
      throw new HttpError(`Failed to authenticate user: ${userError.message}`, 500);
    }
    
    if (!userData) {
      console.error("User not found for email:", email);
      throw new HttpError("Failed to authenticate user - user not found", 404);
    }
    
    console.log("Found user with ID:", userData.id);
    return { id: userData.id };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Exception in getUserByEmail:", error);
    throw new HttpError("Failed to authenticate user", 500);
  }
}
