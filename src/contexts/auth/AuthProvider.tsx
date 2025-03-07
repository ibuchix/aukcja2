import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuthState } from "./useAuthState";
import { fetchDealerProfile, signOutUser, refreshUserSession } from "./authUtils";

// Define the shape of the context
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    session, 
    user, 
    profile, 
    isLoading, 
    setProfile,
    setSession,
    setUser,
    setIsLoading 
  } = useAuthState();
  
  const { toast } = useToast();
  
  // Use our session manager hook to keep the session alive
  useSessionManager();

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await signOutUser();
      
      if (!success && error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the session
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { success, session: newSession, user: newUser, error } = await refreshUserSession();
      
      if (!success || error) {
        console.error("Session refresh error:", error);
        return;
      }
      
      if (newSession) {
        console.log("Session refreshed successfully");
        setSession(newSession);
        setUser(newUser ?? null);
        
        if (newUser) {
          const profileData = await fetchDealerProfile(newUser.id);
          setProfile(profileData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
