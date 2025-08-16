
import { validateEmail, safeTrim } from "./validation";
import { 
  SignUpResult, 
  UserMetadata
} from "./models";
import { supabase } from "@/integrations/supabase/client";
import { preparePassword } from "@/utils/auth-utils";

/**
 * Handles the signup process for dealers with consistent password authentication
 */
export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    console.log("Starting dealer signup process...");

    // Use centralized email validation with better error handling
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }

    // Note: Email existence check is now handled by the edge function
    // This prevents race conditions and inconsistencies

    // Use consistent password preparation
    const cleanedPassword = preparePassword(password);
    
    // Validate password
    if (!cleanedPassword) {
      return { success: false, error: "Password cannot be empty" };
    }
    
    // Log password length and first/last character for debugging
    console.log("Password length:", cleanedPassword.length, 
                "First char code:", cleanedPassword.charCodeAt(0),
                "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));

    // Validate required metadata with better handling
    if (!safeTrim(metadata.name)) {
      return { success: false, error: "Name is required" };
    }

    try {
      console.log("Calling dealer-auth function with register action");
      
      // Create request body
      const requestBody = {
        action: 'register',
        email: safeTrim(email).toLowerCase(),
        password: cleanedPassword,
        metadata: {
          name: safeTrim(metadata.name),
          companyName: safeTrim(metadata.companyName || ''),
          taxId: safeTrim(metadata.taxId || ''),
          businessRegistryNumber: safeTrim(metadata.businessRegistryNumber || ''),
          companyAddress: safeTrim(metadata.companyAddress || ''),
          phoneNumber: safeTrim(metadata.phoneNumber || '')
        },
        passwordless: false,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      
      // Get Supabase URL and anon key for the fetch request
      const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";
      
      // Create sanitized body for logging
      const sanitizedBody = {
        ...requestBody,
        password: '[REDACTED]'
      };
      console.log("Registration request body:", sanitizedBody);
      
      // Send the direct fetch request
      const response = await fetch(`${supabaseUrl}/functions/v1/dealer-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Signup response status:", response.status);
      
      // Try to get text response first for debugging
      const responseText = await response.text();
      console.log("Signup raw response:", responseText);
      
      // If response isn't successful, handle error
      if (!response.ok) {
        console.error("Signup failed with status:", response.status);
        
        // Enhanced error handling for network issues
        if (response.status === 0 || response.status >= 500) {
          return {
            success: false,
            error: "Network error connecting to registration service. Please try again.",
            errorType: 'network'
          };
        }
        
        // Try to extract more specific error from response text
        let errorMsg = "Registration failed with server error";
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.error || errorMsg;
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Parse the JSON response if possible
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error("Error parsing signup response:", e);
        return {
          success: false,
          error: "Invalid response format from registration service"
        };
      }
      
      if (!data) {
        console.error("Empty response from registration service");
        return {
          success: false,
          error: "No response from registration service"
        };
      }
      
      // Parse the response
      const response_data = data;
      
      if (!response_data.success) {
        console.error("Registration failed with error:", response_data.error);
        
        // Check if this is actually a successful registration scenario (edge function returning success)
        if (response_data.message?.includes('Registration successful') || 
            response_data.message?.includes('already fully registered')) {
          console.log("Detected successful registration despite success=false flag");
          return {
            success: true,
            userId: response_data.userId,
            message: response_data.message || "Registration successful. You can now log in to your account.",
            existingUser: true
          };
        }
        
        return {
          success: false,
          error: response_data.error || "Registration failed with an unknown error"
        };
      }

      // Check for warnings (partial success)
      if (response_data.warning) {
        console.warn("Partial success detected:", response_data.warning);
        return {
          success: true,
          partialSuccess: true,
          warning: response_data.warning,
          userId: response_data.user?.id || response_data.userId,
          needsProfileCreation: true,
          message: "Account created with some limitations"
        };
      }

      // Robust user ID extraction with detailed logging
      const userId = response_data.user?.id || response_data.userId;
      console.log("Registration successful, extracted userId:", userId);
      
      if (!userId) {
        console.warn("User ID is missing from the registration response:", response_data);
      }

      // Registration successful
      return {
        success: true,
        userId: userId,
        message: "Registration successful. Please check your email for verification."
      };
    } catch (error) {
      console.error("Error in registration process:", error);
      
      // Enhanced error type detection
      let errorType: 'auth' | 'database' | 'validation' | 'network' = 'auth';
      let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      if (errorMessage.includes('network') || 
          errorMessage.includes('fetch') || 
          errorMessage.includes('connection')) {
        errorType = 'network';
        errorMessage = "Network error connecting to registration service. Please try again.";
      }
      
      return {
        success: false,
        error: errorMessage,
        errorType: errorType
      };
    }
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during signup"
    };
  }
};
