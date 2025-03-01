
import { validateEmail, validatePassword, safeTrim, checkAccountExists } from "@/utils/authValidation";
import { invokeDealerFunction } from "../api/dealerApiClient";

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

    // Check if the user already exists
    const accountExists = await checkAccountExists(normalizedEmail);
    if (accountExists) {
      console.log("Account exists check returned true for email:", normalizedEmail);
      return {
        success: false,
        error: "An account with this email already exists. Please login instead."
      };
    }

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

    // Call the dealer-auth edge function with retries
    const response = await invokeDealerFunction<{user?: {id: string}}>(
      'register', 
      {
        email: normalizedEmail,
        password,
        supervisorName: safeTrim(metadata.name),
        companyName: safeTrim(metadata.companyName),
        phoneNumber: safeTrim(metadata.phoneNumber),
        taxId: safeTrim(metadata.taxId),
        businessRegistryNumber: safeTrim(metadata.businessRegistryNumber),
        companyAddress: safeTrim(metadata.companyAddress)
      }
    );

    if (!response.success) {
      // Check for specific error types for better messaging
      if (response.error && (
        response.error.includes('profiles_pkey') ||
        response.error.includes('duplicate') ||
        response.error.includes('already exists'))) {
        return {
          success: false,
          error: "An account with this email already exists. Please try logging in."
        };
      }
      
      return {
        success: false,
        error: response.error
      };
    }

    const userId = response.data?.user?.id;
    if (!userId) {
      console.error("Registration successful but no user ID returned", response.data);
      return {
        success: false,
        error: "Failed to create user account - no user ID returned"
      };
    }

    console.log("Registration successful! User ID:", userId);
    return {
      success: true,
      userId: userId
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
  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  // Normalize email
  const normalizedEmail = safeTrim(email).toLowerCase();

  const response = await invokeDealerFunction('login', {
    email: normalizedEmail,
    password
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error
    };
  }

  console.log("Login successful!");
  return {
    success: true,
    session: response.data.session,
    dealer: response.data.dealer
  };
};
