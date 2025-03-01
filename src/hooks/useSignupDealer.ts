
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/auth/signup";
import { createDealerProfile } from "@/services/dealerProfileService";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation';
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupDealer = async (values: DealerFormValues): Promise<SignupResult> => {
    if (isSubmitting) {
      return { 
        success: false, 
        error: "Registration in progress",
        errorType: 'validation'
      };
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting dealer registration process");
      
      // Create user account without role in metadata since it's handled by DB trigger
      const signUpResult = await signUpDealerWithEmail(
        values.email.trim().toLowerCase(),
        values.password,
        {
          name: values.supervisorName.trim()
        }
      );

      if (!signUpResult.success || !signUpResult.userId) {
        return {
          success: false,
          error: signUpResult.error || "Failed to create user account",
          errorType: 'auth'
        };
      }

      // Create dealer profile
      const profileResult = await createDealerProfile(signUpResult.userId, values);

      if (!profileResult.success) {
        return {
          success: false,
          error: profileResult.error,
          errorType: profileResult.errorType
        };
      }

      return { success: true };
      
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        errorType: 'validation'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test function with hardcoded values
  const testSignup = async () => {
    const testValues: DealerFormValues = {
      email: "testdealer@example.com",
      password: "TestPassword123!",
      supervisorName: "Test Supervisor",
      phoneNumber: "+48123456789",
      companyName: "Test Dealership",
      taxId: "1234567890",
      businessRegistryNumber: "123456789",
      companyAddress: "123 Test St",
      acceptTerms: true,
    };

    console.log("Starting test signup with hardcoded values:", testValues);
    const result = await signupDealer(testValues);
    console.log("Test signup result:", result);
    return result;
  };

  return { signupDealer, isSubmitting, testSignup };
}
