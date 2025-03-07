
import { useState, useRef, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "./authUtils";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isInitializedRef = useRef(false);
  const authChangeInProgressRef = useRef(false);
  const { toast } = useToast();

  // Initialize - check for existing session
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializedRef.current) return;
      
      try {
        setIsLoading(true);
        isInitializedRef.current = true;
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("Existing session found");
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch profile data if authenticated
          if (data.session.user) {
            const profileData = await fetchDealerProfile(data.session.user.id);
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Prevent double processing
        if (authChangeInProgressRef.current) {
          return;
        }

        authChangeInProgressRef.current = true;
        console.log("Auth state changed:", event);
        
        try {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === "SIGNED_IN" && currentSession?.user) {
            const profileData = await fetchDealerProfile(currentSession.user.id);
            setProfile(profileData);
            toast({
              title: "Signed in successfully",
              description: "Welcome back to your dealer dashboard",
            });
          } else if (event === "SIGNED_OUT") {
            setProfile(null);
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("Session token refreshed successfully");
          }
        } finally {
          // Reset the lock after a small delay
          setTimeout(() => {
            authChangeInProgressRef.current = false;
          }, 100);
        }
      }
    );

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    session,
    user,
    profile,
    isLoading,
    setProfile,
    setSession,
    setUser,
    setIsLoading
  };
}
