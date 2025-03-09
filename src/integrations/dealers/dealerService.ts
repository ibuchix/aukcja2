
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

// Type for inserting dealer records to match the database schema
type DealerInsert = {
  user_id: string;
  supervisor_name: string;
  dealership_name: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number: string; // Required field
};

// Define the expected return type for the check_email_exists RPC function
type CheckEmailExistsResponse = {
  exists: boolean;
};

// Define the expected return type for the create_dealer_with_profile RPC function
type CreateDealerResponse = {
  success: boolean;
  error?: string;
  error_code?: string;
  operation?: string;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
  };
};

export async function signupDealer(values: DealerFormValues) {
  try {
    console.log("Starting dealer signup process with:", { 
      email: values.email.substring(0, 3) + "...", 
      companyName: values.companyName 
    });
    
    // First check if user with this email already exists to provide better error message
    const { data: existingUser, error: checkError } = await supabase
      .rpc('check_email_exists', { email_to_check: values.email.toLowerCase() });
    
    if (checkError) {
      console.error("Error checking if email exists:", checkError);
      // Continue despite this error - the stored procedure will catch duplicates anyway
    } else if (existingUser && (existingUser as CheckEmailExistsResponse).exists) {
      return { 
        success: false, 
        error: "An account with this email already exists. Please use a different email or sign in." 
      };
    }
    
    console.log("Creating dealer account using stored procedure...");
    
    // Format and clean input data
    const formattedPhone = values.phoneNumber ? values.phoneNumber.replace(/\s+/g, '') : '';
    
    // Use the stored procedure to create the dealer account in a single transaction
    const { data: result, error: procedureError } = await supabase.rpc(
      'create_dealer_with_profile',
      {
        p_email: values.email.toLowerCase(),
        p_password: values.password,
        p_supervisor_name: values.supervisorName,
        p_company_name: values.companyName,
        p_tax_id: values.taxId,
        p_business_registry_number: values.businessRegistryNumber,
        p_address: values.companyAddress,
        p_phone_number: formattedPhone
      }
    );
    
    if (procedureError) {
      console.error("Error from stored procedure:", procedureError);
      
      // Handle specific error messages
      if (procedureError.message.includes("duplicate key") || 
          procedureError.message.includes("already exists")) {
        return { 
          success: false, 
          error: "An account with this email or business details already exists." 
        };
      }
      
      return { success: false, error: procedureError.message };
    }
    
    // Cast result to the expected type to make TypeScript happy
    const typedResult = result as CreateDealerResponse;
    console.log("Procedure result:", typedResult);
    
    // Check if the procedure result indicates success
    if (!typedResult || !typedResult.success) {
      const errorMessage = typedResult?.error || "Failed to create dealer account";
      const errorCode = typedResult?.error_code || "unknown";
      const operation = typedResult?.operation || "unknown";
      
      console.error("Procedure returned error:", { errorMessage, errorCode, operation });
      return { success: false, error: errorMessage };
    }
    
    console.log("Dealer registration completed successfully");
    
    return { 
      success: true, 
      user: typedResult.user,
      message: "Registration successful. Please check your email to verify your account."
    };
  } catch (error) {
    console.error("Unexpected error during dealer signup:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
