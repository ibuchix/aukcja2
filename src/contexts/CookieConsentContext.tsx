import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CookieCategory = 'essential' | 'functional' | 'analytics';

export interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsent;
  hasConsented: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateConsent: (consent: CookieConsent) => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_STORAGE_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0';

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Always true, can't be disabled
    functional: false,
    analytics: false,
  });
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        
        // Check if consent version matches (for future updates)
        if (parsed.version === CONSENT_VERSION) {
          setConsent({
            essential: true, // Always true
            functional: parsed.functional || false,
            analytics: parsed.analytics || false,
          });
          setHasConsented(true);
          setShowBanner(false);
        } else {
          // Version mismatch, show banner again
          setShowBanner(true);
        }
      } catch (error) {
        console.warn('Failed to parse stored consent:', error);
        setShowBanner(true);
      }
    } else {
      // No stored consent, show banner
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentData = {
      ...newConsent,
      essential: true, // Always true
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    setConsent({ ...newConsent, essential: true });
    setHasConsented(true);
    setShowBanner(false);
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
    });
  };

  const updateConsent = (newConsent: CookieConsent) => {
    saveConsent(newConsent);
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent({
      essential: true,
      functional: false,
      analytics: false,
    });
    setHasConsented(false);
    setShowBanner(true);
  };

  return (
    <CookieConsentContext.Provider value={{
      consent,
      hasConsented,
      showBanner,
      acceptAll,
      rejectNonEssential,
      updateConsent,
      resetConsent,
    }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Utility function to check if a specific cookie category is allowed
export function isCookieAllowed(category: CookieCategory): boolean {
  try {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!storedConsent) return category === 'essential';
    
    const parsed = JSON.parse(storedConsent);
    return parsed[category] === true;
  } catch {
    return category === 'essential';
  }
}