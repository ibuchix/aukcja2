
import { useState } from 'react';
import { validateFormData, validateField, normalizeFormData } from '@/utils/validation/formValidation';

type FormType = 'dealer-registration' | 'profile-update' | 'login' | 'vehicle-listing' | 'general';

/**
 * Custom hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>(formType: FormType) {
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  /**
   * Validates the entire form before submission
   */
  const validateForm = (values: T): { isValid: boolean; sanitizedData: T } => {
    const { isValid, errors, sanitizedData } = validateFormData(values, formType);
    setErrors(errors);
    return { isValid, sanitizedData };
  };
  
  /**
   * Validates a single field for real-time feedback
   */
  const validateFormField = (fieldName: string, value: any): boolean => {
    const result = validateField(fieldName, value, formType);
    
    // Update field errors state
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? '' : (result.error || `Invalid ${fieldName}`)
    }));
    
    return result.isValid;
  };
  
  /**
   * Clears all validation errors
   */
  const clearErrors = () => {
    setErrors([]);
    setFieldErrors({});
  };
  
  /**
   * Normalizes the form data for submission
   */
  const normalizeData = (data: T): T => {
    return normalizeFormData(data);
  };
  
  return {
    errors,
    fieldErrors,
    validateForm,
    validateFormField,
    clearErrors,
    normalizeData
  };
}
