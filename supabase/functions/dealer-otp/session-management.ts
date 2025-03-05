
import { HttpError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a session for a user
 */
export async function createUserSession(supabase: SupabaseClient, userId: string) {
  console.log(`Creating session for user ${userId}`);
  
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
    user_id: userId,
    expires_in: 60 * 60 * 24 * 7 // 1 week
  });
  
  if (sessionError || !sessionData) {
    console.error("Session creation failed:", sessionError);
    throw new HttpError("Failed to create user session", 500);
  }
  
  console.log("Session created successfully");
  return sessionData;
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
