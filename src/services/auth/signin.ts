
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: cleanedPassword
    });
    
    if (error) {
      console.error("Sign in error:", error);
      console.error("Error code:", error.status, "Error message:", error.message);
      return { error };
    }
    
    console.log("Sign in successful for:", email);
    return { data, error: null };
  } catch (error) {
    console.error("Sign in exception:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
