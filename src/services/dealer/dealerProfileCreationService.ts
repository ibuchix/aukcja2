
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { executeWithRetry } from "@/utils/retryUtils";
import { checkBusinessRegistryExists } from "@/services/validation/businessRegistryService";
import { 
  ProfileResult, 
  createSuccessResult,
  createValidationErrorResult,
  createNetworkErrorResult,
  createDatabaseErrorResult,
  handleDatabaseError
} from "./dealerProfileResultHandler";

/**
 * Creates a dealer profile in the database
 * @param userId The ID of the user to create the dealer profile for
 * @param values The dealer form values to use for creation
 * @returns A result object indicating success or failure
 */
export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    console.log("Starting dealer profile creation for user:", userId);
    
    // Check for existing business registry number FIRST, with retry
    try {
      const exists = await executeWithRetry(
        () => checkBusinessRegistryExists(values.businessRegistryNumber.trim()),
        {
          shouldRetry: (error) => {
            // Only retry certain types of errors
            return !(error.message?.includes('already registered') || 
                    error.code === '23505');
          }
        }
      );

      if (exists) {
        console.warn("Attempted to register duplicate business registry number:", values.businessRegistryNumber);
        return createValidationErrorResult("This business registry number (REGON) is already registered. Please verify your information or contact support.");
      }
    } catch (error) {
      // If the check fails after retries, log but continue
      console.warn("Business registry check failed after retries, continuing:", error);
    }

    // Verify profile exists, create if missing
    try {
      const profileResponse = await executeWithRetry(() => 
        supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
      );

      // If profile doesn't exist, create it as a fallback mechanism
      if (!profileResponse.data && !profileResponse.error) {
        console.log("Profile not found, creating as fallback for user:", userId);
        
        try {
          const insertResponse = await executeWithRetry(() => 
            supabase
              .from('profiles')
              .insert({
                id: userId,
                role: 'dealer',
                full_name: values.supervisorName.trim(),
                updated_at: new Date().toISOString()
              })
          );
          
          if (insertResponse.error) {
            console.warn("Failed to create profile as fallback:", insertResponse.error);
            // Continue despite this error - the dealer profile is more important
          }
        } catch (error) {
          console.warn("Failed to create profile as fallback, but continuing with dealer creation:", error);
          // Continue despite this error - the dealer profile is more important
        }
      }
    } catch (error) {
      console.warn("Profile check failed, but continuing with dealer creation:", error);
      // Continue anyway as this is just a check
    }

    // Insert dealer profile with retry
    try {
      const dealerResult = await executeWithRetry(() => 
        supabase
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
          })
      );

      if (dealerResult.error) {
        return handleDatabaseError(dealerResult.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('already registered') || 
            (error as any).code === '23505') {
          return createValidationErrorResult("This information is already registered. Please verify your details or contact support.");
        }
        
        // Check for network errors
        if (error.message.includes('network') || 
            error.message.includes('connection') || 
            error.message.includes('timeout') || 
            error.message.includes('unavailable')) {
          return createNetworkErrorResult("A network error occurred while creating your dealer profile. Please check your connection and try again.");
        }
      }
      
      return createDatabaseErrorResult("An unexpected error occurred while creating your dealer profile. Please try again later.");
    }

    console.log("Dealer profile created successfully for user:", userId);
    return createSuccessResult();
    
  } catch (error) {
    console.error("Unexpected error in profile service:", {
      error,
      userId,
      businessRegistryNumber: values.businessRegistryNumber,
      taxId: values.taxId
    });
    
    // Check if error is network-related
    if (error instanceof Error && 
        (error.message.includes('network') || 
         error.message.includes('connection') || 
         error.message.includes('timeout') || 
         error.message.includes('unavailable'))) {
      return createNetworkErrorResult("A network error occurred while creating your dealer profile. Please check your connection and try again.");
    }
    
    return createDatabaseErrorResult("An unexpected error occurred while creating your dealer profile. Please try again later.");
  }
}
