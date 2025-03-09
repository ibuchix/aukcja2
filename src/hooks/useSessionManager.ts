
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage session refresh and expiry
 */
export function useSessionManager() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const { toast } = useToast();

  // Set up automatic token refresh when token nears expiry
  useEffect(() => {
    const checkSessionExpiry = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (!session) {
          console.log("No active session found during expiry check");
          return;
        }
        
        // Calculate time until session expires (in seconds)
        const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
        if (!expiresAt) return;
        
        const now = new Date();
        const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        
        // If session expires in less than 5 minutes (300 seconds), refresh it
        if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
          console.log(`Session expiring soon (${timeUntilExpiry}s), refreshing...`);
          refreshSession();
        }
      } catch (error) {
        console.error("Error checking session expiry:", error);
      }
    };
    
    // Check on initial load
    checkSessionExpiry();
    
    // Then set up interval to check every minute
    const interval = setInterval(checkSessionExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [refreshSession, navigate, toast]);

  // Listen for auth state changes from other tabs
  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log("Token was refreshed", new Date().toISOString());
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out in another tab");
          navigate("/auth?tab=login");
          
          toast({
            title: "Signed out",
            description: "You were signed out in another tab or window.",
          });
        }
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);
}
