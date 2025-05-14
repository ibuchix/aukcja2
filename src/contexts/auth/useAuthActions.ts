
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from "./context";
import { useContext } from 'react';

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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      };
    }
  };

  return { signOut };
}
