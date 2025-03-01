
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, validatePassword, safeTrim } from "@/utils/authValidation";

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  companyAddress?: string;
  taxId?: string;
  businessRegistryNumber?: string;
}

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

    // Use centralized password validation with better error handling
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate required metadata with better handling
    if (!safeTrim(metadata.name)) {
      return { success: false, error: "Name is required" };
    }

    // Normalize inputs
    const normalizedEmail = safeTrim(email).toLowerCase();

    // Call the dealer-auth edge function with retries and better logging
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to register dealer with email: ${normalizedEmail}`);
        
        const { data, error } = await supabase.functions.invoke('dealer-auth', {
          body: {
            action: 'register',
            email: normalizedEmail,
            password,
            supervisorName: safeTrim(metadata.name),
            companyName: safeTrim(metadata.companyName),
            phoneNumber: safeTrim(metadata.phoneNumber),
            taxId: safeTrim(metadata.taxId),
            businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
            companyAddress: safeTrim(metadata.companyAddress)
          }
        });

        console.log("Registration response:", { data, error });

        if (error) {
          console.error(`Registration attempt ${attempt} failed:`, error);
          lastError = error;
          
          // Add delay before retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          }
          continue;
        }

        if (!data?.user?.id) {
          console.error(`Registration attempt ${attempt} failed: No user ID returned`, data);
          lastError = new Error("Failed to create user account - no user ID returned");
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          }
          continue;
        }

        console.log("Registration successful! User ID:", data.user.id);
        return {
          success: true,
          userId: data.user.id
        };
      } catch (error) {
        console.error(`Registration attempt ${attempt} threw error:`, error);
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Registration failed after multiple attempts"
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during signup"
    };
  }
};

export const signInDealerWithEmail = async (
  email: string,
  password: string
) => {
  const maxRetries = 3;
  let lastError: any;

  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  // Normalize email
  const normalizedEmail = safeTrim(email).toLowerCase();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to login dealer with email: ${normalizedEmail}`);
      
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'login',
          email: normalizedEmail,
          password
        }
      });

      console.log("Login response:", { data, error });

      if (error) {
        console.error(`Login attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }

      console.log("Login successful!");
      return {
        success: true,
        session: data.session,
        dealer: data.dealer
      };

    } catch (error) {
      console.error(`Login attempt ${attempt} threw error:`, error);
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Login failed after multiple attempts"
  };
};
