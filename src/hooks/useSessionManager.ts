
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Configure how long a session should last without activity before showing a warning
const IDLE_WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes
// Configure how long a session should last without activity before ending
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
// How often to refresh the token while active
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useSessionManager() {
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  const resetIdleTimer = () => {
    // Clear existing timers
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
    }

    // Set warning timer (will show warning after 25 min of inactivity)
    warningTimerRef.current = window.setTimeout(() => {
      toast({
        title: "Session expiring soon",
        description: "You'll be logged out in 5 minutes due to inactivity. Move your mouse or press a key to stay logged in.",
        duration: 10000,
      });
    }, IDLE_WARNING_TIMEOUT);

    // Set idle timer (will log out after 30 min of inactivity)
    idleTimerRef.current = window.setTimeout(async () => {
      console.log("Idle timeout reached, logging out");
      await supabase.auth.signOut();
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity.",
        duration: 5000,
      });
    }, IDLE_TIMEOUT);
  };

  // Set up activity listeners and periodic token refresh
  useEffect(() => {
    const setupActivityTracking = async () => {
      // Check if we have a session first
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      
      // Set up activity listeners
      const activityEvents = [
        'mousedown', 'mousemove', 'keydown',
        'scroll', 'touchstart', 'click', 'keypress'
      ];
      
      const handleUserActivity = () => {
        resetIdleTimer();
      };
      
      // Add all listeners
      activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });

      // Initial timer setup
      resetIdleTimer();
      
      // Periodic token refresh while active
      const refreshSession = async () => {
        try {
          console.log("Refreshing session token to extend session duration");
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("Error refreshing session:", error);
          }
        } catch (error) {
          console.error("Failed to refresh session:", error);
        }
      };
      
      // Set up periodic refresh
      refreshTimerRef.current = window.setInterval(refreshSession, TOKEN_REFRESH_INTERVAL);
      
      // Initial refresh to ensure token is fresh
      refreshSession();
      
      // Cleanup function
      return () => {
        // Remove activity listeners
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
        
        // Clear all timers
        if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
        if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
      };
    };
    
    setupActivityTracking();
  }, [toast]);
}
