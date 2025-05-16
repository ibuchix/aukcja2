
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmail } from "@/services/auth/signin";
import { preparePassword } from "@/utils/auth-utils";

interface CompleteRegistrationResult {
  success: boolean;
  error?: string;
  userId?: string;
  loginSuccessful?: boolean;
}

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: DealerFormValues): Promise<CompleteRegistrationResult> => {
    setIsSubmitting(true);
    
    try {
      console.log("Creating dealer account with dealer-auth edge function");
      
      // Consistently prepare the password the same way across all code
      const cleanedPassword = preparePassword(values.password);
      
      // Add diagnostic logging for password length
      console.log("Registration password length after preparation:", cleanedPassword.length, 
                "First char code:", cleanedPassword.charCodeAt(0),
                "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
      
      // Call the dealer-auth edge function with register action
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: JSON.stringify({
          action: 'register',
          email: values.email.trim().toLowerCase(),
          password: cleanedPassword,
          metadata: {
            name: values.supervisorName.trim(),
            companyName: values.companyName.trim(),
            taxId: values.taxId.trim(),
            businessRegistryNumber: values.businessRegistryNumber.trim(),
            companyAddress: values.companyAddress.trim(),
            phoneNumber: values.phoneNumber.trim()
          },
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }),
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });
      
      if (error) {
        console.error("Edge function registration error:", error);
        
        // Enhanced error handling for network issues
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('NetworkError') ||
            error.message?.includes('network')) {
          return {
            success: false,
            error: "Network error connecting to registration service. Please try again.",
          };
        }
      
        return {
          success: false,
          error: error.message || "Registration failed with server error"
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
      const response = data as any;
      
      if (!response.success) {
        console.error("Registration failed with error:", response.error);
        return {
          success: false,
          error: response.error || "Registration failed with an unknown error"
        };
      }

      // Check for auto-generated session
      if (response.session) {
        console.log("Registration successful with automatic session, user is now logged in");
        return {
          success: true,
          userId: response.userId || response.user?.id,
          loginSuccessful: true
        };
      }
      
      // If no session was returned but registration was successful,
      // attempt to login immediately 
      try {
        console.log("Registration successful, attempting immediate login");
        const signInResult = await signInWithEmail({
          email: values.email.trim().toLowerCase(),
          password: values.password
        });
        
        const loginSuccessful = !signInResult.error && !!signInResult.data;
        console.log("Immediate login after registration:", loginSuccessful ? "successful" : "failed");
        
        return {
          success: true,
          userId: response.userId || response.user?.id,
          loginSuccessful
        };
      } catch (loginError) {
        console.warn("Could not automatically log in after registration:", loginError);
        
        return {
          success: true,
          userId: response.userId || response.user?.id,
          loginSuccessful: false
        };
      }
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during registration"
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
}
