
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { shouldRefreshSession, refreshAuthToken, attemptSessionRecovery } from "@/utils/sessionRefresh";

/**
 * Hook to manage session refresh and token expiry
 */
export function useSessionManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const refreshFunctionRef = useRef<(() => Promise<void>) | null>(null);
  const lastRefreshAttemptRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Register the session refresh function from the auth context
  // Memoized to prevent infinite re-renders
  const registerRefreshFunction = useCallback((fn: () => Promise<void>) => {
    console.log("Session manager: Registering refresh function");
    refreshFunctionRef.current = fn;
  }, []);

  // Function to handle refresh failures with recovery attempts
  const handleRefreshFailure = useCallback(async () => {
    // Prevent multiple recovery attempts in quick succession
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < 30000) { // 30 seconds cooldown
      console.log("Skipping recovery attempt, too soon after last attempt");
      return;
    }
    
    lastRefreshAttemptRef.current = now;
    
    // Attempt session recovery
    const recoveryResult = await attemptSessionRecovery();
    
    if (!recoveryResult.success || recoveryResult.needsReauth) {
      console.log("Session recovery failed, redirecting to login");
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
      navigate("/auth?tab=login&expired=true");
    } else if (recoveryResult.success && refreshFunctionRef.current) {
      // If recovery was successful, call the regular refresh function
      // to update the app state
      try {
        await refreshFunctionRef.current();
        console.log("Session successfully recovered");
      } catch (error) {
        console.error("Error refreshing session after recovery:", error);
      }
    }
  }, [navigate, toast]);

  // Set up automatic token refresh when token nears expiry
  useEffect(() => {
    console.log("Setting up session manager");
    
    // Check session status on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          console.log("User signed out, redirecting to homepage");
          // Clear any active refresh timers
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
          }
          navigate("/");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        } else if (event === "USER_UPDATED") {
          console.log("User updated, refreshing session data");
          if (refreshFunctionRef.current) {
            try {
              await refreshFunctionRef.current();
            } catch (error) {
              console.error("Error refreshing session after user update:", error);
            }
          }
        }
      }
    );
    
    // Function to periodically check session and refresh if needed
    const checkAndRefreshSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (!session) {
          console.log("No active session to refresh");
          return;
        }
        
        // Proactively refresh token if it's close to expiry
        if (shouldRefreshSession(session, 5)) { // 5 minutes before expiry
          console.log("Session expiring soon, refreshing token");
          
          const refreshResult = await refreshAuthToken();
          
          if (!refreshResult.success) {
            console.error("Failed to refresh session:", refreshResult.error);
            
            // Only try recovery for specific error cases
            if (refreshResult.needsReauth) {
              await handleRefreshFailure();
            } else {
              // For other errors, we'll try again later
              console.log("Will retry refresh later");
            }
          } else if (refreshFunctionRef.current) {
            // Update app state with the new session
            await refreshFunctionRef.current();
            console.log("Session refreshed and app state updated");
          }
        }
      } catch (checkError) {
        console.error("Error checking session expiry:", checkError);
      } finally {
        // Schedule next check, but use a ref to allow cleanup
        refreshTimeoutRef.current = setTimeout(checkAndRefreshSession, 60 * 1000); // Check every minute
      }
    };
    
    // Initial check
    checkAndRefreshSession();
    
    return () => {
      console.log("Cleaning up session manager");
      subscription.unsubscribe();
      
      // Clear any pending timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [navigate, toast, handleRefreshFailure]);

  return { registerRefreshFunction };
}
