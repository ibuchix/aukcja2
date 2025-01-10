import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface AuthResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation';
  userId?: string;
}

export async function signUpDealerWithEmail(
  email: string, 
  password: string, 
  metadata: { role: string; name: string; }
): Promise<AuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: metadata,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return {
        success: false,
        error: authError.message,
        errorType: 'auth'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to create user account",
        errorType: 'auth'
      };
    }

    return {
      success: true,
      userId: authData.user.id
    };
  } catch (error) {
    console.error("Auth service error:", error);
    return {
      success: false,
      error: "Authentication service error",
      errorType: 'auth'
    };
  }
}