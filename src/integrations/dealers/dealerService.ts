
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
    
    console.log("Creating dealer account using Supabase Auth...");
    
    // Format and clean input data
    const formattedPhone = values.phoneNumber ? values.phoneNumber.replace(/\s+/g, '') : '';
    const normalizedEmail = values.email.toLowerCase().trim();
    
    // Use the Supabase auth API directly to create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: values.password,
      options: {
        data: {
          full_name: values.supervisorName,
          role: 'dealer',
          phone_number: formattedPhone
        },
        emailRedirectTo: window.location.origin + '/auth?tab=login'
      }
    });
    
    if (authError) {
      console.error("Error creating user with Supabase Auth:", authError);
      return { 
        success: false, 
        error: authError.message 
      };
    }
    
    if (!authData.user) {
      console.error("User object missing from Supabase Auth response");
      return { 
        success: false, 
        error: "Failed to create user account" 
      };
    }
    
    console.log("Auth user created successfully:", authData.user.id);
    
    // Now create the dealer profile
    try {
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .insert({
          user_id: authData.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.companyName,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          address: values.companyAddress,
          verification_status: 'pending',
          is_verified: false,
          license_number: values.businessRegistryNumber || 'pending'
        })
        .select()
        .single();
      
      if (dealerError) {
        console.error("Error creating dealer profile:", dealerError);
        return { 
          success: false, 
          error: "Account created but dealer profile failed: " + dealerError.message,
          user: authData.user
        };
      }
      
      console.log("Dealer profile created successfully:", dealerData);
      
      // Return success with user data
      return { 
        success: true, 
        user: authData.user,
        profile: dealerData,
        message: "Registration successful. You can now sign in to your account."
      };
    } catch (dealerErr) {
      console.error("Exception creating dealer profile:", dealerErr);
      return { 
        success: false, 
        error: "Account created but dealer profile failed. Please contact support.",
        user: authData.user
      };
    }
  } catch (error) {
    console.error("Unexpected error during dealer signup:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
