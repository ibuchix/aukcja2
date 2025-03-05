
import { HttpError, NotFoundError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user exists by email
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  try {
    // Use the database function to safely check if email exists
    const { data, error } = await supabase
      .rpc('check_email_exists', { email_to_check: email });
    
    if (error) {
      console.error("Error checking if email exists:", error);
      throw new HttpError("Failed to verify email address", 500);
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
      throw new HttpError("Failed to verify email address", 500);
    }
    
    console.log("User found with ID:", userData.id);
    return { id: userData.id };
  } catch (error) {
    if (error instanceof NotFoundError) {
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
    
    if (userError || !userData) {
      console.error("User fetch failed:", userError || "User not found");
      throw new HttpError("Failed to authenticate user", 500);
    }
    
    console.log("Found user with ID:", userData.id);
    return { id: userData.id };
  } catch (error) {
    console.error("Exception in getUserByEmail:", error);
    throw new HttpError("Failed to authenticate user", 500);
  }
}
