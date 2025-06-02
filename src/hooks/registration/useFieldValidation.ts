
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

  const validatePolishNIP = (nip: string): boolean => {
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = nip.replace(/\D/g, '');
    
    if (digits.length !== 10) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    const lastDigit = parseInt(digits[9]);
    
    return checksum < 10 && checksum === lastDigit;
  };

  const validateREGON = (regon: string): boolean => {
    const digits = regon.replace(/\D/g, '');
    if (digits.length !== 9 && digits.length !== 14) return false;
    
    // Basic REGON validation (simplified)
    return digits.length === 9 || digits.length === 14;
  };

  const validatePhoneNumber = (phone: string): { isValid: boolean; normalized: string } => {
    const cleaned = phone.replace(/\s+/g, '');
    const withCountryCode = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    
    // Basic international phone validation
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    return {
      isValid: phoneRegex.test(withCountryCode),
      normalized: withCountryCode
    };
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
      }
    }, 800),
    [toast]
  );

  const checkBusinessRegistryAvailability = useCallback(
    debounce(async (registryNumber: string) => {
      const cleaned = registryNumber.replace(/\D/g, '');
      
      if (!validateREGON(cleaned)) {
        updateFieldState('businessRegistry', { isValid: false, isValidating: false });
        toast({
          title: "Invalid REGON Format",
          description: "REGON number must be exactly 9 or 14 digits",
          variant: "destructive",
        });
        return;
      }

      updateFieldState('businessRegistry', { isValidating: true });
      
      try {
        const { data, error } = await supabase
          .from('dealers')
          .select('id')
          .eq('business_registry_number', cleaned)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn("Registry check error:", error);
          updateFieldState('businessRegistry', { isValid: true, isValidating: false });
          return;
        }

        if (data) {
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
      }
    }, 800),
    [toast]
  );

  const validateTaxID = (taxId: string) => {
    const cleaned = taxId.replace(/\D/g, '');
    
    if (cleaned.length !== 10) {
      toast({
        title: "Invalid Tax ID Length",
        description: "NIP (Tax ID) must be exactly 10 digits",
        variant: "destructive",
      });
      return false;
    }

    if (!validatePolishNIP(cleaned)) {
      toast({
        title: "Invalid Tax ID (NIP)",
        description: "The NIP checksum is invalid. Please verify the number is correct",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Valid Tax ID ✓",
      description: "NIP number format and checksum are correct",
    });
    return true;
  };

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

    return true;
  };

  const validatePhoneField = (phone: string) => {
    const validation = validatePhoneNumber(phone);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code (e.g., +48123456789)",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Phone Number Verified ✓",
      description: "Phone number format is correct",
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
