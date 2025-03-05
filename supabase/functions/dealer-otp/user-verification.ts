
import { HttpError, NotFoundError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user exists by email
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  
  if (userError) {
    console.error("Error querying auth.users table:", userError);
    throw new HttpError("Failed to verify email address", 500);
  }
  
  if (!userData) {
    console.log("User not found for email:", email);
    throw new NotFoundError("Invalid email address");
  }
  
  console.log("User found with ID:", userData.id);
  return userData;
}

/**
 * Gets user information by email
 */
export async function getUserByEmail(supabase: SupabaseClient, email: string) {
  console.log(`Getting user information for ${email}`);
  
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (userError || !userData) {
    console.error("User fetch failed:", userError || "User not found");
    throw new HttpError("Failed to authenticate user", 500);
  }
  
  console.log("Found user with ID:", userData.id);
  return userData;
}
