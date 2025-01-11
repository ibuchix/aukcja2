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
    // Create new user directly
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
      },
    });

    if (signUpError) {
      console.error("Auth signup error:", signUpError);
      return {
        success: false,
        error: signUpError.message,
      };
    }

    if (!signUpData?.user?.id) {
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    return {
      success: true,
      userId: signUpData.user.id,
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};