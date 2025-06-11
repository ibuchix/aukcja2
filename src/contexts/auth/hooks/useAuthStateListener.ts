
import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";

/**
 * Simplified hook to listen for authentication state changes
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
          await AuthDebugger.captureAuthState(`Auth State Change: ${event}`);
          
          // Update session and user immediately
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === "SIGNED_IN" && currentSession?.user) {
            setIsLoading(true);
            
            // Minimal delay to ensure auth context propagates
            setTimeout(async () => {
              try {
                const profileData = await fetchDealerProfile(currentSession.user.id);
                
                if (profileData) {
                  setProfile(profileData);
                  toast({
                    title: "Signed in successfully",
                    description: "Welcome back to your dealer dashboard",
                  });
                  await AuthDebugger.captureAuthState("Sign In Profile Load Success");
                } else {
                  console.log("No profile data found after sign in");
                  await AuthDebugger.captureAuthState("Sign In No Profile");
                }
              } catch (profileError) {
                console.error("Error fetching profile after sign in:", profileError);
                await AuthDebugger.captureAuthState("Sign In Profile Error");
                // Don't fail the sign in if profile fetch fails
              } finally {
                setIsLoading(false);
              }
            }, 200); // Reduced from 500ms
            
          } else if (event === "SIGNED_OUT") {
            setProfile(null);
            setIsLoading(false);
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
            await AuthDebugger.captureAuthState("Signed Out");
            
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("Session token refreshed successfully");
            await AuthDebugger.captureAuthState("Token Refreshed");
            
            // Refresh profile data when token is refreshed
            if (currentSession.user) {
              setIsLoading(true);
              
              setTimeout(async () => {
                try {
                  const profileData = await fetchDealerProfile(currentSession.user.id);
                  setProfile(profileData);
                  await AuthDebugger.captureAuthState("Token Refresh Profile Success");
                } catch (profileError) {
                  console.error("Error fetching profile after token refresh:", profileError);
                  await AuthDebugger.captureAuthState("Token Refresh Profile Error");
                } finally {
                  setIsLoading(false);
                }
              }, 200); // Reduced from 500ms
            }
          } else {
            // For any other events, ensure loading is false
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          await AuthDebugger.captureAuthState("Auth State Change Error");
          setIsLoading(false);
        } finally {
          // Reset the lock after a minimal delay
          setTimeout(() => {
            authChangeInProgressRef.current = false;
          }, 100); // Reduced from 300ms
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setIsLoading, toast]);
}
