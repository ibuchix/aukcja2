import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation';
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    // First check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error checking existing profile:", fetchError);
      return {
        success: false,
        error: "Failed to verify dealer profile",
        errorType: 'database'
      };
    }

    if (existingProfile) {
      return {
        success: false,
        error: "A dealer profile already exists for this account",
        errorType: 'validation'
      };
    }

    // Create the dealer profile with properly formatted data
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        supervisor_name: values.supervisorName.trim(),
        dealership_name: values.companyName.trim(),
        tax_id: values.taxId.trim(),
        business_registry_number: values.businessRegistryNumber.trim(),
        license_number: values.businessRegistryNumber.trim(), // Using business registry as license
        address: values.companyAddress.trim(),
        verification_status: 'pending',
        is_verified: false,
      });

    if (dealerError) {
      console.error("Dealer profile creation error:", dealerError);
      
      if (dealerError.code === '23505') { // Unique violation
        const errorMessage = dealerError.message.includes("dealers_tax_id_key") 
          ? "This tax ID is already registered"
          : dealerError.message.includes("dealers_business_registry_number_key")
            ? "This business registry number is already registered"
            : "A dealer profile already exists for this account";
            
        return {
          success: false,
          error: errorMessage,
          errorType: 'database'
        };
      }

      return {
        success: false,
        error: "Failed to create dealer profile",
        errorType: 'database'
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Profile service error:", error);
    return {
      success: false,
      error: "Profile service error",
      errorType: 'database'
    };
  }
}