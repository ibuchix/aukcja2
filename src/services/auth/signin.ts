
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";

/**
 * Sign in with email and password
 */
export async function signInWithEmail({ email, password }: { email: string; password: string }) {
  try {
    console.log("Attempting sign in for:", email);
    
    // Use consistent password preparation
    const cleanedPassword = preparePassword(password);
    
    // Check for empty password after cleaning
    if (!cleanedPassword) {
      console.error("Sign in error: Empty password after preparation");
      return { error: new Error("Password cannot be empty") };
    }
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Skip edge function and use standard auth directly
    console.log("Using standard auth for:", normalizedEmail);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: cleanedPassword
    });
    
    if (error) {
      console.error("Standard sign in error:", error);
      console.error("Error code:", error.status, "Error message:", error.message);
      return { error };
    }
    
    console.log("Standard sign in successful for:", email);
    return { data, error: null };
  } catch (error) {
    console.error("Sign in exception:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
