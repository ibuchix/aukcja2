
import { supabase } from '@/integrations/supabase/client';
import { validateCurrentSession } from '@/utils/sessionValidation';

export interface AuthActionResponse {
  success: boolean;
  error?: string;
}

export interface UseAuthActionsReturn {
  signOut: () => Promise<AuthActionResponse>;
}

export function useAuthActions(): UseAuthActionsReturn {
  const signOut = async (): Promise<AuthActionResponse> => {
    try {
      console.log("🚪 Auth context signOut called");
      
      // First validate the current session
      const validation = await validateCurrentSession();
      
      if (!validation.isValid) {
        console.warn("⚠️ Session already invalid:", validation.reason);
        
        // Clear any corrupted session data
        if (validation.reason === 'no_session' || validation.reason === 'invalid_token') {
          console.log("🧹 Clearing localStorage due to invalid session");
          localStorage.removeItem('sb-auth-token');
          localStorage.removeItem('supabase.auth.token');
          // Clear any other auth-related localStorage items
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        // Return success since we're already signed out
        return { success: true };
      }
      
      // Proceed with normal signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Supabase signOut error:", error);
        
        // Handle specific "Auth session missing" error
        if (error.message?.includes("Auth session missing")) {
          console.log("🧹 Session missing error - clearing storage and treating as success");
          localStorage.removeItem('sb-auth-token');
          localStorage.removeItem('supabase.auth.token');
          return { success: true };
        }
        
        throw error;
      }
      
      console.log("✅ Supabase signOut successful in auth context");
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error in auth context:', error);
      
      // Check if it's a session-related error that we can handle gracefully
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      if (errorMessage.includes("Auth session missing") || errorMessage.includes("session_not_found")) {
        console.log("🔄 Treating session error as successful logout");
        return { success: true };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return { signOut };
}
