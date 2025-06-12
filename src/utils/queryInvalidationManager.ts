
import { QueryClient } from "@tanstack/react-query";

class QueryInvalidationManager {
  private queryClient: QueryClient | null = null;

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  /**
   * Invalidate all auth-dependent queries when user signs out
   */
  invalidateAuthQueries() {
    if (!this.queryClient) return;

    console.log('🔄 Invalidating auth-dependent queries');
    
    // Invalidate specific query patterns that require auth
    this.queryClient.invalidateQueries({ queryKey: ['carListings'] });
    this.queryClient.invalidateQueries({ queryKey: ['dealerAuctions'] });
    this.queryClient.invalidateQueries({ queryKey: ['dealerProfile'] });
    this.queryClient.invalidateQueries({ queryKey: ['bids'] });
    
    // Cancel all ongoing queries to prevent race conditions
    this.queryClient.cancelQueries();
  }

  /**
   * Clear all queries when user signs out completely
   */
  clearAllQueries() {
    if (!this.queryClient) return;

    console.log('🗑️ Clearing all queries due to sign out');
    this.queryClient.clear();
  }

  /**
   * Refresh auth-dependent queries when session is refreshed
   */
  refreshAuthQueries() {
    if (!this.queryClient) return;

    console.log('🔄 Refreshing auth-dependent queries after session refresh');
    this.queryClient.invalidateQueries({ queryKey: ['carListings'] });
    this.queryClient.invalidateQueries({ queryKey: ['dealerAuctions'] });
    this.queryClient.invalidateQueries({ queryKey: ['dealerProfile'] });
  }
}

export const queryInvalidationManager = new QueryInvalidationManager();
