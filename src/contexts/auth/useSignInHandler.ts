
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, safeGetProfileData } from './authUtils';
import { preparePassword, getAuthDiagnostics } from '@/utils/auth-utils';
import { toast } from '@/components/ui/use-toast';
import { signInWithEmail } from '@/services/auth/signin';

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
      
      // Use the service that tries edge function first, then falls back to standard auth
      const { data, error } = await signInWithEmail({
        email: normalizedEmail,
        password: cleanedPassword,
      });

      if (error) {
        console.error("Sign in error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        toast({
          title: "Login failed",
          description: error.message || "Invalid login credentials",
          variant: "destructive",
        });
        
        return { success: false, error: error.message };
      }

      if (data?.user) {
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
      } else if (data) {
        // Handle case where data exists but no user (unusual but possible)
        console.log("Sign in successful but no user data returned");
        const afterState = getAuthDiagnostics();
        console.log("Auth state after successful signin:", afterState);
        
        return { 
          success: true,
          // The session might still exist even if user data isn't explicitly returned
          session: data.session
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
      
      // Show a toast notification for the error
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'Failed to sign in',
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  return { signIn };
}
