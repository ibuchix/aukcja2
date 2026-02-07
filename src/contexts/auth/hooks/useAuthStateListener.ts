
import { useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";
import { queryInvalidationManager } from "@/utils/queryInvalidationManager";
import { translateUILabel, translateMessage } from "@/lib/vehicleTranslations";
import { sanitizeReturnUrl } from "@/utils/sanitizeReturnUrl";

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
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      (event, currentSession) => {
        console.log("🔄 Auth state changed:", event);
        console.log("📍 Current location during auth change:", locationRef.current.pathname);
        
        try {
          if (event === "SIGNED_OUT") {
            console.log("🚪 SIGNED_OUT event detected - immediate cleanup and navigation");
            
            // Immediately clear all auth state
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            
            // Clear all auth-dependent queries
            queryInvalidationManager.clearAllQueries();
            
            console.log("✅ Auth state cleared successfully");
            
            // Capture debug info
            AuthDebugger.captureAuthState("Signed Out - State Cleared").catch(console.warn);
            
            // Navigate to auth page with replace to prevent back navigation
            console.log("🚀 Navigating to auth page after logout");
            // Clear any pending navigation
            if (navigationTimeoutRef.current) {
              clearTimeout(navigationTimeoutRef.current);
            }
            navigationTimeoutRef.current = setTimeout(() => {
              navigate("/auth", { replace: true });
            }, 50);
            
          } else if (event === "SIGNED_IN" && currentSession?.user) {
            console.log("✅ SIGNED_IN event - processing...");
            console.log("📊 Session data:", {
              userId: currentSession.user.id,
              email: currentSession.user.email,
              expiresAt: currentSession.expires_at
            });
            
            // Update session and user immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            console.log("✅ Auth state updated after sign in");
            AuthDebugger.captureAuthState("Sign In State Updated").catch(console.warn);
            
            // Dealer-only guard: verify the signed-in user has a dealer profile
            setTimeout(async () => {
              try {
                const { data: dealerId, error: dealerCheckError } = await supabase.rpc('get_dealer_profile_id');
                if (dealerCheckError) {
                  console.warn('Dealer check RPC error:', dealerCheckError);
                }
                if (!dealerId) {
                  toast({
                    title: translateUILabel('Dealer account required'),
                    description: translateMessage('This app is restricted to dealer accounts. Please register as a dealer.'),
                    variant: 'destructive',
                  });
                  await supabase.auth.signOut();
                  navigate('/auth', { replace: true });
                  return;
                }
              } catch (dealerGuardError) {
                console.error('Dealer guard check failed:', dealerGuardError);
              }
            }, 0);
            
            // Get current location from ref
            const currentLocation = locationRef.current;
            const isOnAuthPage = currentLocation.pathname === '/auth' || currentLocation.pathname.includes('/auth');
            const targetUrl = sanitizeReturnUrl(currentLocation.state?.returnUrl || "/dealer/dashboard");
            
            console.log("🔍 Navigation analysis:");
            console.log("  - Current pathname:", currentLocation.pathname);
            console.log("  - Is on auth page:", isOnAuthPage);
            console.log("  - Target URL:", targetUrl);
            
            // Navigate to dashboard if we're on the auth page
            if (isOnAuthPage) {
              console.log("🚀 Navigating from auth page to:", targetUrl);
              // Clear any pending navigation
              if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
              }
              navigationTimeoutRef.current = setTimeout(() => {
                navigate(targetUrl, { replace: true });
              }, 50);
            } else {
              console.log("ℹ️ Not on auth page, staying on current page:", currentLocation.pathname);
            }
            
            // Fetch profile data in background
            setTimeout(async () => {
              try {
                console.log("🔄 Fetching profile in background...");
                const profileData = await fetchDealerProfile(currentSession.user.id);
                
                if (profileData) {
                  setProfile(profileData);
                  console.log("✅ Profile loaded successfully after sign in");
                  AuthDebugger.captureAuthState("Sign In Profile Load Success").catch(console.warn);
                } else {
                  console.log("ℹ️ No profile data found after sign in");
                  AuthDebugger.captureAuthState("Sign In No Profile").catch(console.warn);
                }
                
                // Refresh auth-dependent queries after successful sign in
                queryInvalidationManager.refreshAuthQueries();
                
              } catch (profileError) {
                console.error("❌ Error fetching profile after sign in:", profileError);
                AuthDebugger.captureAuthState("Sign In Profile Error").catch(console.warn);
              }
            }, 100);
            
          } else if (event === "TOKEN_REFRESHED" && currentSession) {
            console.log("🔄 Session token refreshed");
            
            // Update session immediately
            setSession(currentSession);
            setUser(currentSession.user);
            
            AuthDebugger.captureAuthState("Token Refreshed").catch(console.warn);
            
            // Refresh profile in background
            setTimeout(async () => {
              try {
                const profileData = await fetchDealerProfile(currentSession.user.id);
                setProfile(profileData);
                
                // Refresh queries after token refresh
                queryInvalidationManager.refreshAuthQueries();
                
                AuthDebugger.captureAuthState("Token Refresh Profile Success").catch(console.warn);
              } catch (profileError) {
                console.error("❌ Error fetching profile after token refresh:", profileError);
                AuthDebugger.captureAuthState("Token Refresh Profile Error").catch(console.warn);
              }
            }, 100);
          }
          
        } catch (error) {
          console.error("❌ Error in auth state change handler:", error);
          AuthDebugger.captureAuthState("Auth State Change Error").catch(console.warn);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log("🧹 Cleaning up auth state listener");
      subscription.unsubscribe();
      isListenerActiveRef.current = false;
      // Clear any pending navigation
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [setSession, setUser, setProfile, setIsLoading, toast, navigate]);
}
