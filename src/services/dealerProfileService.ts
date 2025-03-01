import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface ProfileResult {
  success: boolean;
  error?: string;
  errorType?: 'database' | 'validation' | 'network';
}

async function checkBusinessRegistryExists(businessRegistryNumber: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('dealers')
    .select('business_registry_number')
    .eq('business_registry_number', businessRegistryNumber)
    .maybeSingle();
  
  if (error) {
    console.error("Error checking business registry:", error);
  }
  
  return !!data;
}

export async function createDealerProfile(userId: string, values: DealerFormValues): Promise<ProfileResult> {
  try {
    console.log("Starting dealer profile creation for user:", userId);
    
    // Check for existing business registry number FIRST
    const exists = await checkBusinessRegistryExists(values.businessRegistryNumber.trim());
    if (exists) {
      console.warn("Attempted to register duplicate business registry number:", values.businessRegistryNumber);
      return {
        success: false,
        error: "This business registry number (REGON) is already registered. Please verify your information or contact support.",
        errorType: 'validation'
      };
    }

    // Insert dealer profile directly
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dealerError) {
      console.error("Dealer profile creation failed:", {
        error: dealerError,
        errorCode: dealerError.code,
        errorMessage: dealerError.message,
        details: dealerError.details
      });
      
      // Handle specific database constraint violations
      if (dealerError.code === '23505') { // Unique violation
        const errorMessage = dealerError.message.toLowerCase();
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
      if (dealerError.message && (
        dealerError.message.toLowerCase().includes('network') ||
        dealerError.message.toLowerCase().includes('connection') ||
        dealerError.message.toLowerCase().includes('timeout') ||
        dealerError.message.toLowerCase().includes('unavailable')
      )) {
        return {
          success: false,
          error: `Network error: ${dealerError.message}`,
          errorType: 'network'
        };
      }

      // Handle other database errors
      return {
        success: false,
        error: `Database error: ${dealerError.message}`,
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
      taxId: values.taxId
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
