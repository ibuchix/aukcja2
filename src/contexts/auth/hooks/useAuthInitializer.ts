
import { useState, useRef, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";

/**
 * Hook to initialize authentication state and check for existing sessions
 */
export function useAuthInitializer() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  const isInitializedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializedRef.current) return;
      
      try {
        console.log("Starting auth initialization sequence");
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
          setInitializationComplete(true);
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
                setInitializationComplete(true);
                return;
              }
              
              if (refreshData.session) {
                console.log("Session refreshed successfully");
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                
                // Fetch profile data if authenticated
                if (refreshData.session.user) {
                  try {
                    const profileData = await fetchDealerProfile(refreshData.session.user.id);
                    setProfile(profileData);
                  } catch (profileError) {
                    console.error("Error fetching profile:", profileError);
                    // Continue even if profile fetch fails - don't block auth
                  }
                }
              }
            } catch (refreshErr) {
              console.error("Exception during token refresh:", refreshErr);
            } finally {
              // Always set loading to false and mark initialization as complete
              setIsLoading(false);
              setInitializationComplete(true);
            }
          } else {
            // Session is valid and not about to expire
            setSession(data.session);
            setUser(data.session.user);
            
            // Fetch profile data if authenticated
            if (data.session.user) {
              try {
                const profileData = await fetchDealerProfile(data.session.user.id);
                setProfile(profileData);
              } catch (profileError) {
                console.error("Error fetching profile:", profileError);
                // Continue even if profile fetch fails - don't block auth
              } finally {
                setIsLoading(false);
                setInitializationComplete(true);
              }
            } else {
              setIsLoading(false);
              setInitializationComplete(true);
            }
          }
        } else {
          console.log("No existing session found");
          setIsLoading(false);
          setInitializationComplete(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoading(false);
        setInitializationComplete(true);
      }
    };

    // Add a forced delay before initializing to prevent race conditions
    const delay = setTimeout(() => {
      initializeAuth();
    }, 500); // 500ms delay before even starting auth initialization
    
    // Set a safety timeout to prevent endless loading
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization safety timeout triggered");
        setIsLoading(false);
        setInitializationComplete(true);
      }
    }, 5000); // 5 second maximum loading time
    
    return () => {
      clearTimeout(delay);
      clearTimeout(safetyTimeout);
    };
  }, [isLoading, toast]);

  return {
    session,
    user,
    profile,
    isLoading,
    initializationComplete,
    setSession,
    setUser,
    setProfile,
    setIsLoading
  };
}
