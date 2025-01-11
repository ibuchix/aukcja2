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

export const checkDealerTaxIdExists = async (taxId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('dealers')
    .select('id')
    .eq('tax_id', taxId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error checking tax ID:", error);
    throw error;
  }

  return !!data;
};

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    // Create new user directly without trying to sign in first
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