
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchDealerProfile } from "./authUtils";
import { normalizeEmail } from "@/utils/dealerProfileMapping";

export function useSignInHandler(
  setIsLoading: (loading: boolean) => void,
  setSession: (session: any) => void,
  setUser: (user: any) => void,
  setProfile: (profile: any) => void
) {
  const navigate = useNavigate();

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
      
      // Normalize the email for consistency using our utility function
      const normalizedEmail = normalizeEmail(email);
      
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
      
      // Set the session and user in state
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
      
      // Only navigate if explicitly requested and login was successful
      if (redirectTo && data.session) {
        navigate(redirectTo);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack available");
      return { error: error instanceof Error ? error : new Error("Unknown error") };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn };
}
