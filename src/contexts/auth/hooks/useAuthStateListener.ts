
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
        console.log("📍 Current location during auth change:", location.pathname);
        
        try {
          await AuthDebugger.captureAuthState(`Auth State Change: ${event}`);
          
          if (event === "SIGNED_OUT") {
            console.log("🚪 SIGNED_OUT event - cleaning up and navigating to auth");
            
            // Immediately clear session and user
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            
            // Invalidate and clear all auth-dependent queries
            queryInvalidationManager.clearAllQueries();
            
            // Navigate to auth page immediately with detailed logging
            console.log("🚀 About to navigate to auth page after logout");
            try {
              navigate("/auth", { replace: true });
              console.log("✅ Navigation to /auth completed successfully");
            } catch (navError) {
              console.error("❌ Navigation to /auth failed:", navError);
            }
            
            await AuthDebugger.captureAuthState("Signed Out with Navigation");
            
          } else if (event === "SIGNED_IN" && currentSession?.user) {
            console.log("✅ SIGNED_IN event - processing and navigating...");
            console.log("📊 Session data:", {
              userId: currentSession.user.id,
              email: currentSession.user.email,
              expiresAt: currentSession.expires_at
            });
            
            // Update session and user immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            console.log("✅ Auth state updated after sign in");
            await AuthDebugger.captureAuthState("Sign In State Updated");
            
            // Navigation logic with detailed logging
            const isOnAuthPage = location.pathname === '/auth' || location.pathname.includes('/auth');
            const isAlreadyOnDashboard = location.pathname.includes('/dealer/dashboard');
            
            console.log("🔍 Navigation analysis:");
            console.log("  - Current pathname:", location.pathname);
            console.log("  - Is on auth page:", isOnAuthPage);
            console.log("  - Is already on dashboard:", isAlreadyOnDashboard);
            
            // Navigate to dashboard if we're on the auth page
            if (isOnAuthPage && !isAlreadyOnDashboard) {
              const targetUrl = location.state?.returnUrl || "/dealer/dashboard";
              console.log("🚀 About to navigate from auth page to:", targetUrl);
              
              try {
                navigate(targetUrl, { replace: true });
                console.log("✅ Navigation to dashboard completed successfully");
                
                // Set up a fallback navigation in case the first attempt fails
                setTimeout(() => {
                  if (window.location.pathname.includes('/auth')) {
                    console.log("⚠️ Still on auth page after navigation, attempting fallback");
                    window.location.href = targetUrl;
                  }
                }, 100);
                
              } catch (navError) {
                console.error("❌ Navigation to dashboard failed:", navError);
                // Fallback: use window.location for navigation
                console.log("🔄 Attempting fallback navigation");
                window.location.href = targetUrl;
              }
              
            } else if (isAlreadyOnDashboard) {
              console.log("✅ Already on dashboard, no navigation needed");
            } else {
              console.log("ℹ️ Not on auth page, staying on current page:", location.pathname);
            }
            
            // Fetch profile data in background without blocking navigation
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
