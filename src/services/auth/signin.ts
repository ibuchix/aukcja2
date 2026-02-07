
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword } from '@/utils/authValidation';
import { withAuthGuard } from '@/utils/authGuard';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';
import { preparePassword } from "@/utils/auth-utils";

interface SignInParams {
  email: string;
  password: string;
  turnstileToken?: string;
}

export const signInWithEmail = async ({ email, password, turnstileToken }: SignInParams) => {
  console.log("🚀 Starting enhanced sign in process");
  
  try {
    // Use consistent password preparation
    const cleanedPassword = preparePassword(password);
    
    // Add diagnostic logging for password length
    console.log("🔐 Login password length after preparation:", cleanedPassword.length);
    
    // Create request body
    const requestBody: Record<string, unknown> = {
      action: 'login',
      email: email.trim().toLowerCase(),
      password: cleanedPassword,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Include turnstile token if available
    if (turnstileToken) {
      requestBody.turnstileToken = turnstileToken;
    }
    
    // Get Supabase URL and anon key for the fetch request
    const supabaseUrl = SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY;
    
    // Log the request we're about to send (sanitized)
    console.log("📤 Sending login request:", {
      ...requestBody,
      password: "[REDACTED]",
      turnstileToken: turnstileToken ? "[PRESENT]" : "[MISSING]"
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
    
    // Log response status
    console.log("📥 Login response status:", response.status);
    
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
    
    // Enhanced session handling with proper structure validation
    if (data.session) {
      console.log("✅ Login successful with session, validating session structure...");
      
      // Validate session structure before setting
      const sessionData = data.session;
      if (!sessionData.access_token || !sessionData.refresh_token) {
        console.error("❌ Invalid session structure from edge function:", {
          hasAccessToken: !!sessionData.access_token,
          hasRefreshToken: !!sessionData.refresh_token,
          hasUser: !!data.user
        });
        return {
          error: { 
            message: "Invalid session data received", 
            status: 500,
            name: 'InvalidSessionError'
          }
        };
      }
      
      try {
        // Set the auth session in Supabase client with enhanced error handling
        console.log("🔄 Setting session in Supabase client...");
        const { data: sessionSetResult, error: sessionError } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
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
        
        // Verify session was actually set by checking current session
        const { data: verifySession } = await supabase.auth.getSession();
        if (!verifySession.session) {
          console.warn("⚠️ Session verification failed - session not found after setSession");
        } else {
          console.log("✅ Session verification successful");
        }
        
        // Return success with proper session structure
        return {
          data: {
            user: sessionSetResult.user || data.user,
            session: sessionSetResult.session || {
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token,
              user: data.user,
              expires_at: sessionData.expires_at
            }
          }
        };
        
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
      
      // Still return success if the edge function says it was successful
      return {
        data: {
          user: data.user,
          session: null
        }
      };
    }
    
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
    console.log("Direct fetch login password length:", cleanedPassword.length);
    
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
    const supabaseUrl = SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY;
    
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
    
    // Log response status
    console.log("Direct fetch response status:", response.status);
    
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
