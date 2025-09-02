
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import React from 'react';
import { isCookieAllowed } from '@/contexts/CookieConsentContext';

// Create a consent-aware localStorage persister
export const localStoragePersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      // Allow cache storage only if functional cookies are accepted
      if (isCookieAllowed('functional')) {
        return window.localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      // Allow cache storage only if functional cookies are accepted
      if (isCookieAllowed('functional')) {
        window.localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key);
    }
  },
  key: 'auctionDealer-cache',
  throttleTime: 1000, // Only persist to localStorage at most once per second
});

// Function to create a persisted query client provider
export function createPersistQueryClientProvider(queryClient: QueryClient) {
  const PersistQueryClientProviderComponent = ({ children }: { children: React.ReactNode }) => {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: localStoragePersister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query: any) => {
              // Don't persist sensitive data and respect cookie consent
              const queryKey = JSON.stringify(query.queryKey);
              const hasAuth = queryKey.includes('auth') || queryKey.includes('profile');
              const hasFunctionalConsent = isCookieAllowed('functional');
              
              return !hasAuth && hasFunctionalConsent;
            },
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  };
  
  return PersistQueryClientProviderComponent;
}

// Helper function to invalidate cache when needed (e.g., on logout)
export function clearQueryCache(queryClient: QueryClient) {
  // Clear all query cache data
  queryClient.clear();
  
  // Clear persisted data
  localStorage.removeItem('auctionDealer-cache');
}
