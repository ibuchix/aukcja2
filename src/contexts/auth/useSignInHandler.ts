
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, safeGetProfileData } from './authUtils';
import { preparePassword, getAuthDiagnostics } from '@/utils/auth-utils';

export function useSignInHandler() {
  const signIn = async ({ email, password, redirectTo }: { 
    email: string; 
    password: string; 
    redirectTo?: string;
  }) => {
    try {
      // Diagnostics before signin attempt
      const beforeState = getAuthDiagnostics();
      console.log("Auth state before signin:", beforeState);
      
      // Use consistent password preparation
      const cleanedPassword = preparePassword(password);
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log("Attempting sign in with normalized credentials");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: cleanedPassword,
      });

      if (error) {
        console.error("Sign in error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user profile
        const userProfile = await getUserProfile(data.user.id);
        
        // Diagnostics after successful signin
        const afterState = getAuthDiagnostics();
        console.log("Auth state after successful signin:", afterState);
        
        // Return successful result
        return { 
          success: true, 
          user: data.user, 
          session: data.session, 
          profile: userProfile 
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  return { signIn };
}
