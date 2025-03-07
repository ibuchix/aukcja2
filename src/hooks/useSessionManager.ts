
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Configure how long a session should last without activity before showing a warning
const IDLE_WARNING_TIMEOUT = 60 * 60 * 1000; // 60 minutes (was 25 minutes)
// Configure how long a session should last without activity before ending
const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours (was 30 minutes)
// How often to refresh the token while active
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes (was 10 minutes)

export function useSessionManager() {
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasSetupListenersRef = useRef<boolean>(false);
  const { toast } = useToast();

  const resetIdleTimer = () => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    // Set warning timer (will show warning after 60 min of inactivity)
    warningTimerRef.current = window.setTimeout(() => {
      // Check if we're still in the same session
      const timeIdle = Date.now() - lastActivityRef.current;
      if (timeIdle >= IDLE_WARNING_TIMEOUT) {
        toast({
          title: "Session expiring soon",
          description: "You'll be logged out in 60 minutes due to inactivity. Move your mouse or press a key to stay logged in.",
          duration: 10000,
        });
      }
    }, IDLE_WARNING_TIMEOUT);

    // Set idle timer (will log out after 2 hours of inactivity)
    idleTimerRef.current = window.setTimeout(async () => {
      // Double-check we're really idle before logging out
      const timeIdle = Date.now() - lastActivityRef.current;
      if (timeIdle >= IDLE_TIMEOUT) {
        console.log("Idle timeout reached, logging out");
        await supabase.auth.signOut();
        toast({
          title: "Session expired",
          description: "You have been logged out due to inactivity.",
          duration: 5000,
        });
      }
    }, IDLE_TIMEOUT);
  };

  // Set up activity listeners and periodic token refresh
  useEffect(() => {
    const setupActivityTracking = async () => {
      // Check if we have a session first and haven't already set up listeners
      if (hasSetupListenersRef.current) return;
      
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      
      hasSetupListenersRef.current = true;
      
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
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      // Initial timer setup
      resetIdleTimer();
      
      // Periodic token refresh while active - less frequent to reduce errors
      const refreshSession = async () => {
        try {
          // Only refresh if we've had activity in the last 2 hours
          const timeSinceActivity = Date.now() - lastActivityRef.current;
          if (timeSinceActivity < IDLE_TIMEOUT) {
            console.log("Refreshing session token to extend session duration");
            const { error } = await supabase.auth.refreshSession();
            if (error) {
              console.error("Error refreshing session:", error);
            }
          }
        } catch (error) {
          console.error("Failed to refresh session:", error);
        }
      };
      
      // Set up periodic refresh - use a longer interval
      refreshTimerRef.current = window.setInterval(refreshSession, TOKEN_REFRESH_INTERVAL);
      
      // Initial refresh to ensure token is fresh
      refreshSession();
    };
    
    setupActivityTracking();
    
    // Cleanup function
    return () => {
      if (hasSetupListenersRef.current) {
        const activityEvents = [
          'mousedown', 'mousemove', 'keydown',
          'scroll', 'touchstart', 'click', 'keypress'
        ];
        
        activityEvents.forEach(event => {
          document.removeEventListener(event, resetIdleTimer);
        });
      }
      
      // Clear all timers
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    };
  }, [toast]);
}
