
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";

/**
 * Sign in with email and password using the dealer-auth edge function
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
    
    // Add diagnostic logging
    console.log("Sign in request:", { 
      email: normalizedEmail,
      passwordLength: cleanedPassword.length,
      // Log first and last character code for debugging without revealing password
      passwordFirstCharCode: cleanedPassword.charCodeAt(0),
      passwordLastCharCode: cleanedPassword.charCodeAt(cleanedPassword.length - 1)
    });

    // Try using the edge function first
    try {
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'login',
          email: normalizedEmail,
          password: cleanedPassword,
          requestId: crypto.randomUUID()
        }
      });
      
      if (error) {
        console.error("Edge function sign in error:", error);
        console.error("Error code:", error.status, "Error message:", error.message);
        // Fall back to standard auth below
      } else if (data && data.success) {
        console.log("Edge function sign in successful for:", email);
        // Store the session
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }
        return { data, error: null };
      }
    } catch (edgeError) {
      console.error("Edge function call failed:", edgeError);
      // Fall back to standard auth below
    }
    
    // Fall back to standard auth if edge function fails or isn't available
    console.log("Falling back to standard auth for:", email);
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
