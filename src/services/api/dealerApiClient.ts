
import { supabase } from "@/integrations/supabase/client";

interface ApiResponse<T = any> {
  data?: T;
  error?: any;
  success: boolean;
}

/**
 * Invokes a Supabase Edge Function with retry capability
 */
export const invokeDealerFunction = async <T = any>(
  action: string,
  payload: Record<string, any>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<ApiResponse<T>> => {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError: any;

  console.log(`Invoking dealer-auth function with action: ${action}`, payload);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to invoke dealer-auth with action: ${action}`);
      
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action,
          ...payload
        }
      });

      console.log(`Function response for ${action}:`, { data, error });

      if (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }

      if (!data) {
        console.error(`Attempt ${attempt} failed: No data returned`);
        lastError = new Error(`No data returned from ${action}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }
      
      // If the API returned an error message in the data
      if (data.error || (typeof data.success === 'boolean' && !data.success)) {
        console.error(`Attempt ${attempt} failed with API error:`, data);
        lastError = new Error(data.error || `Failed to execute ${action}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }

      // Return the data with proper typing
      return {
        success: true,
        data: data as T
      };

    } catch (error) {
      console.error(`Attempt ${attempt} threw error:`, error);
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || `Failed to execute ${action} after multiple attempts`
  };
};
