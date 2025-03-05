
import { HttpError, NotFoundError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user exists by email
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  // Use the database function to safely check if email exists
  const { data, error } = await supabase
    .rpc('check_email_exists', { email_to_check: email });
  
  if (error) {
    console.error("Error checking if email exists:", error);
    throw new HttpError("Failed to verify email address", 500);
  }
  
  // The first function returns a count, the second returns an object with exists property
  // Handle both possible return types
  const userExists = typeof data === 'number' ? data > 0 : 
                    (data && typeof data === 'object' && 'exists' in data) ? data.exists : false;
  
  if (!userExists) {
    console.log("User not found for email:", email);
    throw new NotFoundError("Invalid email address");
  }
  
  // Get user ID using raw SQL query since we can't directly access auth.users
  const { data: userData, error: userIdError } = await supabase
    .rpc('get_user_id_by_email', { p_email: email });
  
  if (userIdError || !userData) {
    console.error("Error getting user ID:", userIdError);
    throw new HttpError("Failed to verify email address", 500);
  }
  
  console.log("User found with ID:", userData.id);
  return { id: userData.id };
}

/**
 * Gets user information by email
 */
export async function getUserByEmail(supabase: SupabaseClient, email: string) {
  console.log(`Getting user information for ${email}`);
  
  // Get user ID using our database function
  const { data: userData, error: userError } = await supabase
    .rpc('get_user_id_by_email', { p_email: email });
  
  if (userError || !userData) {
    console.error("User fetch failed:", userError || "User not found");
    throw new HttpError("Failed to authenticate user", 500);
  }
  
  console.log("Found user with ID:", userData.id);
  return { id: userData.id };
}
