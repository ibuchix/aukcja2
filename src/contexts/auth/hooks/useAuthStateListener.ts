
import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";
import { queryInvalidationManager } from "@/utils/queryInvalidationManager";

/**
 * Enhanced hook to listen for authentication state changes with navigation handling
 */
export function useAuthStateListener(
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setProfile: (profile: any | null) => void,
  setIsLoading: (isLoading: boolean) => void
) {
  const authChangeInProgressRef = useRef(false);
  const navigationHandledRef = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Prevent double processing
        if (authChangeInProgressRef.current) {
          console.log("🔄 Auth change already in progress, skipping");
          return;
        }

        authChangeInProgressRef.current = true;
        console.log("🔄 Auth state changed:", event);
        console.log("📍 Current location:", location.pathname);
        console.log("🧭 Navigation handled ref:", navigationHandledRef.current);
        
        try {
          await AuthDebugger.captureAuthState(`Auth State Change: ${event}`);
          
          if (event === "SIGNED_OUT") {
            console.log("🚪 SIGNED_OUT event - cleaning up queries and session");
            
            // Reset navigation flag
            navigationHandledRef.current = false;
            
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
            console.log("✅ SIGNED_IN event - processing and navigating...");
            
            // Update session and user immediately
            setSession(currentSession);
            setUser(currentSession.user);
            setIsLoading(false);
            
            console.log("✅ Auth state updated after sign in");
            await AuthDebugger.captureAuthState("Sign In State Updated");
            
            // Navigation logic - only navigate if on auth page and not already handled
            const isOnAuthPage = location.pathname === '/auth' || location.pathname.includes('/auth');
            console.log("🔍 Is on auth page:", isOnAuthPage);
            console.log("🔍 Navigation already handled:", navigationHandledRef.current);
            
            if (isOnAuthPage && !navigationHandledRef.current) {
              navigationHandledRef.current = true;
              const returnUrl = location.state?.returnUrl || "/dealer/dashboard";
              console.log("🚀 Navigating from auth page to:", returnUrl);
              
              // Navigate immediately
              navigate(returnUrl, { replace: true });
            } else if (!isOnAuthPage) {
              console.log("🔄 Not on auth page, no navigation needed");
            } else if (navigationHandledRef.current) {
              console.log("🔄 Navigation already handled, skipping");
            }
            
            // Fetch profile data in background without blocking
            setTimeout(async () => {
              try {
                console.log("🔄 Fetching profile in background...");
                const profileData = await fetchDealerProfile(currentSession.user.id);
                
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
                
              } catch (profileError) {
                console.error("❌ Error fetching profile after sign in:", profileError);
                await AuthDebugger.captureAuthState("Sign In Profile Error");
                // Don't show error toast for profile issues as they don't block main functionality
              }
            }, 0);
            
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("🔄 Session token refreshed");
            
            // Update session immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            await AuthDebugger.captureAuthState("Token Refreshed");
            
            // Refresh profile in background
            setTimeout(async () => {
              try {
                const profileData = await fetchDealerProfile(currentSession.user.id);
                setProfile(profileData);
                
                // Refresh queries after token refresh
                queryInvalidationManager.refreshAuthQueries();
                
                await AuthDebugger.captureAuthState("Token Refresh Profile Success");
              } catch (profileError) {
                console.error("❌ Error fetching profile after token refresh:", profileError);
                await AuthDebugger.captureAuthState("Token Refresh Profile Error");
              }
            }, 0);
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
          }, 50);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setIsLoading, toast, navigate, location.state?.returnUrl, location.pathname]);
}
