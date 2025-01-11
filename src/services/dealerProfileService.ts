import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation';
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    // Start a transaction by using single batch request
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
        let errorMessage: string;
        
        if (dealerError.message.includes("dealers_tax_id_key")) {
          errorMessage = "This tax ID is already registered";
        } else if (dealerError.message.includes("dealers_business_registry_number_key")) {
          errorMessage = "This business registry number is already registered";
        } else {
          errorMessage = "A dealer profile already exists for this account";
        }
            
        return {
          success: false,
          error: errorMessage,
          errorType: 'database'
        };
      }

      // Attempt to clean up auth user on profile creation failure
      await supabase.auth.signOut();
      
      return {
        success: false,
        error: "Failed to create dealer profile",
        errorType: 'database'
      };
    }

    // Check if profile was actually created
    const { data: createdDealer, error: verifyError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (verifyError || !createdDealer) {
      console.error("Profile verification error:", verifyError);
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Failed to verify dealer profile creation",
        errorType: 'database'
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Profile service error:", error);
    // Attempt to clean up auth user on unexpected errors
    await supabase.auth.signOut();
    
    return {
      success: false,
      error: "Profile service error",
      errorType: 'database'
    };
  }
}