
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { sessionCircuitBreaker } from "@/utils/sessionCircuitBreaker";

// Type definitions for refresh operations
export type RefreshResult = {
  success: boolean;
  session: Session | null;
  error?: Error;
  needsReauth?: boolean;
};

/**
 * Centralized function to refresh the authentication token
 * Uses circuit breaker to prevent cascading failures
 */
export async function refreshAuthToken(): Promise<RefreshResult> {
  console.log("refreshAuthToken: Requested token refresh");
  
  try {
    // Use circuit breaker to control refresh attempts
    return await sessionCircuitBreaker.executeRefresh(async () => {
      console.log("refreshAuthToken: Executing token refresh");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing token:", error);
        return { 
          success: false, 
          session: null, 
          error,
          needsReauth: error.message.includes("token") || error.message.includes("expired") 
        };
      }
      
      if (!data.session) {
        console.warn("No session returned after refresh");
        return { success: false, session: null, needsReauth: true };
      }
      
      console.log("Token refreshed successfully, expires:", 
                new Date(data.session.expires_at! * 1000).toLocaleString());
      
      return { success: true, session: data.session };
    });
  } catch (err) {
    console.error("Exception during token refresh:", err);
    return { 
      success: false, 
      session: null, 
      error: err instanceof Error ? err : new Error(String(err)),
      needsReauth: true 
    };
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
  
  // Check if circuit breaker allows recovery attempts
  const refreshStatus = sessionCircuitBreaker.getStatus();
  if (!refreshStatus.canRefresh) {
    console.log(`Circuit breaker preventing session recovery (state: ${refreshStatus.state})`);
    return { 
      success: false, 
      session: null, 
      error: new Error("Circuit breaker preventing recovery"),
      needsReauth: true 
    };
  }
  
  try {
    // First check if we have a session in localStorage
    const storedSession = localStorage.getItem('dealer_auth_token');
    if (!storedSession) {
      console.log("No stored session found for recovery");
      return { success: false, session: null, needsReauth: true };
    }
    
    // Clean up any corrupted storage
    try {
      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession.access_token) {
        console.log("Stored session is invalid, no access token");
        localStorage.removeItem('dealer_auth_token');
        return { success: false, session: null, needsReauth: true };
      }
    } catch (e) {
      console.log("Stored session is corrupted, removing");
      localStorage.removeItem('dealer_auth_token');
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
