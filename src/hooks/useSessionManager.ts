
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage session refresh and token expiry
 */
export function useSessionManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshFunction, setRefreshFunction] = useState<() => Promise<void>>(() => async () => {});

  // Register the session refresh function from the auth context
  // Memoized to prevent infinite re-renders
  const registerRefreshFunction = useCallback((fn: () => Promise<void>) => {
    setRefreshFunction(() => fn);
  }, []);

  // Set up automatic token refresh when token nears expiry
  useEffect(() => {
    if (!refreshFunction) return;
    
    console.log("Setting up session manager");
    
    // Check session status on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          console.log("User signed out, redirecting to homepage");
          navigate("/");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        } else if (event === "USER_UPDATED") {
          console.log("User updated, refreshing session data");
          await refreshFunction();
        }
      }
    );
    
    // Set up timer to refresh token when needed
    const checkSessionTimer = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) return;
      
      const expiresAt = data.session.expires_at * 1000; // Convert to ms
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log("Session expiring soon, refreshing token");
        try {
          await refreshFunction();
          console.log("Session refreshed successfully");
        } catch (error) {
          console.error("Failed to refresh session:", error);
          toast({
            title: "Session Error",
            description: "Your session could not be refreshed. Please log in again.",
            variant: "destructive",
          });
          navigate("/auth?tab=login");
        }
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      console.log("Cleaning up session manager");
      subscription.unsubscribe();
      clearInterval(checkSessionTimer);
    };
  }, [navigate, toast, refreshFunction]);

  return { registerRefreshFunction };
}
