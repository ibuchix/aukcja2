
import { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "../_shared/error-handling.ts";

/**
 * Verifies that a user with the specified email exists
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  try {
    console.log(`Checking if user exists with email: ${email.substring(0, 3)}...`);
    
    // Check if the user exists using the check_email_exists function
    const { data, error } = await supabase.rpc('check_email_exists', { 
      email_to_check: email 
    });
    
    if (error) {
      console.error("Error checking if user exists:", error);
      throw new Error(`Database error checking user: ${error.message}`);
    }
    
    let exists = false;
    
    if (data !== null) {
      if (typeof data === 'object' && 'exists' in data) {
        exists = Boolean(data.exists);
      } else if (typeof data === 'number') {
        exists = data > 0;
      } else if (typeof data === 'boolean') {
        exists = data;
      }
    }
    
    if (!exists) {
      console.error(`User not found for email: ${email.substring(0, 3)}...`);
      throw new NotFoundError("No account found with this email address");
    }
    
    console.log(`User exists with email: ${email.substring(0, 3)}...`);
    return true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Exception in verifyUserExists:", error);
    throw new Error("Failed to verify user account");
  }
}

/**
 * Gets user details by email
 */
export async function getUserByEmail(supabase: SupabaseClient, email: string) {
  try {
    console.log(`Getting user by email: ${email.substring(0, 3)}...`);
    
    // Get user ID from email
    const { data, error } = await supabase.rpc('get_user_id_by_email', { 
      p_email: email 
    });
    
    if (error) {
      console.error("Error getting user ID by email:", error);
      throw new Error(`Database error retrieving user: ${error.message}`);
    }
    
    if (!data || !data.id) {
      console.error(`User not found for email: ${email.substring(0, 3)}...`);
      throw new NotFoundError("No account found with this email address");
    }
    
    console.log(`Found user with ID: ${data.id}`);
    return { id: data.id, email: email };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error("Exception in getUserByEmail:", error);
    throw new Error("Failed to retrieve user account");
  }
}
