
import { validateEmail, safeTrim } from "./validation";
import { SignInResult, LoginResponse } from "./models";
import { supabase } from "@/integrations/supabase/client";
import { executeWithRetry } from "@/utils/retryUtils";
import { Session, User } from '@supabase/supabase-js';

/**
 * Handles the sign-in process for dealers with email authentication
 * Uses Supabase's native auth + direct database query for reliability
 */
export const signInDealerWithEmail = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  // Validate email format first
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { success: false, error: emailValidation.error };
  }

  // Normalize email
  const normalizedEmail = safeTrim(email).toLowerCase();

  try {
    console.log("Starting dealer login with native Supabase auth");
    
    // Try first with direct dealer-auth function call (compatible with custom registration)
    try {
      console.log("Attempting login via dealer-auth function for custom registration compatibility");
      const { data: authFuncData, error: authFuncError } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'login',
          email: normalizedEmail,
          password,
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      });
      
      if (!authFuncError && authFuncData && authFuncData.success) {
        console.log("Login successful via dealer-auth function!");
        return {
          success: true,
          session: authFuncData.session,
          dealer: authFuncData.dealer
        };
      }
      
      console.log("Login via dealer-auth not successful, falling back to native auth");
    } catch (funcError) {
      console.warn("Error in dealer-auth function call (non-fatal):", funcError);
      // Continue to native auth as fallback
    }
    
    // Fallback: Use Supabase's native auth for sign in with retry capability
    const authResult = await executeWithRetry<{ session: Session | null; user: User | null }>(
      async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        
        if (error) throw error;
        return data;
      },
      {
        maxRetries: 3,
        baseDelay: 500,
        shouldRetry: (error) => {
          // Retry only for network/server errors, not for auth failures
          const errorMsg = error?.message?.toLowerCase() || '';
          return !errorMsg.includes('invalid login') && 
                 !errorMsg.includes('invalid credentials') &&
                 !errorMsg.includes('password');
        }
      }
    );

    if (!authResult || !authResult.session) {
      return {
        success: false,
        error: "Authentication failed. Please check your credentials."
      };
    }

    // Step 2: After authentication, fetch dealer profile data directly from the database
    // with retry capability for network issues
    try {
      const result = await executeWithRetry<{ data: any; error: any }>(
        async () => supabase
          .from('dealers')
          .select('*')
          .eq('user_id', authResult.user!.id)
          .single(),
        {
          maxRetries: 2,
          baseDelay: 300
        }
      );

      const { data: dealer, error: profileError } = result;

      if (profileError) {
        console.warn("Profile fetch error (non-fatal):", profileError);
        // Still return success if auth worked but profile fetch failed
        return {
          success: true,
          session: authResult.session,
          dealer: null,
          partialSuccess: true,
          warning: "Your account was authenticated, but we couldn't fetch your dealer profile."
        };
      }

      console.log("Login successful with profile fetch!");
      return {
        success: true,
        session: authResult.session,
        dealer
      };
    } catch (profileError) {
      console.warn("Profile fetch error with retry (non-fatal):", profileError);
      // Still return success if auth worked but profile fetch failed even after retries
      return {
        success: true,
        session: authResult.session,
        dealer: null,
        partialSuccess: true,
        warning: "Your account was authenticated, but we couldn't fetch your dealer profile after multiple attempts."
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    
    // Provide user-friendly error messages based on the error type
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login";
    
    // Check for specific error messages and provide clearer feedback
    if (errorMessage.toLowerCase().includes('invalid login')) {
      return {
        success: false,
        error: "Invalid email or password. Please check your credentials."
      };
    }
    
    if (errorMessage.toLowerCase().includes('too many requests')) {
      return {
        success: false,
        error: "Too many login attempts. Please try again later."
      };
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
