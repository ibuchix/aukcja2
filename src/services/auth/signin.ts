
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
    
    // Create request body without JSON.stringify
    const requestBody = {
      action: 'login',
      email: email.trim().toLowerCase(),
      password: cleanedPassword,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // Log the request we're about to send (sanitized)
    console.log("Sending login request:", {
      ...requestBody,
      password: "[REDACTED]"
    });
    
    // Call the dealer-auth edge function WITHOUT stringifying the body
    const { data, error } = await supabase.functions.invoke('dealer-auth', {
      body: requestBody, // Pass the object directly
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

// New direct fetch implementation for comparison testing
export const signInWithEmailDirect = async ({ email, password }: SignInParams) => {
  console.log("Starting direct fetch login process");
  
  try {
    // Use the same password preparation for consistency
    const cleanedPassword = preparePassword(password);
    
    // Add diagnostic logging
    console.log("Direct fetch login password length:", cleanedPassword.length, 
             "First char code:", cleanedPassword.charCodeAt(0),
             "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
    
    // Create the same request body format
    const requestBody = {
      action: 'login',
      email: email.trim().toLowerCase(),
      password: cleanedPassword,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // Log request details (sanitized)
    console.log("Direct fetch sending request:", {
      ...requestBody,
      password: "[REDACTED]"
    });
    
    // Get Supabase URL and anon key for the fetch request
    const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";
    
    // Build the full URL
    const url = `${supabaseUrl}/functions/v1/dealer-auth`;
    
    console.log("Direct fetch URL:", url);
    
    // Send the direct fetch request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(requestBody)
    });
    
    // Log response status and headers
    console.log("Direct fetch response status:", response.status);
    console.log("Direct fetch response headers:", Object.fromEntries([...response.headers.entries()]));
    
    // Try to get text response first for debugging
    const responseText = await response.text();
    console.log("Direct fetch raw response:", responseText);
    
    // Parse the JSON response if possible
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error("Error parsing direct fetch response:", e);
      return {
        error: { 
          message: "Invalid response format", 
          status: response.status,
          name: 'ParseError'
        }
      };
    }
    
    // Handle errors
    if (!response.ok) {
      return {
        error: { 
          message: data?.error || "Authentication failed", 
          status: response.status,
          name: 'DirectFetchError'
        }
      };
    }
    
    // Check for success flag in the response
    if (data && !data.success) {
      return {
        error: { 
          message: data.error || "Authentication failed", 
          status: 401,
          name: 'AuthError'
        }
      };
    }
    
    // Return success data in same format as supabase client
    return {
      data: {
        user: data.user,
        session: data.session
      }
    };
  } catch (err) {
    console.error("Exception during direct fetch login:", err);
    return {
      error: { 
        message: err instanceof Error ? err.message : "Unknown login error", 
        status: 500,
        name: 'DirectFetchError'
      }
    };
  }
};
