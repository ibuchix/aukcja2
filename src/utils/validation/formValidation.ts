
import { z } from 'zod';
import { validateEmail, validatePassword, safeTrim } from '@/utils/authValidation';
import { DealerFormValues } from '@/schemas/dealerFormSchema';

/**
 * Validates and sanitizes form data before submission to Supabase
 * @param values The form values to validate
 * @param formType The type of form being validated
 * @returns An object containing validation results
 */
export function validateFormData<T extends Record<string, any>>(
  values: T, 
  formType: 'dealer-registration' | 'profile-update' | 'login' | 'vehicle-listing' | 'general'
): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: T;
} {
  // Initialize return values
  const errors: string[] = [];
  // Create a deep copy to avoid mutating the original object
  const sanitizedData = { ...values } as T;

  // Common validation for all forms
  Object.keys(sanitizedData).forEach(key => {
    // Sanitize strings to prevent XSS and trim whitespace
    if (typeof sanitizedData[key as keyof T] === 'string') {
      sanitizedData[key as keyof T] = safeTrim(sanitizedData[key as keyof T]) as any;
    }
  });

  // Form-specific validation
  switch (formType) {
    case 'dealer-registration':
      return validateDealerRegistration(values as unknown as DealerFormValues) as { isValid: boolean; errors: string[]; sanitizedData: T };
    case 'login':
      return validateLogin(values) as { isValid: boolean; errors: string[]; sanitizedData: T };
    case 'profile-update':
      return validateProfileUpdate(values) as { isValid: boolean; errors: string[]; sanitizedData: T };
    case 'vehicle-listing':
      return validateVehicleListing(values) as { isValid: boolean; errors: string[]; sanitizedData: T };
    default:
      return validateGenericForm(values) as { isValid: boolean; errors: string[]; sanitizedData: T };
  }
}

/**
 * Validates dealer registration form data
 */
function validateDealerRegistration(values: DealerFormValues): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: DealerFormValues;
} {
  const errors: string[] = [];
  const sanitizedData = { ...values };

  // Validate email format
  const emailValidation = validateEmail(sanitizedData.email);
  if (!emailValidation.isValid && emailValidation.error) {
    errors.push(emailValidation.error);
  }

  // If password fields are present, validate them
  if ('password' in sanitizedData) {
    const passwordValidation = validatePassword(sanitizedData.password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      errors.push(passwordValidation.error);
    }

    // Confirm passwords match
    if (sanitizedData.password !== sanitizedData.confirmPassword) {
      errors.push("Passwords do not match");
    }
  }

  // Validate phone number format
  if (!sanitizedData.phoneNumber?.startsWith('+') || sanitizedData.phoneNumber?.length < 8) {
    errors.push("Phone number must include country code and be at least 8 digits");
  }

  // Validate tax ID format (basic check - could be customized per country)
  if (!/^[A-Za-z0-9]{5,}$/.test(sanitizedData.taxId)) {
    errors.push("Tax ID must be at least 5 alphanumeric characters");
  }

  // Validate company name has at least two words
  if (sanitizedData.companyName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.push("Company name should include at least two words");
  }

  // Validate company address has street number and name
  if (!/\d+/.test(sanitizedData.companyAddress) || sanitizedData.companyAddress.length < 10) {
    errors.push("Company address should include street number and be complete");
  }

  // Validate business registry number
  if (!/^\d{9}$|^\d{14}$/.test(sanitizedData.businessRegistryNumber)) {
    errors.push("Business registry number must be exactly 9 or 14 digits");
  }

  // Validate supervisor name format
  if (!/^[a-zA-Z\s-']{2,}$/.test(sanitizedData.supervisorName)) {
    errors.push("Supervisor name must contain at least 2 characters and only include letters, spaces, hyphens, and apostrophes");
  }

  // Ensure terms are accepted
  if (!sanitizedData.acceptTerms) {
    errors.push("You must accept the terms and conditions");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validates login form data
 */
function validateLogin(values: Record<string, any>): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: Record<string, any>;
} {
  const errors: string[] = [];
  const sanitizedData = { ...values };

  // Validate email
  const emailValidation = validateEmail(sanitizedData.email);
  if (!emailValidation.isValid && emailValidation.error) {
    errors.push(emailValidation.error);
  }

  // Validate password presence
  if (!sanitizedData.password || sanitizedData.password.length < 1) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validates profile update form data
 */
function validateProfileUpdate(values: Record<string, any>): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: Record<string, any>;
} {
  const errors: string[] = [];
  const sanitizedData = { ...values };

  // Phone validation if present
  if (sanitizedData.phoneNumber && (!sanitizedData.phoneNumber.startsWith('+') || sanitizedData.phoneNumber.length < 8)) {
    errors.push("Phone number must include country code and be at least 8 digits");
  }

  // Add any other profile-specific validations here

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validates vehicle listing form data
 */
function validateVehicleListing(values: Record<string, any>): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: Record<string, any>;
} {
  const errors: string[] = [];
  const sanitizedData = { ...values };

  // Vehicle-specific validations
  if (sanitizedData.year && (isNaN(Number(sanitizedData.year)) || Number(sanitizedData.year) < 1900 || Number(sanitizedData.year) > new Date().getFullYear() + 1)) {
    errors.push("Please enter a valid year between 1900 and " + (new Date().getFullYear() + 1));
  }

  if (sanitizedData.mileage && (isNaN(Number(sanitizedData.mileage)) || Number(sanitizedData.mileage) < 0)) {
    errors.push("Please enter a valid mileage value");
  }

  if (sanitizedData.price && (isNaN(Number(sanitizedData.price)) || Number(sanitizedData.price) <= 0)) {
    errors.push("Please enter a valid price value greater than zero");
  }

  // Add more vehicle listing validations as needed

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validates generic form data
 */
function validateGenericForm(values: Record<string, any>): { 
  isValid: boolean; 
  errors: string[];
  sanitizedData: Record<string, any>;
} {
  // General-purpose validation for any form
  const errors: string[] = [];
  const sanitizedData = { ...values };

  // Check for empty required fields
  Object.entries(sanitizedData).forEach(([key, value]) => {
    if (key.includes('required') && (value === '' || value === null || value === undefined)) {
      errors.push(`${key.replace('required', '')} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Normalizes form data to ensure consistent format before saving
 */
export function normalizeFormData<T extends Record<string, any>>(data: T): T {
  const normalized = { ...data } as T;
  
  Object.keys(normalized).forEach(key => {
    // Trim all string values
    if (typeof normalized[key as keyof T] === 'string') {
      normalized[key as keyof T] = (normalized[key as keyof T] as string).trim() as any;
      
      // Lowercase email addresses
      if (key === 'email') {
        normalized[key as keyof T] = (normalized[key as keyof T] as string).toLowerCase() as any;
      }
    }
  });
  
  return normalized;
}

/**
 * Checks if a string is a valid email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks if a string is a valid phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\+[0-9\s]{8,}$/.test(phone);
}

/**
 * Validates a form field in real-time for immediate feedback
 */
export function validateField(
  fieldName: string, 
  value: any, 
  formType: 'dealer-registration' | 'profile-update' | 'login' | 'vehicle-listing' | 'general'
): { isValid: boolean; error?: string } {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'password':
      return validatePassword(value);
    case 'phoneNumber':
      return {
        isValid: isValidPhoneNumber(value),
        error: isValidPhoneNumber(value) ? undefined : "Phone number must include country code and be at least 8 digits"
      };
    // Add more field validations as needed
    default:
      return { isValid: true };
  }
}
