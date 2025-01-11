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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      return {
        success: false,
        error: signUpError.message,
      };
    }

    if (!data?.user?.id) {
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    console.log("Auth user created successfully:", data.user.id);
    return {
      success: true,
      userId: data.user.id,
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};