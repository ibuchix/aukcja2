
import { Session, User } from "@supabase/supabase-js";

// Context type definition
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isInitialized: boolean; // Add the isInitialized property
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signIn: (options: { 
    email: string;
    password: string;
    redirectTo?: string;
  }) => Promise<{ success: boolean; error?: string }>;
};

// Default context values
export const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false, // Add the isInitialized property with a default value
  isAuthenticated: false,
  signOut: async () => {},
  refreshSession: async () => {},
  signIn: async () => ({ success: false, error: "Auth context not initialized" })
};
