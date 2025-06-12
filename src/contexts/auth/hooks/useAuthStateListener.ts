
import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";
import { verifyAuthForDatabase } from "@/utils/authVerification";

/**
 * Enhanced hook to listen for authentication state changes with database verification
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
        console.log("🔄 Auth state changed:", event);
        
        try {
          await AuthDebugger.captureAuthState(`Auth State Change: ${event}`);
          
          // Update session and user immediately
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === "SIGNED_IN" && currentSession?.user) {
            setIsLoading(true);
            
            console.log("✅ SIGNED_IN event - verifying database access...");
            
            // CRITICAL: Verify database access before proceeding
            try {
              const authVerification = await verifyAuthForDatabase();
              
              if (!authVerification.isValid) {
                console.error("❌ Database access verification failed after SIGNED_IN:", authVerification);
                
                toast({
                  title: "Authentication Issue",
                  description: "Sign in was successful but we're having trouble accessing your data. Please try refreshing the page.",
                  variant: "destructive",
                });
                
                await AuthDebugger.captureAuthState("Sign In Database Access Failed");
                setIsLoading(false);
                return;
              }
              
              console.log("✅ Database access verified after SIGNED_IN");
              await AuthDebugger.captureAuthState("Sign In Database Access Verified");
              
              // Now safely fetch profile data
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
                  console.log("ℹ️ No profile data found after sign in");
                  await AuthDebugger.captureAuthState("Sign In No Profile");
                }
              } catch (profileError) {
                console.error("❌ Error fetching profile after sign in:", profileError);
                await AuthDebugger.captureAuthState("Sign In Profile Error");
                // Don't fail the sign in if profile fetch fails
              }
              
            } catch (verificationError) {
              console.error("❌ Auth verification exception after SIGNED_IN:", verificationError);
              await AuthDebugger.captureAuthState("Sign In Verification Exception");
              
              toast({
                title: "Authentication Error",
                description: "There was an issue verifying your authentication. Please try signing in again.",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
            
          } else if (event === "SIGNED_OUT") {
            setProfile(null);
            setIsLoading(false);
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
            await AuthDebugger.captureAuthState("Signed Out");
            
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("🔄 Session token refreshed - verifying database access");
            await AuthDebugger.captureAuthState("Token Refreshed");
            
            // Verify database access after token refresh
            setIsLoading(true);
            
            try {
              const authVerification = await verifyAuthForDatabase();
              
              if (authVerification.isValid && currentSession.user) {
                // Refresh profile data when token is refreshed
                try {
                  const profileData = await fetchDealerProfile(currentSession.user.id);
                  setProfile(profileData);
                  await AuthDebugger.captureAuthState("Token Refresh Profile Success");
                } catch (profileError) {
                  console.error("❌ Error fetching profile after token refresh:", profileError);
                  await AuthDebugger.captureAuthState("Token Refresh Profile Error");
                }
              } else {
                console.error("❌ Database access failed after token refresh:", authVerification);
                await AuthDebugger.captureAuthState("Token Refresh Database Access Failed");
              }
            } catch (verificationError) {
              console.error("❌ Auth verification exception after token refresh:", verificationError);
              await AuthDebugger.captureAuthState("Token Refresh Verification Exception");
            } finally {
              setIsLoading(false);
            }
          } else {
            // For any other events, ensure loading is false
            setIsLoading(false);
          }
        } catch (error) {
          console.error("❌ Error in auth state change handler:", error);
          await AuthDebugger.captureAuthState("Auth State Change Error");
          setIsLoading(false);
        } finally {
          // Reset the lock after a minimal delay
          setTimeout(() => {
            authChangeInProgressRef.current = false;
          }, 100);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setIsLoading, toast]);
}
