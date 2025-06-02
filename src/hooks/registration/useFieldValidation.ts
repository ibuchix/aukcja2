
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

interface ValidationState {
  [fieldName: string]: {
    isValid: boolean;
    isValidating: boolean;
    message?: string;
  };
}

export function useFieldValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const { toast } = useToast();

  const updateFieldState = (fieldName: string, state: Partial<ValidationState[string]>) => {
    setValidationState(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], ...state }
    }));
  };

  const checkEmailAvailability = useCallback(
    debounce(async (email: string) => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        updateFieldState('email', { isValid: false, isValidating: false });
        toast({
          title: "Invalid Email Format",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      updateFieldState('email', { isValidating: true });
      
      try {
        const { data, error } = await supabase.rpc('check_email_exists', {
          email_to_check: email.toLowerCase().trim()
        });

        if (error) {
          console.warn("Email check error:", error);
          updateFieldState('email', { isValid: true, isValidating: false });
          toast({
            title: "Email Check Warning",
            description: "Could not verify email availability, but you can continue",
            variant: "default",
          });
          return;
        }

        const emailExists = data?.exists || data > 0 || data === true;
        
        if (emailExists) {
          updateFieldState('email', { isValid: false, isValidating: false });
          toast({
            title: "Email Already Registered",
            description: "This email is already associated with an account. Please use a different email or sign in.",
            variant: "destructive",
          });
        } else {
          updateFieldState('email', { isValid: true, isValidating: false });
          toast({
            title: "Email Available ✓",
            description: "This email address is available for registration",
          });
        }
      } catch (error) {
        console.error("Email validation error:", error);
        updateFieldState('email', { isValid: true, isValidating: false });
        toast({
          title: "Email Check Error",
          description: "Could not verify email availability, but you can continue",
          variant: "default",
        });
      }
    }, 800),
    [toast]
  );

  const checkBusinessRegistryAvailability = useCallback(
    debounce(async (registryNumber: string) => {
      if (!registryNumber || registryNumber.length < 9) {
        updateFieldState('businessRegistry', { isValid: false, isValidating: false });
        toast({
          title: "Invalid REGON Format",
          description: "REGON number must be at least 9 digits",
          variant: "destructive",
        });
        return;
      }

      updateFieldState('businessRegistry', { isValidating: true });
      
      try {
        const { data, error } = await supabase.rpc('check_business_registry_exists', {
          registry_number: registryNumber
        });

        if (error) {
          console.warn("Registry check error:", error);
          updateFieldState('businessRegistry', { isValid: true, isValidating: false });
          toast({
            title: "Registry Check Warning",
            description: "Could not verify business registry, but you can continue",
            variant: "default",
          });
          return;
        }

        if (!data.valid) {
          updateFieldState('businessRegistry', { isValid: false, isValidating: false });
          toast({
            title: "Invalid REGON Format",
            description: data.error || "REGON number format is invalid",
            variant: "destructive",
          });
          return;
        }

        if (data.exists) {
          updateFieldState('businessRegistry', { isValid: false, isValidating: false });
          toast({
            title: "Business Already Registered",
            description: "A dealer with this REGON number is already registered in our system",
            variant: "destructive",
          });
        } else {
          updateFieldState('businessRegistry', { isValid: true, isValidating: false });
          toast({
            title: "Business Registry Verified ✓",
            description: "REGON number is valid and available",
          });
        }
      } catch (error) {
        console.error("Business registry validation error:", error);
        updateFieldState('businessRegistry', { isValid: true, isValidating: false });
        toast({
          title: "Registry Check Error",
          description: "Could not verify business registry, but you can continue",
          variant: "default",
        });
      }
    }, 800),
    [toast]
  );

  const validateTaxID = useCallback(async (taxId: string) => {
    if (!taxId) {
      toast({
        title: "Tax ID Required",
        description: "Please enter your NIP (Tax ID) number",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('check_tax_id_exists', {
        tax_id: taxId
      });

      if (error) {
        console.warn("Tax ID check error:", error);
        toast({
          title: "Tax ID Check Warning",
          description: "Could not verify Tax ID, but you can continue",
          variant: "default",
        });
        return true;
      }

      if (!data.valid) {
        toast({
          title: "Invalid Tax ID (NIP)",
          description: data.error || "The NIP format or checksum is invalid",
          variant: "destructive",
        });
        return false;
      }

      if (data.exists) {
        toast({
          title: "Tax ID Already Registered",
          description: "A dealer with this NIP is already registered in our system",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Valid Tax ID ✓",
        description: "NIP number is valid and available",
      });
      return true;
    } catch (error) {
      console.error("Tax ID validation error:", error);
      toast({
        title: "Tax ID Check Error",
        description: "Could not verify Tax ID, but you can continue",
        variant: "default",
      });
      return true;
    }
  }, [toast]);

  const validatePhoneField = useCallback(async (phone: string) => {
    if (!phone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('validate_and_normalize_phone', {
        phone_number: phone
      });

      if (error) {
        console.warn("Phone validation error:", error);
        toast({
          title: "Phone Validation Warning",
          description: "Could not validate phone number, but you can continue",
          variant: "default",
        });
        return true;
      }

      if (!data.valid) {
        toast({
          title: "Invalid Phone Number",
          description: data.error || "Please enter a valid phone number with country code",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Phone Number Verified ✓",
        description: `Phone number normalized to: ${data.normalized_phone}`,
      });
      return true;
    } catch (error) {
      console.error("Phone validation error:", error);
      toast({
        title: "Phone Validation Error",
        description: "Could not validate phone number, but you can continue",
        variant: "default",
      });
      return true;
    }
  }, [toast]);

  const validatePassword = (password: string) => {
    const issues = [];
    
    if (password.length < 8) {
      issues.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      issues.push("one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      issues.push("one lowercase letter");
    }
    if (!/\d/.test(password)) {
      issues.push("one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push("one special character");
    }

    if (issues.length > 0) {
      toast({
        title: "Password Requirements Not Met",
        description: `Password needs: ${issues.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Strong Password ✓",
      description: "Password meets all security requirements",
    });
    return true;
  };

  const validateSupervisorName = (name: string) => {
    if (name.length < 2) {
      toast({
        title: "Name Too Short",
        description: "Supervisor name must be at least 2 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[a-zA-Z\s-']+$/.test(name)) {
      toast({
        title: "Invalid Name Format",
        description: "Name can only contain letters, spaces, hyphens, and apostrophes",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Valid Name ✓",
      description: "Supervisor name format is correct",
    });
    return true;
  };

  const validateCompanyName = (companyName: string) => {
    if (companyName.length < 2) {
      toast({
        title: "Company Name Too Short",
        description: "Company name must be at least 2 characters long",
        variant: "destructive",
      });
      return false;
    }

    const words = companyName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      toast({
        title: "Complete Company Name Required",
        description: "Please provide the full company name (at least two words)",
        variant: "destructive",
      });
      return false;
    }

    if (!/^[a-zA-Z0-9\s.,&'-]+$/.test(companyName)) {
      toast({
        title: "Invalid Company Name Format",
        description: "Company name contains invalid characters",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Valid Company Name ✓",
      description: "Company name format is correct",
    });
    return true;
  };

  const validateAddress = (address: string) => {
    if (address.length < 10) {
      toast({
        title: "Address Too Short",
        description: "Please provide a complete address with street number and name",
        variant: "destructive",
      });
      return false;
    }

    if (!/\d+/.test(address)) {
      toast({
        title: "Missing Street Number",
        description: "Address should include a street number",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Valid Address ✓",
      description: "Address format is correct",
    });
    return true;
  };

  return {
    validationState,
    checkEmailAvailability,
    checkBusinessRegistryAvailability,
    validateTaxID,
    validatePassword,
    validateSupervisorName,
    validateCompanyName,
    validateAddress,
    validatePhoneField,
  };
}
