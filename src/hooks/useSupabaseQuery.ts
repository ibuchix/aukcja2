
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  OperationResult, 
  SupabaseErrorUnion 
} from '@/utils/supabase/errorTypes';
import { 
  wrapSupabaseOperation,
  handleSupabaseError
} from '@/utils/supabase/errorHandler';
import { processAndLogError } from '@/utils/supabase/errorReporting';

interface UseSupabaseQueryOptions<T> {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: SupabaseErrorUnion) => void;
  formatErrorMessage?: (error: SupabaseErrorUnion) => string;
}

export function useSupabaseQuery<T>() {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<SupabaseErrorUnion | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const execute = useCallback(async <R = T>(
    operation: () => Promise<{ data: R | null; error: any }>,
    options: UseSupabaseQueryOptions<R> = {}
  ): Promise<OperationResult<R>> => {
    const {
      showErrorToast = true,
      showSuccessToast = false,
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError,
      formatErrorMessage
    } = options;

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await wrapSupabaseOperation<R>(operation);

      if (result.success && result.data) {
        if (showSuccessToast) {
          toast({
            title: 'Success',
            description: successMessage,
          });
        }
        
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        // Only update state if this is the main query type
        if (typeof result.data === typeof data) {
          setData(result.data as unknown as T);
        }
      } else if (result.error) {
        if (showErrorToast) {
          const errorMessage = formatErrorMessage
            ? formatErrorMessage(result.error)
            : processAndLogError(result.error);
          
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        setError(result.error);
        
        if (onError) {
          onError(result.error);
        }
      }

      setIsLoading(false);
      return result;
    } catch (err) {
      const processedError = handleSupabaseError(err);
      
      if (showErrorToast) {
        const errorMessage = formatErrorMessage
          ? formatErrorMessage(processedError)
          : processAndLogError(processedError);
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      setError(processedError);
      setIsLoading(false);
      
      if (onError) {
        onError(processedError);
      }
      
      return {
        error: processedError,
        success: false
      };
    }
  }, [toast, data]);

  return {
    data,
    error,
    isLoading,
    execute,
  };
}
