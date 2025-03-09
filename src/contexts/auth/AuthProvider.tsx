
import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuthState } from "./useAuthState";
import { fetchDealerProfile, signOutUser, refreshUserSession } from "./authUtils";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  
  useSessionManager();

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

  const signIn = async ({ 
    email, 
    password, 
    redirectTo
  }: { 
    email: string;
    password: string;
    redirectTo?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Normalize the email for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log(`Attempting to sign in with email: ${normalizedEmail} (length: ${normalizedEmail.length})`);
      
      // Clear local storage before attempting login to prevent stale token issues
      try {
        localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
        localStorage.removeItem('dealer_auth_token');
      } catch (clearError) {
        console.warn("Error clearing local storage:", clearError);
      }
      
      // First check if the email exists
      const { data: emailCheck, error: checkError } = await supabase.rpc(
        'check_email_exists', 
        { email_to_check: normalizedEmail }
      );
      
      if (checkError) {
        console.error("Error checking if email exists:", checkError);
      } else if (emailCheck && !(emailCheck as any).exists) {
        console.error("Email does not exist in database:", normalizedEmail);
        return { error: new Error("Email not found. Please check your email or register for a new account.") };
      } else {
        console.log("Email exists in database, proceeding with login attempt");
      }
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        console.error("Error details:", JSON.stringify(error));
        return { error };
      }
      
      console.log("Sign in successful");
      console.log("Session data:", {
        sessionId: data.session?.access_token.substring(0, 10) + '...',
        expires: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'unknown',
        userId: data.user?.id
      });
      
      setSession(data.session);
      setUser(data.user);
      
      if (data.user) {
        console.log("Fetching dealer profile for user ID:", data.user.id);
        const profileData = await fetchDealerProfile(data.user.id);
        console.log("Retrieved profile data:", profileData);
        
        if (!profileData) {
          console.warn("No dealer profile found for this user. The user may not be registered as a dealer.");
        }
        
        setProfile(profileData);
      }
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
      
      return { error: undefined };
    } catch (error) {
      console.error("Sign in error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack available");
      return { error: error instanceof Error ? error : new Error("Unknown error") };
    } finally {
      setIsLoading(false);
    }
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
