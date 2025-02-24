
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
        email: email.toLowerCase(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw profileError;
    }

    console.log("Profile created successfully, creating dealer record...");

    // 3. Create dealer record
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: signUpData.user.id,
        supervisor_name: metadata.name,
        company_name: metadata.companyName || '',
        phone_number: metadata.phoneNumber || '',
        company_address: metadata.companyAddress || '',
        tax_id: metadata.taxId || '',
        business_registry_number: metadata.businessRegistryNumber || '',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
    // If there was an error after creating the auth user, we should clean up
    // by deleting the auth user to prevent orphaned accounts
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
