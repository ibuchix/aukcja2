/**
 * Custom hook for using enhanced Supabase client with automatic data transformation
 */

import { supabase } from '@/integrations/supabase/client';
import { dataTransformer } from '@/utils/dataTransformer';
import { useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';

export const useTransformedSupabase = () => {
  const transformAndQuery = useCallback((table: string) => {
    return supabase.from(table as any);
  }, []);

  const transformData = useCallback((data: any, direction: 'toBackend' | 'fromBackend') => {
    return direction === 'toBackend' 
      ? dataTransformer.toSnakeCaseObject(data)
      : dataTransformer.toCamelCaseObject(data);
  }, []);

  return {
    supabase: supabase,
    from: transformAndQuery,
    transformData,
    auth: supabase.auth,
    storage: supabase.storage,
    rpc: supabase.rpc.bind(supabase)
  };
};
