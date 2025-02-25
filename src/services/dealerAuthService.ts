
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

    // Create auth user with role in metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { 
          name: metadata.name.trim(),
          role: 'dealer' as const // Explicitly type as 'dealer' to match the ENUM
        },
        emailRedirectTo: `${window.location.origin}/dealer/dashboard`
      }
    });

    if (signUpError) {
      console.error("Auth signup error details:", {
        status: signUpError.status,
        message: signUpError.message,
        name: signUpError.name,
        stack: signUpError.stack
      });
      
      // Handle specific error cases
      switch (signUpError.status) {
        case 400:
          return { success: false, error: "Invalid signup data provided" };
        case 422:
          return { success: false, error: "Email address is already registered" };
        case 429:
          return { success: false, error: "Too many signup attempts. Please try again later" };
        default:
          return { success: false, error: signUpError.message || "Failed to create user account" };
      }
    }

    if (!signUpData?.user?.id) {
      console.error("No user ID returned from signup");
      return { success: false, error: "Failed to create user account" };
    }

    console.log("Auth user created successfully, creating dealer record...");

    // Create dealer record
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: signUpData.user.id,
        supervisor_name: metadata.name.trim(),
        dealership_name: metadata.companyName?.trim() || metadata.name.trim(),
        address: metadata.companyAddress?.trim() || '',
        business_registry_number: metadata.businessRegistryNumber?.trim() || '',
        tax_id: metadata.taxId?.trim() || '',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        license_number: '', // Required field with empty default
        is_verified: false
      });

    if (dealerError) {
      console.error("Dealer record creation error:", dealerError);
      
      // Handle specific dealer creation errors
      if (dealerError.code === '23505') { // Unique violation
        return { 
          success: false, 
          error: "A dealer with this information already exists" 
        };
      }
      
      throw dealerError;
    }

    console.log("Dealer signup completed successfully");
    return {
      success: true,
      userId: signUpData.user.id
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred during signup"
    };
  }
};
