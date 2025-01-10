import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

interface SignupResult {
  success: boolean;
  error?: string;
  errorType?: 'auth' | 'database' | 'validation';
}

export function useSignupDealer() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDealerProfile = async (userId: string, values: DealerFormValues) => {
    const { error: dealerError } = await supabase
      .from('dealers')
      .insert({
        user_id: userId,
        supervisor_name: values.supervisorName.trim(),
        dealership_name: values.companyName.trim(),
        tax_id: values.taxId.trim(),
        business_registry_number: values.businessRegistryNumber.trim(),
        address: values.companyAddress.trim(),
        verification_status: 'pending',
        is_verified: false,
      });

    if (dealerError) {
      console.error("Dealer profile creation error:", dealerError);
      throw dealerError;
    }
  };

  const handleAuthError = (error: any): SignupResult => {
    console.error("Auth error details:", error);
    let errorMessage = "Authentication failed";

    if (error.message.includes("already registered")) {
      errorMessage = "This email is already registered. Please try logging in instead.";
    } else if (error.message.includes("invalid email")) {
      errorMessage = "Please enter a valid email address.";
    } else if (error.message.includes("password")) {
      errorMessage = "Password must be at least 8 characters long.";
    }

    return {
      success: false,
      error: errorMessage,
      errorType: 'auth'
    };
  };

  const handleDatabaseError = (error: any): SignupResult => {
    console.error("Database error details:", error);
    let errorMessage = "Failed to create dealer profile";

    if (error.code === '23505') { // Unique violation
      if (error.message.includes("dealers_tax_id_key")) {
        errorMessage = "This tax ID (NIP) is already registered.";
      } else if (error.message.includes("dealers_business_registry_number_key")) {
        errorMessage = "This business registry number (REGON) is already registered.";
      } else if (error.message.includes("dealers_user_id_key")) {
        errorMessage = "A dealer profile already exists for this account.";
      }
    } else if (error.code === '23502') { // Not null violation
      errorMessage = "Please fill in all required fields.";
    }

    return {
      success: false,
      error: errorMessage,
      errorType: 'database'
    };
  };

  const signupDealer = async (values: DealerFormValues): Promise<SignupResult> => {
    if (isSubmitting) {
      return { 
        success: false, 
        error: "Registration in progress",
        errorType: 'validation'
      };
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting dealer registration process");
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            role: 'dealer',
            name: values.supervisorName.trim(),
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return handleAuthError(authError);
      }

      if (!authData.user) {
        return {
          success: false,
          error: "Failed to create user account",
          errorType: 'auth'
        };
      }

      console.log("Auth user created successfully:", authData.user.id);

      try {
        await createDealerProfile(authData.user.id, values);
        console.log("Dealer profile created successfully");
        return { success: true };
      } catch (dealerError) {
        console.error("Dealer creation error:", dealerError);
        await supabase.auth.signOut();
        return handleDatabaseError(dealerError);
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      return {
        success: false,
        error: "An unexpected error occurred",
        errorType: 'validation'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { signupDealer, isSubmitting };
}