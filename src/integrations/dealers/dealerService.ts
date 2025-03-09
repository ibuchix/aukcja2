
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

export async function signupDealer(values: DealerFormValues) {
  try {
    console.log("Starting dealer signup process with:", { 
      email: values.email, 
      companyName: values.companyName,
      password: "********" // Don't log actual password
    });
    
    // First check if user with this email already exists to provide better error message
    const { data: existingUser, error: checkError } = await supabase
      .rpc('check_email_exists', { email_to_check: values.email.toLowerCase().trim() });
    
    if (checkError) {
      console.error("Error checking if email exists:", checkError);
      // Continue despite this error - the stored procedure will catch duplicates anyway
    } else if (existingUser && (existingUser as CheckEmailExistsResponse).exists) {
      console.log("Email already exists:", values.email.toLowerCase().trim());
      return { 
        success: false, 
        error: "An account with this email already exists. Please use a different email or sign in." 
      };
    }
    
    console.log("Creating dealer account using create_dealer_with_profile RPC function...");
    
    // Format and clean input data
    const formattedPhone = values.phoneNumber ? values.phoneNumber.replace(/\s+/g, '') : '';
    const normalizedEmail = values.email.toLowerCase().trim();
    
    // Use the RPC function to create both the user and dealer profile in a single transaction
    const { data: result, error: rpcError } = await supabase.rpc(
      'create_dealer_with_profile',
      {
        p_email: normalizedEmail,
        p_password: values.password,
        p_supervisor_name: values.supervisorName,
        p_company_name: values.companyName,
        p_tax_id: values.taxId,
        p_business_registry_number: values.businessRegistryNumber,
        p_address: values.companyAddress,
        p_phone_number: formattedPhone
      }
    );
    
    if (rpcError) {
      console.error("Error creating dealer with RPC function:", rpcError);
      return { 
        success: false, 
        error: rpcError.message 
      };
    }
    
    // Parse the JSON result from the RPC function
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (!parsedResult.success) {
      console.error("RPC function returned error:", parsedResult.error);
      return { 
        success: false, 
        error: parsedResult.error || "Failed to create dealer account" 
      };
    }
    
    console.log("Dealer account created successfully:", parsedResult.user?.id);
    
    // Return success with user data
    return { 
      success: true, 
      user: parsedResult.user,
      message: "Registration successful. You can now sign in to your account."
    };
  } catch (error) {
    console.error("Unexpected error during dealer signup:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
