
import { QueryClient } from "@tanstack/react-query";
import { queryInvalidationManager } from "./queryInvalidationManager";

// Create a client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes (300000ms)
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 1 hour (3600000ms)
      gcTime: 60 * 60 * 1000,
      
      // Retry failed queries 2 times
      retry: 2,
      
      // Use stale data when fetching in the background
      refetchOnWindowFocus: true,
      
      // Refetch when regaining network connection
      refetchOnReconnect: true,
    },
  },
});

// Register the query client with the invalidation manager
queryInvalidationManager.setQueryClient(queryClient);

// Query key factory to ensure consistent keys throughout the app
export const queryKeys = {
  bids: {
    all: ['bids'] as const,
    status: (carId: string, dealerId: string) => 
      [...queryKeys.bids.all, 'status', carId, dealerId] as const,
    recommendations: (carId: string, dealerId: string) => 
      [...queryKeys.bids.all, 'recommendations', carId, dealerId] as const,
    activity: (carId: string) => 
      [...queryKeys.bids.all, 'activity', carId] as const,
    dealerExposure: (dealerId: string) => 
      [...queryKeys.bids.all, 'exposure', dealerId] as const,
    biddingStrategy: (dealerId: string) => 
      [...queryKeys.bids.all, 'strategy', dealerId] as const,
    dealerBids: (dealerId: string) => 
      [...queryKeys.bids.all, 'dealerBids', dealerId] as const,
  },
  auctions: {
    all: ['auctions'] as const,
    browser: (dealerId: string, filters: string, sortOption: string, searchQuery: string) => 
      [...queryKeys.auctions.all, 'browser', dealerId, filters, sortOption, searchQuery] as const,
  },
  dealers: {
    all: ['dealers'] as const,
    profile: (dealerId: string) => 
      [...queryKeys.dealers.all, 'profile', dealerId] as const,
  },
  wishlist: {
    all: ['wishlist'] as const,
    list: (dealerId: string) => 
      [...queryKeys.wishlist.all, 'list', dealerId] as const,
  },
};
