
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
        
        // Clear any stale tokens
        try {
          const storedToken = localStorage.getItem('dealer_auth_token');
          if (storedToken) {
            // Try to parse the token to check if it's valid JSON
            try {
              JSON.parse(storedToken);
            } catch (parseError) {
              // If we can't parse it, it's probably corrupted
              console.warn("Found corrupted auth token, removing it");
              localStorage.removeItem('dealer_auth_token');
              localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
            }
          }
        } catch (storageError) {
          console.warn("Error accessing localStorage:", storageError);
        }
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("Existing session found, expires at:", 
                     new Date(data.session.expires_at! * 1000).toLocaleString());
          
          // Check if token is close to expiration (within 5 minutes)
          const expiresAt = data.session.expires_at ? new Date(data.session.expires_at * 1000) : null;
          const now = new Date();
          
          if (expiresAt && (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000)) {
            console.log("Session is about to expire, refreshing...");
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error("Error refreshing token:", refreshError);
                setIsLoading(false);
                return;
              }
              
              if (refreshData.session) {
                console.log("Session refreshed successfully");
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                
                // Fetch profile data if authenticated
                if (refreshData.session.user) {
                  const profileData = await fetchDealerProfile(refreshData.session.user.id);
                  setProfile(profileData);
                }
              }
            } catch (refreshErr) {
              console.error("Exception during token refresh:", refreshErr);
            }
          } else {
            // Session is valid and not about to expire
            setSession(data.session);
            setUser(data.session.user);
            
            // Fetch profile data if authenticated
            if (data.session.user) {
              const profileData = await fetchDealerProfile(data.session.user.id);
              setProfile(profileData);
            }
          }
        } else {
          console.log("No existing session found");
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
            // Give a small delay to allow auth state to fully establish
            setTimeout(async () => {
              try {
                const profileData = await fetchDealerProfile(currentSession.user.id);
                setProfile(profileData);
                toast({
                  title: "Signed in successfully",
                  description: "Welcome back to your dealer dashboard",
                });
              } catch (profileError) {
                console.error("Error fetching profile after sign in:", profileError);
              }
            }, 500);
          } else if (event === "SIGNED_OUT") {
            setProfile(null);
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("Session token refreshed successfully");
            
            // Refresh profile data when token is refreshed
            if (currentSession.user) {
              setTimeout(async () => {
                try {
                  const profileData = await fetchDealerProfile(currentSession.user.id);
                  setProfile(profileData);
                } catch (profileError) {
                  console.error("Error fetching profile after token refresh:", profileError);
                }
              }, 500);
            }
          }
        } finally {
          // Reset the lock after a small delay
          setTimeout(() => {
            authChangeInProgressRef.current = false;
          }, 300);
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
