
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { validateCurrentSession, isAuthError } from "./sessionValidation";

interface EnhancedAuthAwareQueryOptions<T> extends Omit<UseQueryOptions<T>, 'enabled'> {
  requireAuth?: boolean;
  enabledWhenReady?: boolean;
  skipSessionValidation?: boolean;
}

/**
 * Enhanced auth-aware query with comprehensive session validation
 */
export function useEnhancedAuthAwareQuery<T>(
  options: EnhancedAuthAwareQueryOptions<T> & {
    queryKey: string[];
    queryFn: () => Promise<T>;
  }
) {
  const { isAuthenticated, isLoading, isInitialized, session } = useAuth();
  const { 
    requireAuth = true, 
    enabledWhenReady = true, 
    skipSessionValidation = false,
    queryFn,
    ...queryOptions 
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  // Enhanced query function with session validation
  const enhancedQueryFn = async (): Promise<T> => {
    // Create abort controller for this query
    abortControllerRef.current = new AbortController();
    
    try {
      // Skip validation if explicitly requested or auth not required
      if (!skipSessionValidation && requireAuth) {
        console.log('🔍 Validating session before query execution');
        const sessionValidation = await validateCurrentSession();
        
        if (!sessionValidation.isValid) {
          const errorMessage = `Session invalid: ${sessionValidation.reason || 'unknown'}`;
          console.warn('❌ Session validation failed:', errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('✅ Session validation passed');
      }

      // Execute the original query function
      const result = await queryFn();
      return result;
    } catch (error) {
      // Check if this is an auth-related error
      if (isAuthError(error)) {
        console.error('🚫 Auth-related error detected:', error);
        
        // Attempt session refresh for auth errors
        try {
          console.log('🔄 Attempting session refresh due to auth error');
          const refreshResult = await validateCurrentSession();
          
          if (!refreshResult.isValid) {
            throw new Error(`Session refresh failed: ${refreshResult.reason}`);
          }
          
          // Retry the query once after successful refresh
          console.log('🔄 Retrying query after session refresh');
          return await queryFn();
        } catch (refreshError) {
          console.error('❌ Session refresh failed:', refreshError);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  };

  // Clean up abort controller on auth state changes
  useEffect(() => {
    if (!isAuthenticated && abortControllerRef.current) {
      console.log('🛑 Aborting query due to auth state change');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isAuthenticated]);

  // Determine if the query should be enabled
  const shouldEnable = 
    isInitialized && // Auth must be initialized
    !isLoading && // Auth must not be loading
    (requireAuth ? (isAuthenticated && session) : true) && // If auth required, user must be authenticated with session
    enabledWhenReady; // Additional user-controlled flag

  return useQuery({
    ...queryOptions,
    queryFn: enhancedQueryFn,
    enabled: shouldEnable,
    // Add retry logic for auth errors
    retry: (failureCount, error) => {
      // Don't retry auth errors more than once
      if (isAuthError(error)) {
        return failureCount < 1;
      }
      // Use default retry logic for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
