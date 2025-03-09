
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

export async function signupDealer(values: DealerFormValues) {
  try {
    console.log("Starting dealer signup process with:", { 
      email: values.email.substring(0, 3) + "...", 
      companyName: values.companyName 
    });
    
    // Step 1: Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.supervisorName,
          phone: values.phoneNumber,
          role: 'dealer'
        }
      }
    });
    
    if (authError) {
      console.error("Auth error during signup:", authError);
      return { success: false, error: authError.message };
    }
    
    if (!authData.user) {
      console.error("No user returned from signup");
      return { success: false, error: "Failed to create user account" };
    }
    
    console.log("Auth account created successfully, creating dealer profile...");
    
    // Step 2: Create the dealer profile
    const dealerData: DealerInsert = {
      user_id: authData.user.id,
      supervisor_name: values.supervisorName,
      dealership_name: values.companyName, // Changed from dealershipName to companyName
      tax_id: values.taxId,
      business_registry_number: values.businessRegistryNumber,
      address: values.companyAddress, // Changed from address to companyAddress
      verification_status: "pending",
      is_verified: false,
      license_number: values.businessRegistryNumber // Using business registry as license number
    };
    
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert(dealerData);
    
    if (dealerError) {
      console.error("Error creating dealer profile:", dealerError);
      return { success: false, error: dealerError.message };
    }
    
    console.log("Dealer registration completed successfully");
    
    return { 
      success: true, 
      user: authData.user,
      message: "Registration successful. Please check your email to verify your account."
    };
  } catch (error) {
    console.error("Unexpected error during dealer signup:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
