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
      
      // Check for specific error types
      if (error.message.toLowerCase().includes("user already registered")) {
        return {
          success: false,
          error: "This email is already registered. Please try logging in instead.",
        };
      }

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

    return {
      success: false,
      error: "User creation failed",
    };
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};