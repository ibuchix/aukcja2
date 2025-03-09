
import { Session, User } from "@supabase/supabase-js";

// Context type definition
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signIn: (options: { 
    email: string;
    password: string;
    redirectTo?: string;
  }) => Promise<{ error?: Error }>;
};

// Default context values
export const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  signOut: async () => {},
  refreshSession: async () => {},
  signIn: async () => ({ error: new Error("Auth context not initialized") })
};
