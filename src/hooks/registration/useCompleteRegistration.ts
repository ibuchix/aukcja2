
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationResult {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
}

export function useCompleteRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (values: DealerFormValues): Promise<RegistrationResult> => {
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      console.log("Starting dealer registration with complete profile...");
      
      // Validate all required fields
      const missingFields = validateRequiredFields(values);
      if (missingFields.length > 0) {
        const errorMessage = `Please complete the following required fields: ${missingFields.join(", ")}`;
        setErrors([errorMessage]);
        toast({
          title: "Missing information",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }
      
      // Call the registration function via the dealer-auth edge function
      const { data, error } = await supabase.functions.invoke("dealer-auth", {
        body: {
          action: "register",
          email: values.email.trim().toLowerCase(),
          password: values.password,
          metadata: {
            name: values.supervisorName.trim(),
            companyName: values.companyName.trim(),
            taxId: values.taxId.trim(),
            businessRegistryNumber: values.businessRegistryNumber.trim(),
            companyAddress: values.companyAddress.trim(),
            phoneNumber: values.phoneNumber.trim()
          },
          requestId: crypto.randomUUID()
        }
      });

      if (error) {
        console.error("Registration failed:", error);
        const errorMessage = handleRegistrationError(error);
        setErrors([errorMessage]);
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
        
        return { success: false, error: errorMessage };
      }
      
      if (!data?.success) {
        const errorMessage = data?.error || "Registration failed with unknown error";
        console.error("Registration unsuccessful:", errorMessage);
        setErrors([errorMessage]);
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
        });
        
        return { success: false, error: errorMessage };
      }

      // Registration successful
      console.log("Registration successful:", data);
      
      // Show success toast
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please check your email for verification.",
        duration: 6000,
      });
      
      // Return success data
      return { 
        success: true, 
        userId: data.userId,
        message: data.message || "Registration successful"
      };
      
    } catch (error) {
      console.error("Unexpected registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      setErrors([errorMessage]);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred during registration. Please try again later.",
        variant: "destructive",
        duration: 8000,
      });
      
      return { success: false, error: errorMessage };
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    errors
  };
}

// Helper function to validate all required fields
function validateRequiredFields(values: DealerFormValues): string[] {
  const requiredFields: (keyof DealerFormValues)[] = [
    'supervisorName',
    'email',
    'password',
    'confirmPassword',
    'phoneNumber',
    'companyName',
    'taxId',
    'businessRegistryNumber',
    'companyAddress',
    'acceptTerms'
  ];
  
  return requiredFields.filter(field => {
    const value = values[field];
    if (field === 'acceptTerms') return !value; // Boolean field
    return !value || (typeof value === 'string' && value.trim() === '');
  }).map(field => {
    // Convert camelCase to human readable
    return field.replace(/([A-Z])/g, ' $1').toLowerCase();
  });
}

// Helper function to handle registration errors
function handleRegistrationError(error: any): string {
  if (!error) return "Unknown error occurred during registration";
  
  if (typeof error === 'string') {
    if (error.includes('User already registered') || error.includes('already exists')) {
      return "This email is already registered. Please use a different email or login with your existing account.";
    }
    
    if (error.includes('Password')) {
      return "Password issue: " + error;
    }
    
    return error;
  }
  
  if (error.message) {
    if (error.message.includes('email already exists') || error.message.includes('unique_violation')) {
      return "This email is already registered. Please use a different email or login with your existing account.";
    }
    
    if (error.message.includes('Password should be')) {
      return "Password must be at least 8 characters long and meet security requirements.";
    }
    
    if (error.message.includes('invalid email')) {
      return "Please enter a valid email address.";
    }
    
    return error.message;
  }
  
  return "An error occurred during registration. Please try again or contact support.";
}
