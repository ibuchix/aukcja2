
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create a localStorage persister
export const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'auctionDealer-cache',
  throttleTime: 1000, // Only persist to localStorage at most once per second
});

// Function to create a persisted query client provider
export function createPersistQueryClientProvider(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Don't persist sensitive data
            const queryKey = JSON.stringify(query.queryKey);
            return !queryKey.includes('auth') && !queryKey.includes('profile');
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

// Helper function to invalidate cache when needed (e.g., on logout)
export function clearQueryCache(queryClient: QueryClient) {
  // Clear all query cache data
  queryClient.clear();
  
  // Clear persisted data
  localStorage.removeItem('auctionDealer-cache');
}
