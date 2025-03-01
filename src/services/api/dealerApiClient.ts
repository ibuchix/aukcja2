import { supabase } from "@/integrations/supabase/client";

interface ApiResponse<T = any> {
  data?: T;
  error?: any;
  success: boolean;
}

interface SupabaseFunctionError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
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
      
      const requestPayload = {
        action,
        ...payload,
        _attempt: attempt
      };
      
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: requestPayload
      });

      console.log(`Function response for ${action}:`, { data, error });

      if (error) {
        const supabaseError = error as SupabaseFunctionError;
        console.error(`Attempt ${attempt} failed:`, {
          code: supabaseError.code,
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint
        });
        lastError = supabaseError;
        
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
      
      if (data.error && typeof data.error === 'string' && 
          (data.error.includes('already in progress') || 
           data.error.includes('concurrent'))) {
        console.warn(`${action} blocked due to concurrent operation:`, data.error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(3, attempt - 1), 10000)));
          continue;
        }
      }

      if (typeof data.success === 'boolean' && !data.success) {
        console.error(`Attempt ${attempt} failed with success: false:`, data);
        lastError = new Error(data.message || `Failed to execute ${action}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }

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

  let errorMessage = `Failed to execute ${action} after multiple attempts`;
  
  if (lastError) {
    if (typeof lastError === 'object') {
      if (lastError.message) {
        errorMessage = lastError.message;
      } else if (lastError.details) {
        errorMessage = lastError.details;
      } else {
        try {
          errorMessage = JSON.stringify(lastError);
        } catch (e) {
          // Keep default error message if JSON stringification fails
        }
      }
    } else if (typeof lastError === 'string') {
      errorMessage = lastError;
    }
  }

  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Creates a dealer profile with proper TypeScript types
 */
export const createDealerProfile = async (
  email: string,
  password: string,
  supervisorName: string,
  dealershipName: string,
  address: string,
  taxId: string,
  businessRegistryNumber: string
) => {
  // Match the parameters expected by the create_dealer_with_profile function
  return await supabase.rpc('create_dealer_with_profile', {
    p_email: email,
    p_password: password,
    p_supervisor_name: supervisorName,
    p_company_name: dealershipName, 
    p_address: address,
    p_tax_id: taxId,
    p_business_registry_number: businessRegistryNumber
  });
};
