
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation' | 'network';
  partialSuccess?: boolean;
  warning?: string;
}

async function checkBusinessRegistryExists(businessRegistryNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('dealers')
      .select('business_registry_number')
      .eq('business_registry_number', businessRegistryNumber)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking business registry:", error);
      throw error;
    }
    
    return !!data;
  } catch (error) {
    // Fail silently but log the error
    console.error("Error in business registry check:", error);
    return false; // Continue the flow despite this check failing
  }
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  let retryCount = 0;
  const maxRetries = 3;
  const baseDelay = 1000;

  // Implement retry with exponential backoff
  const executeWithRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        // Don't retry validation errors 
        if (error.message?.includes('already registered') || 
            error.code === '23505') {
          throw error;
        }

        // Don't retry if we've reached the limit
        if (retryCount >= maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying operation in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
      }
    }
  };

  try {
    console.log("Starting dealer profile creation for user:", userId);
    
    // Check for existing business registry number FIRST, with retry
    let exists = false;
    try {
      exists = await executeWithRetry(async () => {
        const result = await checkBusinessRegistryExists(values.businessRegistryNumber.trim());
        return result;
      });
    } catch (error) {
      // If the check fails after retries, log but continue
      console.warn("Business registry check failed after retries, continuing:", error);
    }

    if (exists) {
      console.warn("Attempted to register duplicate business registry number:", values.businessRegistryNumber);
      return {
        success: false,
        error: "This business registry number (REGON) is already registered. Please verify your information or contact support.",
        errorType: 'validation'
      };
    }

    // Verify profile exists, create if missing
    const profileCheckOperation = async () => {
      const response = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      return response;
    };

    const profileCheck = await executeWithRetry(profileCheckOperation);

    // If profile doesn't exist, create it as a fallback mechanism
    if (!profileCheck.data && !profileCheck.error) {
      console.log("Profile not found, creating as fallback for user:", userId);
      
      try {
        await executeWithRetry(async () => {
          const result = await supabase
            .from('profiles')
            .insert({
              id: userId,
              role: 'dealer',
              full_name: values.supervisorName.trim(),
              updated_at: new Date().toISOString()
            });
          return result;
        });
      } catch (error) {
        console.warn("Failed to create profile as fallback, but continuing with dealer creation:", error);
        // Continue despite this error - the dealer profile is more important
      }
    }

    // Insert dealer profile with retry
    const dealerResult = await executeWithRetry(async () => {
      const response = await supabase
        .from('dealers')
        .insert({
          user_id: userId,
          supervisor_name: values.supervisorName.trim(),
          dealership_name: values.companyName.trim(),
          tax_id: values.taxId.trim(),
          business_registry_number: values.businessRegistryNumber.trim(),
          license_number: values.businessRegistryNumber.trim(),
          address: values.companyAddress.trim(),
          verification_status: 'pending',
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      return response;
    });

    if (dealerResult.error) {
      console.error("Dealer profile creation failed after retries:", {
        error: dealerResult.error,
        errorCode: dealerResult.error.code,
        errorMessage: dealerResult.error.message,
        details: dealerResult.error.details
      });
      
      // Handle specific database constraint violations
      if (dealerResult.error.code === '23505') { // Unique violation
        const errorMessage = dealerResult.error.message.toLowerCase();
        if (errorMessage.includes('business_registry_number')) {
          return {
            success: false,
            error: "This business registry number (REGON) is already registered. Please verify your information or contact support.",
            errorType: 'validation'
          };
        }
        if (errorMessage.includes('tax_id')) {
          return {
            success: false,
            error: "This tax ID (NIP) is already registered. Please verify your information or contact support.",
            errorType: 'validation'
          };
        }
        return {
          success: false,
          error: "A unique constraint was violated. Please verify your information.",
          errorType: 'validation'
        };
      }

      // Detect network-related errors
      if (dealerResult.error.message && (
        dealerResult.error.message.toLowerCase().includes('network') ||
        dealerResult.error.message.toLowerCase().includes('connection') ||
        dealerResult.error.message.toLowerCase().includes('timeout') ||
        dealerResult.error.message.toLowerCase().includes('unavailable')
      )) {
        return {
          success: false,
          error: `Network error: ${dealerResult.error.message}`,
          errorType: 'network'
        };
      }

      // Handle other database errors
      return {
        success: false,
        error: `Database error: ${dealerResult.error.message}`,
        errorType: 'database'
      };
    }

    console.log("Dealer profile created successfully for user:", userId);
    return { success: true };
    
  } catch (error) {
    console.error("Unexpected error in profile service:", {
      error,
      userId,
      businessRegistryNumber: values.businessRegistryNumber,
      taxId: values.taxId,
      retryAttempts: retryCount
    });
    
    // Check if error is network-related
    if (error instanceof Error && 
        (error.message.includes('network') || 
         error.message.includes('connection') || 
         error.message.includes('timeout') || 
         error.message.includes('unavailable'))) {
      return {
        success: false,
        error: "A network error occurred while creating your dealer profile. Please check your connection and try again.",
        errorType: 'network'
      };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred while creating your dealer profile. Please try again later.",
      errorType: 'database'
    };
  }
}
