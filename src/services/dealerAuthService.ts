import { supabase } from "@/integrations/supabase/client";

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface UserMetadata {
  role: string;
  name: string;
}

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    // First, check if the user exists using signInWithPassword
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: "dummy-password-for-check",
    });

    // If we get an invalid_credentials error, the user doesn't exist
    // If we get a user_not_found error, the user doesn't exist
    // Any other error means the user exists or there's another issue
    if (signInError) {
      if (
        signInError.message.includes("Invalid login credentials") ||
        signInError.message.includes("User not found") ||
        signInError.message.includes("Invalid email or password")
      ) {
        // User doesn't exist, proceed with signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
          },
        });

        if (error) {
          console.error("Signup error:", error);
          return {
            success: false,
            error: error.message,
          };
        }

        if (data.user) {
          return {
            success: true,
            userId: data.user.id,
          };
        }
      } else {
        // User exists or there's another issue
        console.error("Auth check error:", signInError);
        return {
          success: false,
          error: "This email is already registered. Please try logging in or use a different email address.",
        };
      }
    }

    return {
      success: false,
      error: "This email is already registered. Please try logging in or use a different email address.",
    };
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};