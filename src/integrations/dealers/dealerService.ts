
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { DealerInsert } from "@/utils/databaseTypes";

// Function to handle dealer signup
export async function signupDealer(values: DealerFormValues) {
  try {
    // Create a new user with email and password
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.supervisorName,
          phone: values.phoneNumber,
          company_name: values.companyName,
          role: 'dealer',
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      return { success: false, error };
    }

    // Store additional dealer information in the database
    if (data.user) {
      try {
        // Create dealer profile data object
        const dealerData: DealerInsert = {
          user_id: data.user.id,
          supervisor_name: values.supervisorName,
          dealership_name: values.companyName,
          tax_id: values.taxId,
          business_registry_number: values.businessRegistryNumber,
          address: values.companyAddress,
          verification_status: 'pending',
          is_verified: false,
          // Use business registry number as license number for now
          license_number: values.businessRegistryNumber,
        };

        const { error: profileError } = await supabase
          .from('dealers')
          .insert(dealerData);

        if (profileError) {
          console.error("Error creating dealer profile:", profileError);
          return { success: false, error: profileError };
        }
      } catch (profileCreationError) {
        console.error("Exception creating dealer profile:", profileCreationError);
        return { 
          success: false, 
          error: profileCreationError instanceof Error ? profileCreationError : new Error("Unknown error creating profile") 
        };
      }
    }

    return { success: true, data };
  } catch (exception) {
    console.error("Exception during signup:", exception);
    return { 
      success: false, 
      error: exception instanceof Error ? exception : new Error("Unknown exception during signup") 
    };
  }
}
