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
  signIn: (options: { exchangeToken?: string }) => Promise<{ error?: Error }>;
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

  const signIn = async ({ exchangeToken }: { exchangeToken?: string }) => {
    try {
      setIsLoading(true);
      
      if (!exchangeToken) {
        return { error: new Error("Missing exchange token") };
      }
      
      console.log("Received exchange token to process");
      
      let tokenData;
      try {
        tokenData = JSON.parse(exchangeToken);
        console.log("Successfully parsed exchange token", { userId: tokenData.user_id });
      } catch (e) {
        console.error("Failed to parse exchange token", e);
        return { error: new Error("Invalid exchange token format") };
      }
      
      if (!tokenData.user_id || !tokenData.email) {
        console.error("Exchange token missing required fields", tokenData);
        return { error: new Error("Invalid exchange token: missing required fields") };
      }
      
      if (tokenData.properties && tokenData.properties.email_otp) {
        console.log("Using email OTP verification");
        
        const { data, error } = await supabase.auth.verifyOtp({
          email: tokenData.email,
          token: tokenData.properties.email_otp,
          type: 'email'
        });
        
        if (error) {
          console.error("Error verifying OTP token:", error);
          
          toast({
            title: "Direct login failed",
            description: "We've sent a backup verification link to your email. Please check your inbox.",
            variant: "destructive",
          });
          
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email: tokenData.email,
            options: {
              shouldCreateUser: false
            }
          });
          
          if (magicLinkError) {
            console.error("Fallback to magic link failed:", magicLinkError);
            return { error: magicLinkError };
          }
          
          return { error: undefined };
        }
        
        if (data.session) {
          console.log("Successfully signed in with OTP verification");
          setSession(data.session);
          setUser(data.user);
          
          if (data.user) {
            const profileData = await fetchDealerProfile(data.user.id);
            setProfile(profileData);
          }
          
          toast({
            title: "Login successful",
            description: "You have been successfully signed in.",
          });
          
          return { error: undefined };
        }
      } else {
        console.log("No OTP properties found, falling back to magic link");
        const { error } = await supabase.auth.signInWithOtp({
          email: tokenData.email,
          options: {
            shouldCreateUser: false
          }
        });
        
        if (error) {
          console.error("Error sending magic link:", error);
          return { error };
        }
        
        toast({
          title: "Verification email sent",
          description: "We've sent a verification link to your email. Please check your inbox to complete sign-in.",
        });
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
