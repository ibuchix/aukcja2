
import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isInitialized: boolean; // Add initialization state
  isAuthenticated: boolean;
  signIn: (credentials: { email: string; password: string; redirectTo?: string }) => 
    Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

// Default values
export const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false, // Default to not initialized
  isAuthenticated: false,
  signIn: async () => ({ success: false, error: "Auth context not initialized" }),
  signOut: async () => ({ success: false, error: "Auth context not initialized" }),
  refreshSession: async () => { throw new Error("Auth context not initialized") }
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
