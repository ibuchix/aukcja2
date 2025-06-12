import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";
import { queryInvalidationManager } from "@/utils/queryInvalidationManager";

/**
 * Enhanced hook to listen for authentication state changes with query management
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
          
          if (event === "SIGNED_OUT") {
            console.log("🚪 SIGNED_OUT event - cleaning up queries and session");
            
            // Immediately clear session and user
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            
            // Invalidate and clear all auth-dependent queries
            queryInvalidationManager.clearAllQueries();
            
            toast({
              title: "Signed out",
              description: "You have been signed out successfully",
            });
            await AuthDebugger.captureAuthState("Signed Out with Query Cleanup");
            
          } else if (event === "SIGNED_IN" && currentSession?.user) {
            console.log("✅ SIGNED_IN event - processing...");
            
            // Update session and user immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Keep loading state briefly while we fetch profile
            setIsLoading(true);
            
            try {
              // Fetch profile data with timeout
              const profileData = await Promise.race([
                fetchDealerProfile(currentSession.user.id),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
                )
              ]);
              
              if (profileData) {
                setProfile(profileData);
                console.log("✅ Profile loaded successfully after sign in");
                await AuthDebugger.captureAuthState("Sign In Profile Load Success");
              } else {
                console.log("ℹ️ No profile data found after sign in");
                await AuthDebugger.captureAuthState("Sign In No Profile");
              }
              
              // Refresh auth-dependent queries after successful sign in
              queryInvalidationManager.refreshAuthQueries();
              
              toast({
                title: "Signed in successfully",
                description: "Welcome back to your dealer dashboard",
              });
              
            } catch (profileError) {
              console.error("❌ Error fetching profile after sign in:", profileError);
              await AuthDebugger.captureAuthState("Sign In Profile Error");
              
              // Don't block sign in if profile fetch fails
              toast({
                title: "Signed in successfully", 
                description: "Welcome back! Profile data will load shortly.",
              });
            }
            
            // Always reset loading state after processing
            setIsLoading(false);
            
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("🔄 Session token refreshed");
            
            // Update session immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            await AuthDebugger.captureAuthState("Token Refreshed");
            
            // Briefly set loading to refresh profile
            setIsLoading(true);
            
            try {
              const profileData = await fetchDealerProfile(currentSession.user.id);
              setProfile(profileData);
              
              // Refresh queries after token refresh
              queryInvalidationManager.refreshAuthQueries();
              
              await AuthDebugger.captureAuthState("Token Refresh Profile Success");
            } catch (profileError) {
              console.error("❌ Error fetching profile after token refresh:", profileError);
              await AuthDebugger.captureAuthState("Token Refresh Profile Error");
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
          // Reset the lock after a brief delay
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
