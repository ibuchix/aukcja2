
import { validateEmail, validatePassword, safeTrim, checkAccountExists } from "./validation";
import { invokeDealerFunction } from "../api/dealerApiClient";
import { SignUpResult, UserMetadata, RegisterResponse, SignInResult, LoginResponse } from "./models";

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
    try {
      const accountExists = await checkAccountExists(normalizedEmail);
      if (accountExists) {
        console.log("Account exists check returned true for email:", normalizedEmail);
        return {
          success: false,
          error: "An account with this email already exists. Please login instead."
        };
      }
    } catch (error) {
      console.error("Failed to check if account exists:", error);
      // Continue with registration attempt even if the check fails
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
    
    const response = await invokeDealerFunction<RegisterResponse>(
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

    // Safely access the user ID from the response data with detailed type checking
    // This is the critical part that was causing the 'id' property error
    if (!response.data || typeof response.data !== 'object') {
      console.error("Registration successful but response data is invalid:", response.data);
      return {
        success: false,
        error: "Failed to create user account - invalid response data"
      };
    }

    const userData = response.data;
    if (!userData.user || typeof userData.user !== 'object' || !userData.user.id) {
      console.error("Registration successful but no valid user object returned:", userData);
      return {
        success: false,
        error: "Failed to create user account - missing user ID"
      };
    }

    const userId = userData.user.id;
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
): Promise<SignInResult> => {
  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  // Normalize email
  const normalizedEmail = safeTrim(email).toLowerCase();

  const response = await invokeDealerFunction<LoginResponse>(
    'login', 
    {
      email: normalizedEmail,
      password
    }
  );

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
