
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedAuthAwareQueryOptions<T> extends Omit<UseQueryOptions<T>, 'enabled' | 'queryFn'> {
  requireAuth?: boolean;
  enabledWhenReady?: boolean;
  queryFn: () => Promise<T>;
}

/**
 * Enhanced version of useAuthAwareQuery with simplified authentication flow
 * Removes session refresh logic that was causing race conditions
 */
export function useEnhancedAuthAwareQuery<T>(
  options: EnhancedAuthAwareQueryOptions<T> & {
    queryKey: string[];
  }
) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { requireAuth = true, enabledWhenReady = true, queryFn, ...queryOptions } = options;

  const enhancedQueryFn = async (): Promise<T> => {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      console.log('🔍 Executing enhanced auth-aware query');
    }

    // Execute the original query function directly
    // The enhanced client will handle authentication preservation
    try {
      const result = await queryFn();
      if (isDev) {
        console.log('✅ Query executed successfully');
      }
      return result;
    } catch (error) {
      if (isDev) {
        console.error('❌ Query execution failed:', error);
      }
      throw error;
    }
  };

  // Determine if the query should be enabled
  const shouldEnable = 
    isInitialized && // Auth must be initialized
    !isLoading && // Auth must not be loading
    (requireAuth ? isAuthenticated : true) && // If auth required, user must be authenticated
    enabledWhenReady; // Additional user-controlled flag

  return useQuery({
    ...queryOptions,
    queryFn: enhancedQueryFn,
    enabled: shouldEnable,
    // Simplified retry logic
    retry: (failureCount, error) => {
      // Retry up to 2 times for any error
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Utility to check if auth is ready for database operations
 */
export function useAuthReadiness() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  
  return {
    isAuthReady: isInitialized && !isLoading,
    canMakeAuthenticatedQueries: isInitialized && !isLoading && isAuthenticated,
    canMakePublicQueries: isInitialized && !isLoading,
  };
}
