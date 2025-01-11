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
    // Start a Supabase transaction
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing user:", checkError);
      return {
        success: false,
        error: "Failed to verify user existence",
      };
    }

    if (existingUser) {
      return {
        success: false,
        error: "This email is already registered. Please try logging in or use a different email address.",
      };
    }

    // Create auth user with dealer role
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          email_confirmed_at: null, // Ensure email verification is required
        },
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

    // Check if dealer profile already exists
    const { data: existingDealer, error: dealerCheckError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (dealerCheckError && dealerCheckError.code !== 'PGRST116') {
      console.error("Error checking existing dealer:", dealerCheckError);
      // Attempt to clean up auth user if dealer check fails
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Failed to verify dealer profile",
      };
    }

    if (existingDealer) {
      // Clean up and return error if dealer profile already exists
      await supabase.auth.signOut();
      return {
        success: false,
        error: "A dealer profile already exists for this account",
      };
    }

    console.log("Auth user created successfully:", data.user.id);
    return {
      success: true,
      userId: data.user.id,
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    // Attempt to clean up on unexpected errors
    await supabase.auth.signOut();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};