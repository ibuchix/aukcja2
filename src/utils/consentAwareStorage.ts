import { isCookieAllowed, CookieCategory } from '@/contexts/CookieConsentContext';

/**
 * Consent-aware localStorage wrapper
 * Only stores data if the appropriate cookie category is allowed
 */
export const consentAwareStorage = {
  setItem: (key: string, value: string, category: CookieCategory = 'functional') => {
    if (isCookieAllowed(category)) {
      localStorage.setItem(key, value);
    }
  },
  
  getItem: (key: string, category: CookieCategory = 'functional'): string | null => {
    if (isCookieAllowed(category)) {
      return localStorage.getItem(key);
    }
    return null;
  },
  
  removeItem: (key: string, category: CookieCategory = 'functional') => {
    if (isCookieAllowed(category)) {
      localStorage.removeItem(key);
    }
  },
  
  // Essential storage (always allowed)
  setEssential: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  
  getEssential: (key: string): string | null => {
    return localStorage.getItem(key);
  },
  
  removeEssential: (key: string) => {
    localStorage.removeItem(key);
  }
};

/**
 * Clean up storage based on current consent
 * Call this when consent changes to remove unauthorized data
 */
export const cleanupStorageByConsent = () => {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    // Skip essential items (auth tokens, consent settings)
    if (key.includes('cookie-consent') || 
        key.includes('sb-auth-token') || 
        key.includes('supabase.auth.token') ||
        key.startsWith('sb-')) {
      return;
    }
    
    // Check if functional cookies are allowed for cache and preferences
    if (key.includes('cache') || 
        key.includes('preferences') || 
        key.includes('sidebar') ||
        key.includes('auctionDealer-cache')) {
      if (!isCookieAllowed('functional')) {
        localStorage.removeItem(key);
      }
    }
    
    // Check if analytics cookies are allowed for tracking data
    if (key.includes('analytics') || 
        key.includes('tracking') ||
        key.includes('gtag') ||
        key.includes('_ga')) {
      if (!isCookieAllowed('analytics')) {
        localStorage.removeItem(key);
      }
    }
  });
};