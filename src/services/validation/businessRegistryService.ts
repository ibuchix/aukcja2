
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a business registry number already exists in the database
 * @param businessRegistryNumber The business registry number to check
 * @returns True if the business registry number exists, false otherwise
 */
export async function checkBusinessRegistryExists(businessRegistryNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_business_registry_exists', {
      registry_number: businessRegistryNumber
    });
    
    if (error) {
      console.error("Error checking business registry:", error);
      throw error;
    }
    
    // Return true if the registry exists and is valid
    return data?.valid === true && data?.exists === true;
  } catch (error) {
    // Fail silently but log the error
    console.error("Error in business registry check:", error);
    return false; // Continue the flow despite this check failing
  }
}

/**
 * Validates a business registry number format using the new database function
 * @param businessRegistryNumber The business registry number to validate
 * @returns Validation result with details
 */
export async function validateBusinessRegistryNumber(businessRegistryNumber: string) {
  try {
    const { data, error } = await supabase.rpc('check_business_registry_exists', {
      registry_number: businessRegistryNumber
    });
    
    if (error) {
      console.error("Error validating business registry:", error);
      return {
        valid: false,
        error: "Could not validate business registry number"
      };
    }
    
    return data;
  } catch (error) {
    console.error("Error in business registry validation:", error);
    return {
      valid: false,
      error: "Could not validate business registry number"
    };
  }
}
