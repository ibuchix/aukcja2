
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DealerFormValues } from "@/schemas/dealerFormSchema";

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const completeRegistration = async (formData: DealerFormValues, userId?: string) => {
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Get current user if userId not provided
      let user;
      if (userId) {
        user = { id: userId };
      } else {
        const { data } = await supabase.auth.getUser();
        user = data.user;
      }
      
      if (!user) {
        throw new Error("You must be logged in to complete registration");
      }
      
      // Update user profile in the dealer_profiles table
      const { error: updateError } = await supabase
        .from("dealer_profiles")
        .update({
          company_name: formData.companyName,
          business_registry_number: formData.businessRegistryNumber,
          tax_id: formData.taxId,
          phone: formData.phoneNumber,
          is_profile_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Registration completed",
        description: "Your profile has been updated successfully.",
      });
      
      // Redirect to dashboard
      navigate("/dealer/dashboard");
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete registration";
      setErrors([errorMessage]);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Original handleSubmit function for backward compatibility
  const handleSubmit = async (formData: any) => {
    return completeRegistration(formData);
  };

  // Function to clear auth tokens
  const clearAuthTokens = () => {
    try {
      // Clear Supabase auth data
      supabase.auth.signOut();
      
      // Clear local storage items
      localStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('dealer_auth_token');
      
      // Clear session storage
      sessionStorage.removeItem('sb-sdvakfhmoaoucmhbhwvy-auth-token');
      sessionStorage.removeItem('supabase.auth.token');
      
      return true;
    } catch (error) {
      console.error("Error clearing auth tokens:", error);
      return false;
    }
  };

  return {
    handleSubmit,
    completeRegistration,
    isSubmitting,
    error: errors.length > 0 ? errors[0] : "", // For backward compatibility
    errors,
    clearAuthTokens
  };
}
