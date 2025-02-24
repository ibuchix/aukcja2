
import { supabase } from "@/integrations/supabase/client";

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface UserMetadata {
  role: 'dealer';  // We now explicitly type this as 'dealer'
  name: string;
}

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    // First ensure the role is correctly set
    const sanitizedMetadata: UserMetadata = {
      ...metadata,
      role: 'dealer' // Ensure we always set the correct role
    };

    // First try to sign in with the provided credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in successful, use that user's ID
    if (signInData?.user) {
      return {
        success: true,
        userId: signInData.user.id,
      };
    }

    // If sign in fails, create a new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: sanitizedMetadata,
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
