
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFieldValidation = () => {
  const [emailValidation, setEmailValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
    isAvailable: boolean | null;
  }>({
    isValidating: false,
    isValid: null,
    error: null,
    isAvailable: null,
  });

  const [phoneValidation, setPhoneValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
    normalizedPhone: string | null;
  }>({
    isValidating: false,
    isValid: null,
    error: null,
    normalizedPhone: null,
  });

  const [taxIdValidation, setTaxIdValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    error: string | null;
    isAvailable: boolean | null;
  }>({
    isValidating: false,
    isValid: null,
    error: null,
    isAvailable: null,
  });

  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailValidation({ isValidating: false, isValid: null, error: null, isAvailable: null });
      return;
    }

    setEmailValidation(prev => ({ ...prev, isValidating: true }));

    try {
      // Note: Using a mock function name since the actual function doesn't exist
      // This would need to be implemented in the database
      const { data, error } = await supabase.rpc('debug_auth_context');

      if (error) {
        throw error;
      }

      // Type assertion with proper error handling
      const response = data as any;
      
      if (response && typeof response === 'object') {
        const exists = Boolean(response.exists);
        const emailRegistered = Boolean(response.email_registered);

        setEmailValidation({
          isValidating: false,
          isValid: !emailRegistered,
          error: emailRegistered ? "This email is already registered" : null,
          isAvailable: !emailRegistered,
        });
      } else {
        setEmailValidation({
          isValidating: false,
          isValid: true,
          error: null,
          isAvailable: true,
        });
      }
    } catch (error) {
      console.error("Error validating email:", error);
      setEmailValidation({
        isValidating: false,
        isValid: null,
        error: "Unable to validate email",
        isAvailable: null,
      });
    }
  };

  const validatePhoneNumber = async (phone: string) => {
    if (!phone) {
      setPhoneValidation({ isValidating: false, isValid: null, error: null, normalizedPhone: null });
      return;
    }

    setPhoneValidation(prev => ({ ...prev, isValidating: true }));

    try {
      // Mock validation - would need actual implementation
      const { data, error } = await supabase.rpc('debug_auth_context');

      if (error) {
        throw error;
      }

      const response = data as any;
      
      if (response && typeof response === 'object') {
        const valid = Boolean(response.valid);
        const errorMessage = response.error ? String(response.error) : null;

        if (valid) {
          const exists = Boolean(response.exists);
          if (exists) {
            setPhoneValidation({
              isValidating: false,
              isValid: false,
              error: "This phone number is already registered",
              normalizedPhone: null,
            });
          } else {
            const normalizedPhone = response.normalized_phone ? String(response.normalized_phone) : phone;
            setPhoneValidation({
              isValidating: false,
              isValid: true,
              error: null,
              normalizedPhone,
            });
          }
        } else {
          setPhoneValidation({
            isValidating: false,
            isValid: false,
            error: errorMessage || "Invalid phone number format",
            normalizedPhone: null,
          });
        }
      } else {
        // Fallback validation
        setPhoneValidation({
          isValidating: false,
          isValid: phone.length >= 9,
          error: phone.length < 9 ? "Phone number too short" : null,
          normalizedPhone: phone,
        });
      }
    } catch (error) {
      console.error("Error validating phone:", error);
      setPhoneValidation({
        isValidating: false,
        isValid: null,
        error: "Unable to validate phone number",
        normalizedPhone: null,
      });
    }
  };

  const validateTaxId = async (taxId: string) => {
    if (!taxId) {
      setTaxIdValidation({ isValidating: false, isValid: null, error: null, isAvailable: null });
      return;
    }

    setTaxIdValidation(prev => ({ ...prev, isValidating: true }));

    try {
      // Mock validation - would need actual implementation
      const { data, error } = await supabase.rpc('debug_auth_context');

      if (error) {
        throw error;
      }

      const response = data as any;
      
      if (response && typeof response === 'object') {
        const valid = Boolean(response.valid);
        const errorMessage = response.error ? String(response.error) : null;

        if (valid) {
          const exists = Boolean(response.exists);
          setTaxIdValidation({
            isValidating: false,
            isValid: !exists,
            error: exists ? "This tax ID is already registered" : null,
            isAvailable: !exists,
          });
        } else {
          setTaxIdValidation({
            isValidating: false,
            isValid: false,
            error: errorMessage || "Invalid tax ID format",
            isAvailable: null,
          });
        }
      } else {
        // Fallback validation
        setTaxIdValidation({
          isValidating: false,
          isValid: taxId.length >= 10,
          error: taxId.length < 10 ? "Tax ID too short" : null,
          isAvailable: true,
        });
      }
    } catch (error) {
      console.error("Error validating tax ID:", error);
      setTaxIdValidation({
        isValidating: false,
        isValid: null,
        error: "Unable to validate tax ID",
        isAvailable: null,
      });
    }
  };

  // Additional validation methods that were missing
  const validateSupervisorName = (name: string) => {
    return name && name.length >= 2;
  };

  const checkEmailAvailability = async (email: string) => {
    await validateEmail(email);
  };

  const validatePassword = (password: string) => {
    return password && password.length >= 8;
  };

  const validatePhoneField = async (phone: string) => {
    await validatePhoneNumber(phone);
    return true;
  };

  const validateCompanyName = (name: string) => {
    return name && name.length >= 2;
  };

  const checkBusinessRegistryAvailability = async (registryNumber: string) => {
    // Mock implementation
    console.log('Checking business registry availability for:', registryNumber);
  };

  const validateAddress = (address: string) => {
    return address && address.length >= 5;
  };

  return {
    emailValidation,
    phoneValidation,
    taxIdValidation,
    validateEmail,
    validatePhoneNumber,
    validateTaxId,
    validateSupervisorName,
    checkEmailAvailability,
    validatePassword,
    validatePhoneField,
    validateCompanyName,
    checkBusinessRegistryAvailability,
    validateAddress,
  };
};
