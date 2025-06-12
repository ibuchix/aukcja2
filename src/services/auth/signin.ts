
import { supabase, rawSupabaseClient } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";

interface SignInParams {
  email: string;
  password: string;
}

export const signInWithEmail = async ({ email, password }: SignInParams) => {
  console.log("🚀 Starting enhanced sign in process with proper session management");
  
  try {
    // Use consistent password preparation
    const cleanedPassword = preparePassword(password);
    
    // Add diagnostic logging for password length
    console.log("🔐 Login password length after preparation:", cleanedPassword.length, 
             "First char code:", cleanedPassword.charCodeAt(0),
             "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
    
    // Create request body
    const requestBody = {
      action: 'login',
      email: email.trim().toLowerCase(),
      password: cleanedPassword,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // Get Supabase URL and anon key for the fetch request
    const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";
    
    // Log the request we're about to send (sanitized)
    console.log("📤 Sending login request:", {
      ...requestBody,
      password: "[REDACTED]"
    });
    
    // Build the full URL
    const url = `${supabaseUrl}/functions/v1/dealer-auth`;
    
    console.log("🌐 Direct fetch URL:", url);
    
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
    console.log("📥 Login response status:", response.status);
    console.log("📥 Login response headers:", Object.fromEntries([...response.headers.entries()]));
    
    // Try to get text response first for debugging
    const responseText = await response.text();
    console.log("📄 Login raw response:", responseText);
    
    // If response isn't successful, handle error
    if (!response.ok) {
      console.error("❌ Login failed with status:", response.status);
      
      // Try to extract more specific error from response text
      let errorMsg = "Authentication failed";
      let errorStatus = response.status;
      let errorName = 'AuthError';
      
      try {
        if (responseText) {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {
        console.error("❌ Could not parse error response:", e);
      }
      
      // For 401 errors, provide more user-friendly message
      if (errorStatus === 401) {
        errorMsg = "Invalid email or password. Please check your credentials and try again.";
        errorName = 'InvalidCredentials';
      }
      
      return {
        error: { 
          message: errorMsg,
          status: errorStatus,
          name: errorName
        }
      };
    }
    
    // Parse the JSON response if possible
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error("❌ Error parsing login response:", e);
      return {
        error: { 
          message: "Invalid response format", 
          status: response.status,
          name: 'ParseError'
        }
      };
    }
    
    if (!data) {
      console.error("❌ Empty response from edge function");
      return {
        error: { 
          message: "No response from authentication service", 
          status: 500,
          name: 'EmptyResponseError'
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
    
    // CRITICAL: Properly set the session in the Supabase client
    if (data.session) {
      console.log("✅ Login successful with session, setting session in client...");
      
      try {
        // Set the auth session in Supabase client and WAIT for it to complete
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        if (sessionError) {
          console.error("❌ Failed to set session in client:", sessionError);
          return {
            error: { 
              message: `Failed to establish session: ${sessionError.message}`, 
              status: 500,
              name: 'SessionError'
            }
          };
        }
        
        console.log("✅ Session successfully set in Supabase client");
        
        // Verify the session was set correctly
        const { data: verifySession } = await supabase.auth.getSession();
        if (verifySession.session?.access_token === data.session.access_token) {
          console.log("✅ Session verification successful");
        } else {
          console.warn("⚠️ Session verification mismatch");
        }
        
      } catch (sessionSetError) {
        console.error("❌ Exception setting session:", sessionSetError);
        return {
          error: { 
            message: `Session setup failed: ${sessionSetError instanceof Error ? sessionSetError.message : 'Unknown error'}`, 
            status: 500,
            name: 'SessionSetupError'
          }
        };
      }
    } else {
      console.warn("⚠️ Login returned success but no session");
    }
    
    // Return success data in same format as supabase client would
    return {
      data: {
        user: data.user,
        session: data.session
      }
    };
  } catch (err) {
    console.error("❌ Exception during login:", err);
    return {
      error: { 
        message: err instanceof Error ? err.message : "Unknown login error", 
        status: 500,
        name: 'UnknownError'
      }
    };
  }
};

// Keep the direct fetch implementation for testing
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
