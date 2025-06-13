
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from './authUtils';
import { preparePassword, getAuthDiagnostics } from '@/utils/auth-utils';
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
      console.log("📊 Auth state before signin:", beforeState);
      
      // Use consistent password preparation
      const cleanedPassword = preparePassword(password);
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log("🚀 Attempting sign in with normalized credentials using direct fetch method");
      
      // Use the edge function service for authentication via direct fetch
      const { data, error } = await signInWithEmail({
        email: normalizedEmail,
        password: cleanedPassword,
      });

      if (error) {
        console.error("❌ Sign in error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        return { 
          success: false, 
          error: error.message || "Invalid login credentials" 
        };
      }

      if (data?.user && data?.session) {
        console.log("✅ Sign in data received successfully");
        
        // Get user profile but don't wait for it or let it block success
        const userProfile = await getUserProfile(data.user.id).catch(profileError => {
          console.warn("⚠️ Could not fetch user profile, but continuing with signin:", profileError);
          return null;
        });
        
        // Diagnostics after successful signin
        const afterState = getAuthDiagnostics();
        console.log("📊 Auth state after successful signin:", afterState);
        
        // Return successful result immediately
        return { 
          success: true, 
          user: data.user, 
          session: data.session, 
          profile: userProfile 
        };
      } else if (data) {
        // Handle case where data exists but no user (unusual but possible)
        console.log("⚠️ Sign in successful but no user data returned");
        const afterState = getAuthDiagnostics();
        console.log("📊 Auth state after successful signin:", afterState);
        
        return { 
          success: true,
          session: data.session
        };
      }
      
      return { 
        success: true 
      };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign in'
      };
    }
  };

  return { signIn };
}
