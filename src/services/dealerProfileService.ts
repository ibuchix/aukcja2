import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation';
}

async function checkBusinessRegistryExists(businessRegistryNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('dealers')
    .select('business_registry_number')
    .eq('business_registry_number', businessRegistryNumber)
    .maybeSingle();
  
  return !!data;
}

async function ensureProfileExists(userId: string): Promise<boolean> {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingProfile) {
    // Create profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'dealer'
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return false;
    }
  }

  return true;
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    // Ensure profile exists first
    const profileCreated = await ensureProfileExists(userId);
    if (!profileCreated) {
      return {
        success: false,
        error: "Failed to create user profile. Please try again.",
        errorType: 'database'
      };
    }

    // Check if business registry number already exists
    const exists = await checkBusinessRegistryExists(values.businessRegistryNumber.trim());
    if (exists) {
      return {
        success: false,
        error: "This business registry number (REGON) is already registered. Please verify your information or contact support.",
        errorType: 'validation'
      };
    }

    // Create dealer profile
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
      
      // Handle specific database errors
      if (dealerError.code === '23505') {
        if (dealerError.message.includes('business_registry_number_unique')) {
          return {
            success: false,
            error: "This business registry number (REGON) is already registered. Please verify your information or contact support.",
            errorType: 'validation'
          };
        }
        if (dealerError.message.includes('tax_id_unique')) {
          return {
            success: false,
            error: "This tax ID (NIP) is already registered. Please verify your information or contact support.",
            errorType: 'validation'
          };
        }
      }
      
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