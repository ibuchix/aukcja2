
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

// Refresh queue implementation to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<RefreshResult> | null = null;
let isRefreshing = false;
let lastRefreshTime = 0;
let refreshFailureCount = 0;
const MIN_REFRESH_INTERVAL = 10000; // Minimum 10 seconds between refreshes
const MAX_FAILURES = 3; // Maximum consecutive failures before requiring manual intervention
const AUTH_STORAGE_KEY = 'dealer_auth_token';

export type RefreshResult = {
  success: boolean;
  session: Session | null;
  error?: Error;
  needsReauth?: boolean;
};

/**
 * Centralized function to refresh the authentication token
 * Implements a queueing mechanism to prevent multiple concurrent refreshes
 */
export async function refreshAuthToken(): Promise<RefreshResult> {
  // Circuit breaker pattern - stop retry if we've had too many consecutive failures
  if (refreshFailureCount >= MAX_FAILURES) {
    console.log("Too many refresh failures, manual intervention required");
    return { 
      success: false, 
      session: null, 
      error: new Error("Maximum refresh failures exceeded"),
      needsReauth: true
    };
  }
  
  // Implement refresh queue to prevent multiple simultaneous refreshes
  if (isRefreshing) {
    console.log("Token refresh already in progress, queueing this request");
    return refreshPromise!;
  }
  
  // Prevent excessive refresh calls
  const now = Date.now();
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    console.log("Refresh throttled, last refresh was too recent");
    return { success: false, session: null, error: new Error("Refresh throttled") };
  }
  
  try {
    isRefreshing = true;
    lastRefreshTime = now;
    
    // Create a promise that will be shared with any concurrent callers
    refreshPromise = (async () => {
      try {
        console.log("Starting token refresh");
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("Error refreshing token:", error);
          refreshFailureCount++; // Increment failure counter
          return { 
            success: false, 
            session: null, 
            error,
            needsReauth: error.message.includes("token") || error.message.includes("expired") 
          };
        }
        
        if (!data.session) {
          console.warn("No session returned after refresh");
          refreshFailureCount++; // Increment failure counter
          return { success: false, session: null, needsReauth: true };
        }
        
        console.log("Token refreshed successfully, expires:", 
                  new Date(data.session.expires_at! * 1000).toLocaleString());
        
        refreshFailureCount = 0; // Reset failure counter on success
        return { success: true, session: data.session };
      } catch (err) {
        console.error("Exception during token refresh:", err);
        refreshFailureCount++; // Increment failure counter
        return { 
          success: false, 
          session: null, 
          error: err instanceof Error ? err : new Error(String(err)),
          needsReauth: true 
        };
      }
    })();
    
    return await refreshPromise;
  } finally {
    // Reset state after completion (success or failure)
    setTimeout(() => {
      isRefreshing = false;
      refreshPromise = null;
    }, 100);
  }
}

/**
 * Checks if the current session needs refresh (proactive refresh)
 * @param session Current session object
 * @param thresholdMinutes Minutes before expiry to trigger refresh
 */
export function shouldRefreshSession(session: Session | null, thresholdMinutes = 5): boolean {
  if (!session) return false;
  
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
  if (!expiresAt) return false;
  
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return timeUntilExpiry < thresholdMs;
}

/**
 * Attempts to recover a session when normal refresh fails
 * Uses localStorage data as fallback to attempt recovery
 */
export async function attemptSessionRecovery(): Promise<RefreshResult> {
  console.log("Attempting session recovery");
  
  try {
    // First check if we have a session in localStorage
    const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedSession) {
      console.log("No stored session found for recovery");
      return { success: false, session: null, needsReauth: true };
    }
    
    // Clean up any corrupted storage
    try {
      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession.access_token) {
        console.log("Stored session is invalid, no access token");
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return { success: false, session: null, needsReauth: true };
      }
    } catch (e) {
      console.log("Stored session is corrupted, removing");
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { success: false, session: null, needsReauth: true };
    }
    
    // Attempt to get current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log("Could not recover session, need to reauthenticate");
      return { success: false, session: null, needsReauth: true };
    }
    
    return { success: true, session: data.session };
  } catch (e) {
    console.error("Error during session recovery:", e);
    return { 
      success: false, 
      session: null, 
      error: e instanceof Error ? e : new Error(String(e)),
      needsReauth: true 
    };
  }
}
