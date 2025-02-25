
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

    // Call the dealer-auth edge function
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
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Failed to create user account"
      };
    }

    if (!data?.user?.id) {
      return {
        success: false,
        error: "Failed to create user account - no user ID returned"
      };
    }

    return {
      success: true,
      userId: data.user.id
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
  try {
    const { data, error } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'login',
        email: email.trim().toLowerCase(),
        password
      }
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      session: data.session,
      dealer: data.dealer
    };

  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during login"
    };
  }
};
