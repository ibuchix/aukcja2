
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";

interface SignInParams {
  email: string;
  password: string;
}

export const signInWithEmail = async ({ email, password }: SignInParams) => {
  console.log("Starting edge function sign in process");
  
  try {
    // Use consistent password preparation
    const cleanedPassword = preparePassword(password);
    
    // Add diagnostic logging for password length
    console.log("Login password length after preparation:", cleanedPassword.length, 
             "First char code:", cleanedPassword.charCodeAt(0),
             "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
    
    // Call the dealer-auth edge function for authentication
    const { data, error } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'login',
        email: email.trim().toLowerCase(),
        password: cleanedPassword,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      },
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
    
    if (error) {
      console.error("Edge function login error:", error);
      console.error("Sign in error details:", error);
      
      // Check if error contains a more specific error message from the edge function
      let errorMessage = error.message;
      try {
        // Try to extract the error message from the response
        if (typeof error.message === 'string' && error.message.includes('{')) {
          const errorJson = JSON.parse(error.message.substring(error.message.indexOf('{')));
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        }
      } catch (e) {
        // If parsing fails, use the original error message
      }
      
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('network')) {
        return {
          error: { 
            message: "Network error connecting to authentication service. Please try again.", 
            status: 503,
            name: 'NetworkError'
          }
        };
      }
      
      // For 401 errors, provide more user-friendly message
      if (error.status === 401) {
        return {
          error: { 
            message: "Invalid email or password. Please check your credentials and try again.", 
            status: 401,
            name: 'InvalidCredentials'
          }
        };
      }
      
      return {
        error: { 
          message: errorMessage || "Login failed", 
          status: error.status || 500,
          name: error.name || 'AuthError'
        }
      };
    }
    
    if (!data) {
      console.error("Empty response from edge function");
      return {
        error: { 
          message: "No response from authentication service", 
          status: 500,
          name: 'EmptyResponseError'
        }
      };
    }
    
    // Parse the response
    const response = data as any;
    
    if (!response.success) {
      console.error("Login failed with edge function error:", response.error);
      return {
        error: { 
          message: response.error || "Authentication failed", 
          status: 401,
          name: 'AuthError'
        }
      };
    }
    
    // Store the session in localStorage under the correct key
    if (response.session) {
      // The session is automatically stored by the client library,
      // but we log some diagnostic information
      console.log("Edge function login successful:", response.user?.id);
    } else {
      console.warn("Edge function login returned success but no session");
    }
    
    return {
      data: {
        user: response.user,
        session: response.session
      }
    };
  } catch (err) {
    console.error("Exception during edge function login:", err);
    return {
      error: { 
        message: err instanceof Error ? err.message : "Unknown login error", 
        status: 500,
        name: 'UnknownError'
      }
    };
  }
};
