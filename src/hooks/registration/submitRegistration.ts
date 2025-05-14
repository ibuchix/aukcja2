
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { mapFormToDatabase } from "@/utils/dealer-profile-utils/formatters";

export async function submitRegistration(values: DealerFormValues, userId: string) {
  if (!userId) {
    throw new Error("User ID is required to complete registration");
  }

  // Use our mapping function to normalize and transform all data
  const mappedData = mapFormToDatabase(values);

  // Check if dealer profile already exists
  const { data: existingDealer, error: checkError } = await supabase
    .from('dealers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (checkError) {
    console.error("Error checking existing dealer:", checkError);
    throw new Error("Failed to verify dealer status");
  }
  
  let result;
  
  if (existingDealer) {
    // Update existing dealer profile
    console.log("Updating existing dealer profile");
    const { data, error } = await supabase
      .from('dealers')
      .update({
        supervisor_name: mappedData.supervisor_name,
        dealership_name: mappedData.dealership_name,
        tax_id: mappedData.tax_id,
        business_registry_number: mappedData.business_registry_number,
        address: mappedData.address,
        license_number: mappedData.business_registry_number, // Use business registry as license for now
        updated_at: new Date().toISOString() // Convert Date to string
      })
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  } else {
    // Create new dealer profile
    console.log("Creating new dealer profile");
    const { data, error } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        supervisor_name: mappedData.supervisor_name,
        dealership_name: mappedData.dealership_name,
        tax_id: mappedData.tax_id,
        business_registry_number: mappedData.business_registry_number,
        address: mappedData.address,
        license_number: mappedData.business_registry_number, // Use business registry as license for now
        verification_status: 'pending',
        is_verified: false
      })
      .select()
      .single();
      
    if (error) throw error;
    result = data;
  }

  // Also update user metadata with phone number (which is stored in auth.users)
  if (mappedData.phone_number) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { 
        phone_number: mappedData.phone_number
      }
    });
    
    if (metadataError) {
      console.warn("Failed to update phone number in user metadata:", metadataError);
      // Continue despite this error
    }
  }

  return result;
}
