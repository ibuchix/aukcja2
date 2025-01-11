import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation';
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    // Create dealer profile without checking for duplicates
    const { error: dealerError } = await supabase
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
      });

    if (dealerError) {
      console.error("Dealer profile creation error:", dealerError);
      return {
        success: false,
        error: "Failed to create dealer profile. Please try again.",
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