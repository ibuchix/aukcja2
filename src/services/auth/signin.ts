
import { validateEmail, safeTrim } from "./validation";
import { invokeDealerFunction } from "../api/dealerApiClient";
import { SignInResult, LoginResponse, isLoginResponse } from "./models";

/**
 * Handles the sign-in process for dealers with email authentication
 */
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

  // Extra debug logging for login response
  console.log("Login data structure:", JSON.stringify(response.data, null, 2));

  // Use type guard to validate login response
  if (!isLoginResponse(response.data)) {
    console.error("Invalid login response format:", response.data);
    return {
      success: false,
      error: "Login failed - invalid response format from server"
    };
  }

  console.log("Login successful!");
  return {
    success: true,
    session: response.data.session,
    dealer: response.data.dealer
  };
};
