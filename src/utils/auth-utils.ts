/**
 * Utility functions related to authentication
 */

import { normalizeEmail } from "@/utils/dealerProfileMapping";

/**
 * Prepare password for consistent handling between client and server
 * This function ensures passwords are trimmed and validated 
 */
export function preparePassword(password: string): string {
  // Safety check
  if (typeof password !== 'string') {
    console.error('Non-string password provided to preparePassword');
    return '';
  }
  
  // Trim whitespace
  return password.trim();
}

/**
 * Get diagnostics about current auth state
 */
export function getAuthDiagnostics(): Record<string, unknown> {
  const localStorageKeys = Object.keys(localStorage);
  
  // Find all relevant auth-related keys 
  const authRelatedKeys = localStorageKeys.filter(key => 
    key.includes('auth') || 
    key.includes('supabase') || 
    key.includes('session') || 
    key.includes('token')
  );
  
  // Check if specific token exists (without revealing values)
  const hasLocalToken = !!localStorage.getItem('sb-auth-token');
  const hasLocalDealerToken = !!localStorage.getItem('dealer_auth_token');
  
  return {
    timestamp: new Date().toISOString(),
    authRelatedKeys,
    authKeyCount: authRelatedKeys.length,
    hasLocalToken,
    hasLocalDealerToken,
    browserInfo: navigator.userAgent,
    // Don't include actual tokens for security reasons
  };
}

/**
 * Clear all auth-related storage
 */
export function clearAuthStorage() {
  // Clear specific auth keys
  localStorage.removeItem('sb-auth-token');
  localStorage.removeItem('dealer_auth_token');
  localStorage.removeItem('sb-refresh-token');
  localStorage.removeItem('supabase.auth.token');
  
  // Find and clear any other auth-related keys
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || 
    key.includes('supabase') || 
    key.includes('session') || 
    key.includes('token')
  );
  
  authKeys.forEach(key => {
    console.log(`Clearing auth storage key: ${key}`);
    localStorage.removeItem(key);
  });
  
  console.log("Auth storage cleared");
}

/**
 * Normalize email for consistent handling
 */
export function normalizeEmailForAuth(email: string): string {
  return normalizeEmail(email);
}
