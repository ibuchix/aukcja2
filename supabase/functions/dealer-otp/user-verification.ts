
import { HttpError, NotFoundError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies if a user exists by email
 */
export async function verifyUserExists(supabase: SupabaseClient, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  try {
    // Use the database function instead of direct table access
    // This is more reliable as it explicitly uses SECURITY DEFINER
    console.log("Checking if email exists using database function");
    const { data: emailCheck, error: emailError } = await supabase
      .rpc('check_email_exists', { email_to_check: email });
    
    if (emailError) {
      console.error("Error checking if email exists:", emailError);
      throw new HttpError(`Failed to verify email address: ${emailError.message}`, 500);
    }
    
    // Check if the data is in the expected format
    const userExists = typeof emailCheck === 'object' && emailCheck && 'exists' in emailCheck 
      ? emailCheck.exists 
      : false;
    
    if (!userExists) {
      console.log("User not found for email:", email);
      throw new NotFoundError("Invalid email address");
    }
    
    // Get user ID using direct service role query instead of database function
    // This ensures we're getting the exact user ID that Supabase auth uses
    console.log("Getting user ID directly using service role");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // Use direct API call to auth users endpoint
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error getting user by email: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new HttpError(`Failed to verify email address: ${response.statusText}`, 500);
    }
    
    const userData = await response.json();
    console.log(`Auth API returned ${userData.users ? userData.users.length : 0} users`);
    
    if (!userData.users || userData.users.length === 0) {
      console.error("No users found with email:", email);
      throw new NotFoundError("Invalid email address - no user found");
    }
    
    const user = userData.users[0];
    console.log("User found with ID:", user.id);
    
    return { id: user.id };
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
    // Get user directly via admin API instead of using database function
    // This ensures we're getting the exact ID that Supabase auth uses
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    // Use direct API call to auth users endpoint
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Error getting user by email: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new HttpError(`Failed to authenticate user: ${response.statusText}`, 500);
    }
    
    const userData = await response.json();
    console.log(`Auth API returned ${userData.users ? userData.users.length : 0} users`);
    
    if (!userData.users || userData.users.length === 0) {
      console.error("No users found with email:", email);
      throw new HttpError("Failed to authenticate user - user not found", 404);
    }
    
    const user = userData.users[0];
    console.log("Found user with ID:", user.id);
    
    return { id: user.id };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Exception in getUserByEmail:", error);
    throw new HttpError("Failed to authenticate user", 500);
  }
}
