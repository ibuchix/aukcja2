
import { supabase } from "@/integrations/supabase/client";

interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

interface UserMetadata {
  name: string;
  companyName?: string;
  phoneNumber?: string;
  companyAddress?: string;
  taxId?: string;
  businessRegistryNumber?: string;
}

export const signUpDealerWithEmail = async (
  email: string,
  password: string,
  metadata: UserMetadata
): Promise<SignUpResult> => {
  try {
    console.log("Starting dealer signup process...");

    // 1. Create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          name: metadata.name,
          role: 'dealer' // Set role in auth metadata
        },
        emailRedirectTo: `${window.location.origin}/dealer/dashboard`
      }
    });

    if (signUpError || !signUpData?.user?.id) {
      console.error("Auth signup error:", signUpError);
      return { 
        success: false, 
        error: signUpError?.message || "Failed to create user account" 
      };
    }

    console.log("Auth user created successfully, creating profile...");

    // 2. Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        id: signUpData.user.id,
        role: 'dealer',
        full_name: metadata.name,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw profileError;
    }

    console.log("Profile created successfully, creating dealer record...");

    // 3. Create dealer record - using correct schema fields
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: signUpData.user.id,
        supervisor_name: metadata.name,
        dealership_name: metadata.companyName || metadata.name,
        address: metadata.companyAddress || '',
        business_registry_number: metadata.businessRegistryNumber || '',
        tax_id: metadata.taxId || '',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        license_number: '', // Required field with empty default
        is_verified: false
      });

    if (dealerError) {
      console.error("Dealer record creation error:", dealerError);
      throw dealerError;
    }

    console.log("Dealer signup completed successfully");
    return {
      success: true,
      userId: signUpData.user.id
    };

  } catch (error) {
    console.error("Unexpected signup error:", error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred during signup"
    };
  }
};
