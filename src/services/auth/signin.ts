
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";
import { toast } from "@/hooks/use-toast";

/**
 * Sign in with email and password using the edge function first
 * and falling back to standard auth only if the edge function fails
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
    
    // Try edge function first - it implements custom login logic and device tracking
    try {
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
        throw edgeError; // Let the catch block handle the fallback
      }
      
      if (!edgeData || !edgeData.success) {
        console.error("Edge function returned error:", edgeData?.error || "Unknown error");
        throw new Error(edgeData?.error || "Authentication failed");
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
          throw setSessionError;
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
        throw new Error("No session in edge function response");
      }
    } catch (edgeFunctionError) {
      // Log edge function error with more details
      console.error("Edge function sign in error:", edgeFunctionError);
      console.error("Error type:", typeof edgeFunctionError);
      if (edgeFunctionError instanceof Error) {
        console.error("Error details:", edgeFunctionError.message);
      }
      
      console.log("Edge function failed, falling back to standard auth for:", normalizedEmail);
    }
    
    // Standard Supabase auth as fallback
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
