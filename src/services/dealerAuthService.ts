
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
    
    // Create a new user with metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // Include all metadata for the user
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

    // Update the profile role explicitly
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'dealer' })
      .eq('id', signUpData.user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return {
        success: false,
        error: "Failed to set user role",
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
