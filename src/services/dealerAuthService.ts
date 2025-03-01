
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

    // Log the request before sending
    console.log("Preparing dealer registration request:", {
      email: normalizedEmail,
      supervisorName: safeTrim(metadata.name),
      companyName: safeTrim(metadata.companyName),
      phoneNumber: safeTrim(metadata.phoneNumber),
      taxId: safeTrim(metadata.taxId),
      businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
      companyAddress: safeTrim(metadata.companyAddress)
    });

    // First check if the user already exists to provide a better error message
    const { data: existingUser, error: checkError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false
      }
    });

    if (existingUser?.user) {
      console.error("User already exists:", existingUser.user.id);
      return {
        success: false,
        error: "An account with this email already exists. Please login instead."
      };
    }

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

        console.log("Registration response:", { 
          success: data?.success, 
          error: error || data?.error,
          userId: data?.user?.id,
          fullData: data // Log the full data for debugging
        });

        if (error) {
          console.error(`Registration attempt ${attempt} failed:`, error);
          lastError = error;
          
          // Add delay before retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          }
          continue;
        }

        if (!data?.success) {
          console.error(`Registration attempt ${attempt} failed with API error:`, data);
          
          // If the error mentions duplicate profile, it might be a race condition with the trigger
          if (data?.error && (
              data.error.includes('profiles_pkey') || 
              data.error.includes('duplicate') || 
              data.error.includes('already exists'))) {
            return {
              success: false,
              error: "An account with this email already exists. Please try logging in."
            };
          }
          
          lastError = new Error(data?.error || "Failed to create user account");
          
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
