
import { useState } from "react";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { signUpDealerWithEmail } from "@/services/auth/signup";
import { useNetworkRetry } from "./signup/useNetworkRetry";
import { 
  handleAuthResult, 
  createErrorFromException, 
  isNetworkError, 
  isAuthError 
} from "./signup/signupErrorHandler";
import { SignupResult } from "./signup/types";
import { handleProfileCreation } from "./signup/handleProfileCreation";
import { sendDealerWelcomeEmail } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";

export type { SignupResult } from "./signup/types";

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const networkRetry = useNetworkRetry({ maxRetries: 3, baseDelayMs: 1000 });
  const authRetry = useNetworkRetry({ maxRetries: 2, baseDelayMs: 1000 });

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
      
      // Reset retry counters for fresh attempt
      networkRetry.resetRetry();
      authRetry.resetRetry();
      
      // Create user account with ALL required metadata
      let signUpResult;
      
      try {
        signUpResult = await authRetry.executeWithRetry(
          () => signUpDealerWithEmail(
            values.email.trim().toLowerCase(),
            values.password,
            {
              name: values.supervisorName.trim(),
              companyName: values.companyName.trim(),
              phoneNumber: values.phoneNumber.trim(),
              taxId: values.taxId.trim(),
              businessRegistryNumber: values.businessRegistryNumber.trim(),
              companyAddress: values.companyAddress.trim()
            }
          ),
          isAuthError
        );
      } catch (error) {
        // If we've exhausted retries, create appropriate error response
        if (isAuthError(error)) {
          return {
            success: false,
            error: "Authentication service temporarily unavailable. Please try again in a few moments.",
            errorType: 'auth'
          };
        }
        throw error; // Re-throw for main catch block to handle
      }

      if (!signUpResult.success) {
        return handleAuthResult(signUpResult);
      }

      // Check for partial success in the response (new feature)
      if (signUpResult.partialSuccess) {
        console.log("Partial success detected, user account created but additional steps needed");
        console.warn(signUpResult.warning);
        
        return {
          success: true,
          message: "Your account has been created, but some profile information will need to be completed later.",
          userId: signUpResult.userId,
          partialSuccess: true,
          warning: signUpResult.warning
        };
      }

      // Create dealer profile only if not already created in the RPC call
      if (signUpResult.needsProfileCreation) {
        try {
          return await networkRetry.executeWithRetry(
            () => handleProfileCreation(signUpResult.userId, values),
            isNetworkError
          );
        } catch (error) {
          if (isNetworkError(error)) {
            return {
              success: false,
              error: "Network issue while creating dealer profile. Please try again.",
              errorType: 'network',
              userId: signUpResult.userId
            };
          }
          
          // Even if profile creation fails, return partial success since auth worked
          return {
            success: true,
            partialSuccess: true,
            warning: error instanceof Error ? error.message : "Profile creation had issues",
            message: "Your account has been created, but profile setup will need to be completed later.",
            userId: signUpResult.userId
          };
        }
      }

      // Send welcome email after successful registration
      try {
        if (signUpResult.userId) {
          console.log("Attempting to send welcome email to new dealer");
          const emailResult = await sendDealerWelcomeEmail(
            values.supervisorName.trim(), 
            values.email.trim().toLowerCase()
          );
          
          // Show configuration warnings if needed
          if (!emailResult.success && emailResult.isConfigIssue) {
            console.warn("Email configuration issue:", emailResult.error);
            toast({
              title: "Registration successful, but email not sent",
              description: "Your account has been created, but we couldn't send a welcome email due to a technical issue. The admin has been notified.",
              variant: "default",
            });
          } else {
            console.log("Welcome email processing completed");
          }
        }
      } catch (emailError) {
        // Don't fail registration if email fails, just log the error
        console.error("Failed to send welcome email:", emailError);
      }

      return { 
        success: true, 
        message: signUpResult.message || "Registration successful. Please check your email for verification.",
        userId: signUpResult.userId 
      };
      
    } catch (error) {
      // For network errors, try to retry
      if (isNetworkError(error) && networkRetry.shouldRetry()) {
        try {
          // Add a small delay before retry
          const delayMs = networkRetry.getDelayMs();
          console.log(`Retrying network in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs)); 
          
          // Increment retry counter and try again
          networkRetry.incrementRetry();
          setIsSubmitting(false);
          return signupDealer(values);
        } catch (retryError) {
          // If retry fails, handle as normal error
          return createErrorFromException(retryError);
        }
      }
      
      return createErrorFromException(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}
