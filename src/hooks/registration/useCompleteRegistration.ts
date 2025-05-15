
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
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
          phone: formData.phone,
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
      setError(errorMessage);
      
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

  return {
    handleSubmit,
    isSubmitting,
    error
  };
}
