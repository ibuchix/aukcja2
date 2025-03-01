
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

    // The critical part: safely extract user ID with detailed logs
    console.log("Registration API response:", response);
    
    // Make sure response.data exists
    if (!response.data) {
      console.error("No data in response:", response);
      return {
        success: false,
        error: "Registration failed - no data returned from server"
      };
    }

    // Access user data with strong type checking
    const userData = response.data;
    
    // Most important check: does user object exist?
    if (!userData.user) {
      console.error("User object missing in response data:", userData);
      // Fallback: try using the data directly if it has an id
      if ('id' in userData && typeof userData.id === 'string') {
        console.log("Found ID directly in response data, using that:", userData.id);
        return {
          success: true,
          userId: userData.id as string
        };
      }
      
      return {
        success: false,
        error: "Registration complete but user data is missing"
      };
    }

    // Specific check for id property
    if (!userData.user.id) {
      console.error("User ID is missing:", userData.user);
      return {
        success: false,
        error: "Registration complete but user ID is missing"
      };
    }

    // Final success case
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

  // Validate response data
  if (!response.data) {
    return {
      success: false,
      error: "Login successful but no session data returned"
    };
  }

  console.log("Login successful!");
  return {
    success: true,
    session: response.data.session,
    dealer: response.data.dealer
  };
};
