
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Use refs to capture location data to avoid dependency cycles
  const locationRef = useRef(location);
  const isListenerActiveRef = useRef(false);

  // Update location ref when location changes
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    // Prevent multiple listeners
    if (isListenerActiveRef.current) {
      console.log("🔄 Auth listener already active, skipping");
      return;
    }

    console.log("🎯 Setting up auth state listener");
    isListenerActiveRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("🔄 Auth state changed:", event);
        console.log("📍 Current location during auth change:", locationRef.current.pathname);
        
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
            
            // Navigate to auth page
            console.log("🚀 Navigating to auth page after logout");
            try {
              navigate("/auth", { replace: true });
              console.log("✅ Navigation to /auth completed successfully");
            } catch (navError) {
              console.error("❌ Navigation to /auth failed:", navError);
              // Fallback navigation
              window.location.href = "/auth";
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
            
            // Get current location from ref to avoid dependency issues
            const currentLocation = locationRef.current;
            const isOnAuthPage = currentLocation.pathname === '/auth' || currentLocation.pathname.includes('/auth');
            const targetUrl = currentLocation.state?.returnUrl || "/dealer/dashboard";
            
            console.log("🔍 Navigation analysis:");
            console.log("  - Current pathname:", currentLocation.pathname);
            console.log("  - Is on auth page:", isOnAuthPage);
            console.log("  - Target URL:", targetUrl);
            
            // Navigate to dashboard if we're on the auth page
            if (isOnAuthPage) {
              console.log("🚀 Navigating from auth page to:", targetUrl);
              
              try {
                navigate(targetUrl, { replace: true });
                console.log("✅ Navigation to dashboard completed successfully");
                
                // Add a fallback navigation in case the first attempt fails
                setTimeout(() => {
                  if (window.location.pathname.includes('/auth')) {
                    console.log("⚠️ Still on auth page after navigation, using fallback");
                    window.location.href = targetUrl;
                  }
                }, 500);
                
              } catch (navError) {
                console.error("❌ Navigation to dashboard failed:", navError);
                // Fallback: use window.location for navigation
                console.log("🔄 Using fallback navigation");
                window.location.href = targetUrl;
              }
              
            } else {
              console.log("ℹ️ Not on auth page, staying on current page:", currentLocation.pathname);
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
            }, 100);
            
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
            }, 100);
          }
          
        } catch (error) {
          console.error("❌ Error in auth state change handler:", error);
          await AuthDebugger.captureAuthState("Auth State Change Error");
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log("🧹 Cleaning up auth state listener");
      subscription.unsubscribe();
      isListenerActiveRef.current = false;
    };
  }, [setSession, setUser, setProfile, setIsLoading, toast, navigate]); // Removed problematic location dependencies
}
