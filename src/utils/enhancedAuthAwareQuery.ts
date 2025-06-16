
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { validateCurrentSession } from "@/utils/sessionValidation";
import { isAuthError } from "@/utils/sessionValidation";

interface EnhancedAuthAwareQueryOptions<T> extends Omit<UseQueryOptions<T>, 'enabled' | 'queryFn'> {
  requireAuth?: boolean;
  enabledWhenReady?: boolean;
  queryFn: () => Promise<T>;
}

/**
 * Enhanced version of useAuthAwareQuery with better session validation
 * and error handling for authentication issues
 */
export function useEnhancedAuthAwareQuery<T>(
  options: EnhancedAuthAwareQueryOptions<T> & {
    queryKey: string[];
  }
) {
  const { isAuthenticated, isLoading, isInitialized, refreshSession } = useAuth();
  const { requireAuth = true, enabledWhenReady = true, queryFn, ...queryOptions } = options;

  const enhancedQueryFn = async (): Promise<T> => {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      console.log('🔍 Validating session before query execution');
    }

    // If auth is required, validate the current session
    if (requireAuth) {
      const validation = await validateCurrentSession();
      
      if (!validation.isValid) {
        if (isDev) {
          console.warn(`❌ Session validation failed: Session invalid: ${validation.reason}`);
        }
        
        // Try to refresh session once before failing
        try {
          await refreshSession();
          
          // Re-validate after refresh
          const revalidation = await validateCurrentSession();
          if (!revalidation.isValid) {
            throw new Error(`Session invalid: ${revalidation.reason}`);
          }
          
          if (isDev) {
            console.log('✅ Session refreshed and validated successfully');
          }
        } catch (refreshError) {
          if (isDev) {
            console.error('❌ Session refresh failed:', refreshError);
          }
          throw new Error(`Session invalid: ${validation.reason}`);
        }
      } else if (isDev) {
        console.log('✅ Session validation successful');
      }
    }

    // Execute the original query function
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
      
      // Check if this is an auth-related error
      if (isAuthError(error)) {
        // Try one session refresh for auth errors
        try {
          await refreshSession();
          if (isDev) {
            console.log('🔄 Retrying query after session refresh');
          }
          return await queryFn();
        } catch (retryError) {
          if (isDev) {
            console.error('❌ Query retry after refresh failed:', retryError);
          }
          throw retryError;
        }
      }
      
      // Re-throw non-auth errors as-is
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
    // Add some retry logic for failed queries
    retry: (failureCount, error) => {
      // Don't retry auth errors after the first attempt
      if (isAuthError(error)) {
        return failureCount < 1;
      }
      // Retry other errors up to 2 times
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
