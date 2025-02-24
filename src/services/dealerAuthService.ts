
import { supabase } from "@/integrations/supabase/client";

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface UserMetadata {
  role: 'dealer';
  name: string;
}

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    console.log("Attempting dealer signup with email:", email);
    
    // Create a new user with minimal metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'dealer' as const, // Ensure TypeScript treats this as a literal type
          name: metadata.name,
        },
        emailRedirectTo: `${window.location.origin}/dealer/dashboard`
      }
    });

    if (signUpError) {
      console.error("Auth signup error:", signUpError);
      return {
        success: false,
        error: signUpError.message,
      };
    }

    if (!signUpData?.user?.id) {
      console.error("No user ID returned from signup");
      return {
        success: false,
        error: "Failed to create user account",
      };
    }

    console.log("Signup successful, user ID:", signUpData.user.id);
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
