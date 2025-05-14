
import { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthState?: (state: any) => void;
  signOut: () => Promise<any>;
  refreshSession: () => Promise<any>;
  signIn: (credentials: { email: string; password: string; redirectTo?: string }) => Promise<any>;
}

export const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => ({ success: false, error: 'Not implemented' }),
  refreshSession: async () => ({ success: false, error: 'Not implemented' }),
  signIn: async () => ({ success: false, error: 'Not implemented' }),
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const useAuth = () => useContext(AuthContext);
