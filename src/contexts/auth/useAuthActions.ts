
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from './context';
import { signOutUser, refreshUserSession } from './authUtils';

interface AuthActionResponse {
  success: boolean;
  error?: string;
}

export const useAuthActions = () => {
  const { setAuthState } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async (): Promise<AuthActionResponse> => {
    setIsLoading(true);
    try {
      const result = await signOutUser();
      if (result === true || (typeof result === 'object' && result.success)) {
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
        });
        navigate('/');
        return { success: true };
      }
      
      return { 
        success: false, 
        error: typeof result === 'object' && result.error ? result.error.toString() : 'Sign out failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<AuthActionResponse> => {
    setIsLoading(true);
    try {
      const result = await refreshUserSession();
      
      if (result === true || (typeof result === 'object' && result.success)) {
        const session = typeof result === 'object' ? result.session : null;
        const user = session?.user || null;
        
        if (user) {
          setAuthState(prevState => ({
            ...prevState,
            user,
            session,
            isAuthenticated: true,
            isLoading: false,
          }));
          return { success: true };
        }
      }
      
      return { 
        success: false, 
        error: typeof result === 'object' && result.error ? result.error.toString() : 'Session refresh failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session refresh failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signOut,
    refreshSession,
    isLoading,
  };
};
