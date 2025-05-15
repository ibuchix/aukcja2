
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";
import { toast } from "@/hooks/use-toast";

/**
 * Sign in with email and password using the edge function
 * No fallback to standard auth - we're fixing the edge function approach
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
    
    // Add diagnostic logging for password length
    console.log("Password length after preparation:", cleanedPassword.length, 
                "First char code:", cleanedPassword.charCodeAt(0),
                "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Call edge function for custom login logic and device tracking
    console.log("Calling edge function for:", normalizedEmail);
    
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'login',
        email: normalizedEmail,
        password: cleanedPassword,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }
    });
    
    if (edgeError) {
      console.error("Edge function error:", edgeError);
      return { error: edgeError };
    }
    
    if (!edgeData || !edgeData.success) {
      console.error("Edge function returned error:", edgeData?.error || "Unknown error");
      return { error: new Error(edgeData?.error || "Authentication failed") };
    }
    
    console.log("Edge function login successful for:", email);
    
    // Set session in supabase client
    if (edgeData.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: edgeData.session.access_token,
        refresh_token: edgeData.session.refresh_token
      });
      
      if (setSessionError) {
        console.error("Error setting session:", setSessionError);
        return { error: setSessionError };
      }
      
      // Return successful response with session and user data
      return { 
        data: { 
          session: edgeData.session, 
          user: edgeData.user 
        }, 
        error: null 
      };
    } else {
      return { error: new Error("No session in edge function response") };
    }
  } catch (error) {
    console.error("Sign in exception:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
