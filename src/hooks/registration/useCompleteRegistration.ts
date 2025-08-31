
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmail } from "@/services/auth/signin";
import { preparePassword } from "@/utils/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

interface CompleteRegistrationResult {
  success: boolean;
  error?: string;
  userId?: string;
  loginSuccessful?: boolean;
}

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: DealerFormValues): Promise<CompleteRegistrationResult> => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log("Registration already in progress, ignoring duplicate request");
      return { success: false, error: "Registration already in progress" };
    }
    
    setIsSubmitting(true);
    
    try {
      // Show initial progress toast
      toast({
        title: "Starting Registration Process",
        description: "Preparing your account details...",
      });
      
      console.log("Creating dealer account with dealer-auth edge function");
      
      // Consistently prepare the password the same way across all code
      const cleanedPassword = preparePassword(values.password);
      
      // Add diagnostic logging for password length
      console.log("Registration password length after preparation:", cleanedPassword.length, 
                "First char code:", cleanedPassword.charCodeAt(0),
                "Last char code:", cleanedPassword.charCodeAt(cleanedPassword.length - 1));
      
      // Show account creation progress
      toast({
        title: "Creating Account",
        description: "Setting up your authentication credentials...",
      });
      
      // Create request body 
      const requestBody = {
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
      };
      
      // Use centralized Supabase configuration
      const url = `${SUPABASE_URL}/functions/v1/dealer-auth`;
      
      console.log("Direct fetch URL:", url);
      
      // Create sanitized body for logging
      const sanitizedBody = {
        ...requestBody,
        password: '[REDACTED]'
      };
      console.log("Registration request body:", sanitizedBody);
      
      // Show backend processing toast
      toast({
        title: "Processing Registration",
        description: "Creating your dealer profile and verifying information...",
      });
      
      // Send the direct fetch request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(requestBody)
      });
      
      // Log response status and headers
      console.log("Registration response status:", response.status);
      
      // Try to get text response first for debugging
      const responseText = await response.text();
      console.log("Registration raw response:", responseText);
      
      // If response isn't successful, handle error
      if (!response.ok) {
        console.error("Registration failed with status:", response.status);
        
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
        
        toast({
          title: "Registration Failed",
          description: errorMsg,
          variant: "destructive",
        });
        
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
        console.error("Error parsing registration response:", e);
        // Be tolerant: registration likely succeeded even if response isn't JSON
        toast({
          title: "Registration Successful",
          description: "Account created. Please log in with your credentials.",
        });
        return {
          success: true,
          loginSuccessful: false
        };
      }
      
      if (!data) {
        console.error("Empty response from registration service");
        // Assume success if HTTP was OK but body is empty
        toast({
          title: "Registration Successful",
          description: "Account created. Please log in with your credentials.",
        });
        return {
          success: true,
          loginSuccessful: false
        };
      }
      
      // Parse the response
      const response_data = data;
      
      if (!response_data.success) {
        // Special handling for "email already exists" error - this might mean registration actually succeeded
        if (response_data.error?.toLowerCase().includes("already exists")) {
          console.log("Email already exists error - checking if user can log in (registration may have succeeded)");
          
          try {
            // Try to log in with the provided credentials
            const signInResult = await signInWithEmail({
              email: values.email.trim().toLowerCase(),
              password: values.password
            });
            
            if (!signInResult.error && signInResult.data) {
              console.log("Login successful after 'already exists' error - registration was actually successful");
              toast({
                title: "Witamy ponownie!",
                description: "Masz już konto i zostałeś zalogowany.",
              });
              return {
                success: true,
                loginSuccessful: true
              };
            }
          } catch (loginError) {
            console.log("Login failed after 'already exists' error:", loginError);
          }
        }
        
        console.error("Registration failed with error:", response_data.error);
        toast({
          title: "Registration Failed",
          description: response_data.error || "Registration failed with an unknown error",
          variant: "destructive",
        });
        return {
          success: false,
          error: response_data.error || "Registration failed with an unknown error"
        };
      }

      // Show success progress
      toast({
        title: "Account Created Successfully! ✓",
        description: "Your dealer account has been set up. Attempting automatic login...",
      });

      // Check for auto-generated session
      if (response_data.session) {
        console.log("Registration successful with automatic session, user is now logged in");
        toast({
          title: "Welcome to Your Dashboard! 🎉",
          description: "Registration complete and you're now logged in",
        });
        return {
          success: true,
          userId: response_data.userId || response_data.user?.id,
          loginSuccessful: true
        };
      }
      
      // If no session was returned but registration was successful,
      // attempt to login immediately 
      try {
        console.log("Registration successful, attempting immediate login");
        toast({
          title: "Completing Setup",
          description: "Logging you into your new account...",
        });
        
        const signInResult = await signInWithEmail({
          email: values.email.trim().toLowerCase(),
          password: values.password
        });
        
        const loginSuccessful = !signInResult.error && !!signInResult.data;
        console.log("Immediate login after registration:", loginSuccessful ? "successful" : "failed");
        
        if (loginSuccessful) {
          toast({
            title: "Welcome to Your Dashboard! 🎉",
            description: "Registration complete and you're now logged in",
          });
        } else {
          toast({
            title: "Registration Successful",
            description: "Account created successfully. Please log in with your credentials.",
          });
        }
        
        return {
          success: true,
          userId: response_data.userId || response_data.user?.id,
          loginSuccessful
        };
      } catch (loginError) {
        console.warn("Could not automatically log in after registration:", loginError);
        
        toast({
          title: "Registration Successful",
          description: "Account created successfully. Please log in with your credentials.",
        });
        
        return {
          success: true,
          userId: response_data.userId || response_data.user?.id,
          loginSuccessful: false
        };
      }
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during registration",
        variant: "destructive",
      });
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
