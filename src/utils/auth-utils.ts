
/**
 * Utilities for consistent authentication handling
 */

/**
 * Consistently clean and prepare passwords for authentication
 * Prevents issues with whitespace and other common problems
 * IMPORTANT: This MUST match the logic in the edge function's password-utils.ts
 */
export function preparePassword(password: string): string {
  if (!password) return '';
  // Trim whitespace but preserve internal spaces
  return password.trim();
}

/**
 * Clears all authentication-related storage
 * Used for troubleshooting login issues
 */
export function clearAuthStorage(): void {
  console.log('Clearing all auth storage keys');
  
  // Clear Supabase specific keys
  localStorage.removeItem('dealer_auth_token');
  
  // Additional cleanup for potential session issues
  localStorage.removeItem('user');
  localStorage.removeItem('profile');
}

/**
 * Returns diagnostic information about auth state
 * Useful for troubleshooting login issues
 */
export function getAuthDiagnostics(): Record<string, unknown> {
  try {
    const hasLocalToken = !!localStorage.getItem('dealer_auth_token');
    
    // Try to parse local token for additional diagnostics
    let tokenInfo: string | Record<string, unknown> = "No token data";
    try {
      const tokenStr = localStorage.getItem('dealer_auth_token');
      if (tokenStr) {
        const tokenData = JSON.parse(tokenStr);
        tokenInfo = {
          expiresAt: tokenData.expiresAt,
          tokenType: tokenData.data?.token_type || "none",
          hasAccessToken: !!tokenData.data?.access_token,
          hasRefreshToken: !!tokenData.data?.refresh_token
        };
      }
    } catch(e) {
      tokenInfo = "Error parsing token: " + String(e);
    }
    
    return {
      hasLocalToken,
      tokenInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: String(error),
      timestamp: new Date().toISOString()
    };
  }
}
