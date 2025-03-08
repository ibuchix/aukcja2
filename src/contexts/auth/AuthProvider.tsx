
import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuthState } from "./useAuthState";
import { fetchDealerProfile, signOutUser, refreshUserSession } from "./authUtils";
import { supabase } from "@/integrations/supabase/client";

// Define the shape of the context
type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signIn: (options: { exchangeToken?: string }) => Promise<{ error?: Error }>;
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

  // Sign in with exchange token
  const signIn = async ({ exchangeToken }: { exchangeToken?: string }) => {
    try {
      setIsLoading(true);
      
      if (!exchangeToken) {
        return { error: new Error("Missing exchange token") };
      }
      
      // Handle both token formats - JSON object or simple string
      let tokenData;
      try {
        // Try to parse it as JSON first
        tokenData = JSON.parse(exchangeToken);
      } catch (e) {
        // If it's not valid JSON, use it as a simple string
        console.log("Exchange token is not a JSON string, using as-is");
      }
      
      // If we have parsed token data with access and refresh tokens
      if (tokenData && tokenData.access_token && tokenData.refresh_token) {
        console.log("Using parsed token data with setSession");
        // Use setSession directly with the access and refresh tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token
        });
        
        if (error) {
          console.error("Error setting session with tokens:", error);
          return { error };
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch profile data
          if (data.session.user) {
            const profileData = await fetchDealerProfile(data.session.user.id);
            setProfile(profileData);
          }
        }
      } else {
        // Fall back to exchangeCodeForSession if we don't have token object
        console.log("Using exchangeCodeForSession with string token");
        const { data, error } = await supabase.auth.exchangeCodeForSession(exchangeToken);
        
        if (error) {
          console.error("Error exchanging token for session:", error);
          return { error };
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch profile data
          if (data.session.user) {
            const profileData = await fetchDealerProfile(data.session.user.id);
            setProfile(profileData);
          }
        }
      }
      
      return { error: undefined };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: error instanceof Error ? error : new Error("Unknown error") };
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
    signIn,
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
