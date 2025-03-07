
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a business registry number already exists in the database
 * @param businessRegistryNumber The business registry number to check
 * @returns True if the business registry number exists, false otherwise
 */
export async function checkBusinessRegistryExists(businessRegistryNumber: string): Promise<boolean> {
  try {
    // Use direct string literals for simplicity and to avoid type recursion
    const response = await supabase
      .from('dealers')
      .select('business_registry_number')
      .eq('business_registry_number', businessRegistryNumber)
      .maybeSingle();
    
    if (response.error) {
      console.error("Error checking business registry:", response.error);
      throw response.error;
    }
    
    return !!response.data;
  } catch (error) {
    // Fail silently but log the error
    console.error("Error in business registry check:", error);
    return false; // Continue the flow despite this check failing
  }
}
