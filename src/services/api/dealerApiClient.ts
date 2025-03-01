
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
      
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action,
          ...payload
        }
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
      
      // Handle edge case where error is in data property
      if (data.error) {
        console.error(`Attempt ${attempt} failed with API error:`, data.error);
        lastError = new Error(typeof data.error === 'object' 
          ? (data.error.message || JSON.stringify(data.error)) 
          : data.error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(retryDelay * Math.pow(2, attempt - 1), 5000)));
        }
        continue;
      }

      // Also check for success: false in the data
      if (typeof data.success === 'boolean' && !data.success) {
        console.error(`Attempt ${attempt} failed with success: false:`, data);
        lastError = new Error(data.message || `Failed to execute ${action}`);
        
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

  // Format the error message based on the error type
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
 * Call the database transaction function to create a dealer
 */
export const createDealerWithTransaction = async (
  email: string,
  password: string,
  supervisorName: string,
  companyName: string,
  taxId: string,
  businessRegistryNumber: string,
  companyAddress: string
): Promise<ApiResponse> => {
  console.log("Creating dealer using database transaction function");
  
  try {
    const { data, error } = await supabase.rpc('create_dealer_transaction', {
      p_email: email,
      p_password: password,
      p_supervisor_name: supervisorName,
      p_company_name: companyName,
      p_tax_id: taxId,
      p_business_registry_number: businessRegistryNumber,
      p_company_address: companyAddress
    });

    console.log("Create dealer transaction result:", data, error);

    if (error) {
      console.error("Database transaction failed:", error);
      return {
        success: false,
        error: error.message || "Failed to create dealer account"
      };
    }

    if (!data || (typeof data.success === 'boolean' && !data.success)) {
      const errorMsg = data?.error || "Unknown error occurred during dealer creation";
      console.error("Transaction returned failure:", errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("Unexpected error in dealer transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};
