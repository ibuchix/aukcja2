
import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";

/**
 * Hook to listen for authentication state changes
 */
export function useAuthStateListener(
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setProfile: (profile: any | null) => void,
  setIsLoading: (isLoading: boolean) => void
) {
  const authChangeInProgressRef = useRef(false);
  const { toast } = useToast();

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
            setIsLoading(true);
            
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
              } finally {
                setIsLoading(false);
              }
            }, 500);
          } else if (event === "SIGNED_OUT") {
            setProfile(null);
            setIsLoading(false);
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("Session token refreshed successfully");
            
            // Refresh profile data when token is refreshed
            if (currentSession.user) {
              setIsLoading(true);
              
              setTimeout(async () => {
                try {
                  const profileData = await fetchDealerProfile(currentSession.user.id);
                  setProfile(profileData);
                } catch (profileError) {
                  console.error("Error fetching profile after token refresh:", profileError);
                } finally {
                  setIsLoading(false);
                }
              }, 500);
            }
          } else {
            // For any other events, ensure loading is false
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          setIsLoading(false);
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
  }, [setSession, setUser, setProfile, setIsLoading, toast]);
}
