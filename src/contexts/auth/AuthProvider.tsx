
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
      
      console.log(`Signing in with email: ${email.substring(0, 3)}...`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }
      
      console.log("Sign in successful");
      setSession(data.session);
      setUser(data.user);
      
      if (data.user) {
        const profileData = await fetchDealerProfile(data.user.id);
        setProfile(profileData);
      }
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
      
      return { error: undefined };
    } catch (error) {
      console.error("Sign in error:", error);
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
