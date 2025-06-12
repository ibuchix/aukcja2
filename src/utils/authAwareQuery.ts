
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

interface AuthAwareQueryOptions<T> extends Omit<UseQueryOptions<T>, 'enabled'> {
  requireAuth?: boolean;
  enabledWhenReady?: boolean;
}

/**
 * Hook that wraps useQuery with authentication awareness
 * Only runs queries when auth is ready and user is authenticated (if required)
 */
export function useAuthAwareQuery<T>(
  options: AuthAwareQueryOptions<T> & {
    queryKey: string[];
    queryFn: () => Promise<T>;
  }
) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { requireAuth = true, enabledWhenReady = true, ...queryOptions } = options;

  // Determine if the query should be enabled
  const shouldEnable = 
    isInitialized && // Auth must be initialized
    !isLoading && // Auth must not be loading
    (requireAuth ? isAuthenticated : true) && // If auth required, user must be authenticated
    enabledWhenReady; // Additional user-controlled flag

  return useQuery({
    ...queryOptions,
    enabled: shouldEnable,
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
