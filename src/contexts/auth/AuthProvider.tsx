
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
      
      console.log("Received exchange token to process");
      
      // Parse the exchange token
      let tokenData;
      try {
        tokenData = JSON.parse(exchangeToken);
        console.log("Successfully parsed exchange token", { userId: tokenData.user_id });
      } catch (e) {
        console.error("Failed to parse exchange token", e);
        return { error: new Error("Invalid exchange token format") };
      }
      
      // Check if we have the expected data in our token
      if (!tokenData.user_id || !tokenData.email) {
        console.error("Exchange token missing required fields", tokenData);
        return { error: new Error("Invalid exchange token: missing required fields") };
      }
      
      // Instead of trying to use Supabase's token exchange, we'll sign in directly
      // using the email and a one-time password mechanism
      const { data, error } = await supabase.auth.signInWithPassword({
        email: tokenData.email,
        password: tokenData.code_verifier
      });
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          console.log("Using fallback auth method due to invalid credentials");
          
          // Fallback: try to sign in with a temporary email link
          const { data: magicData, error: magicError } = await supabase.auth.signInWithOtp({
            email: tokenData.email,
            options: {
              shouldCreateUser: false  // Don't create a new user
            }
          });
          
          if (magicError) {
            console.error("Fallback auth method failed:", magicError);
            return { error: magicError };
          }
          
          toast({
            title: "Verification email sent",
            description: "We've sent a verification link to your email.",
          });
          
          return { error: undefined };
        }
        
        console.error("Error signing in:", error);
        return { error };
      }
      
      if (data?.session) {
        console.log("Successfully signed in with session");
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch profile data
        if (data.session.user) {
          const profileData = await fetchDealerProfile(data.session.user.id);
          setProfile(profileData);
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
