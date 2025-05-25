
/**
 * Custom hook for using enhanced Supabase client with automatic data transformation
 */

import { enhancedSupabase } from '@/utils/enhancedSupabaseClient';
import { dataTransformer } from '@/utils/dataTransformer';
import { useCallback } from 'react';

export const useTransformedSupabase = () => {
  const transformAndQuery = useCallback((table: string) => {
    return enhancedSupabase.from(table);
  }, []);

  const transformData = useCallback((data: any, direction: 'toBackend' | 'fromBackend') => {
    return direction === 'toBackend' 
      ? dataTransformer.toSnakeCaseObject(data)
      : dataTransformer.toCamelCaseObject(data);
  }, []);

  return {
    supabase: enhancedSupabase,
    from: transformAndQuery,
    transformData,
    auth: enhancedSupabase.auth,
    storage: enhancedSupabase.storage,
    rpc: enhancedSupabase.rpc.bind(enhancedSupabase)
  };
};
