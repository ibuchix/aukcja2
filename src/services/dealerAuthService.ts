
import { supabase } from "@/integrations/supabase/client";

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

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }
  return { isValid: true };
};

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    console.log("Starting dealer signup process...");

    // Validate email format
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error };
    }

    // Validate required metadata
    if (!metadata.name?.trim()) {
      return { success: false, error: "Name is required" };
    }

    // Call the dealer-auth edge function with retries
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to register dealer...`);
        
        const { data, error } = await supabase.functions.invoke('dealer-auth', {
          body: {
            action: 'register',
            email: email.trim().toLowerCase(),
            password,
            supervisorName: metadata.name.trim(),
            companyName: metadata.companyName?.trim(),
            phoneNumber: metadata.phoneNumber?.trim(),
            taxId: metadata.taxId?.trim(),
            businessRegistryNumber: metadata.businessRegistryNumber?.trim(),
            companyAddress: metadata.companyAddress?.trim()
          }
        });

        if (error) {
          console.error(`Registration attempt ${attempt} failed:`, error);
          lastError = error;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
          continue;
        }

        if (!data?.user?.id) {
          console.error(`Registration attempt ${attempt} failed: No user ID returned`);
          lastError = new Error("Failed to create user account - no user ID returned");
          continue;
        }

        console.log("Registration successful!");
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

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to login dealer...`);
      
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'login',
          email: email.trim().toLowerCase(),
          password
        }
      });

      if (error) {
        console.error(`Login attempt ${attempt} failed:`, error);
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
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
