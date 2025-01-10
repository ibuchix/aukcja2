import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { AuthError } from "@supabase/supabase-js";

interface SignupResult {
  success: boolean;
  error?: string;
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanupAuthUser = async (userId: string) => {
    try {
      // Using admin delete user endpoint via edge function would be better,
      // but for now we'll sign out the user
      await supabase.auth.signOut();
      console.log("Cleaned up auth state after failed dealer creation");
    } catch (error) {
      console.error("Error cleaning up auth state:", error);
    }
  };

  const createDealerProfile = async (userId: string, values: DealerFormValues) => {
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        supervisor_name: values.supervisorName,
        dealership_name: values.companyName,
        tax_id: values.taxId,
        business_registry_number: values.businessRegistryNumber,
        license_number: values.businessRegistryNumber,
        address: values.companyAddress,
        verification_status: 'pending',
      });

    if (dealerError) {
      throw dealerError;
    }
  };

  const signupDealer = async (values: DealerFormValues): Promise<SignupResult> => {
    if (isSubmitting) {
      return { success: false, error: "Registration in progress" };
    }
    
    setIsSubmitting(true);
    let authUserId: string | undefined;
    
    try {
      console.log("Starting dealer registration process");
      
      // Step 1: Create auth user with dealer role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName,
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      authUserId = authData.user.id;
      console.log("Auth user created successfully:", authUserId);

      // Step 2: Create dealer profile
      try {
        await createDealerProfile(authUserId, values);
        console.log("Dealer profile created successfully");
        return { success: true };
      } catch (dealerError) {
        console.error("Dealer creation error:", dealerError);
        // If dealer profile creation fails, clean up the auth user
        if (authUserId) {
          await cleanupAuthUser(authUserId);
        }
        throw dealerError;
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      
      if (error instanceof AuthError) {
        if (error.message.includes("already registered")) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}