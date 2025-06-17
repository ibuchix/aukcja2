
import { supabase } from '@/integrations/supabase/client';

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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Supabase signOut error:", error);
        throw error;
      }
      
      console.log("✅ Supabase signOut successful in auth context");
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error in auth context:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      };
    }
  };

  return { signOut };
}
