
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseError } from "@/utils/supabaseHelpers";

interface UseCompleteRegistrationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCompleteRegistration(options: UseCompleteRegistrationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const completeRegistration = async (dealershipData: {
    supervisor_name: string;
    dealership_name: string;
    address: string;
    tax_id: string;
    business_registry_number: string;
  }) => {
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        throw new Error("No authenticated user found. Please login first.");
      }
      
      const userId = sessionData.session.user.id;
      
      // Create the dealer profile
      const { error: dealerError } = await supabase.rpc('create_dealer_with_profile', {
        p_email: sessionData.session.user.email,
        p_password: '', // Not used in this function as the user already exists
        p_supervisor_name: dealershipData.supervisor_name,
        p_company_name: dealershipData.dealership_name,
        p_tax_id: dealershipData.tax_id,
        p_business_registry_number: dealershipData.business_registry_number,
        p_address: dealershipData.address
      });
      
      if (dealerError) throw dealerError;
      
      // Show success toast
      toast({
        title: "Registration completed",
        description: "Your dealer profile has been created successfully.",
      });
      
      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("Error completing registration:", error);
      
      const message = isSupabaseError(error) 
        ? error.error.message 
        : 'An unexpected error occurred. Please try again.';
      
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
      
      // Call onError callback if provided
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    completeRegistration,
    isLoading
  };
}
