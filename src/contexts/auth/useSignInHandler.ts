
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, safeGetProfileData } from './authUtils';

export function useSignInHandler() {
  const signIn = async ({ email, password, redirectTo }: { 
    email: string; 
    password: string; 
    redirectTo?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user profile
        const userProfile = await getUserProfile(data.user.id);
        
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
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  return { signIn };
}

