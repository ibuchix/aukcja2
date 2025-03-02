
// Helper function to safely trim strings (handles null/undefined)
export const safeTrim = (value?: string): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.trim();
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

// Import supabase client
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if an account already exists with the given email
 * using the new edge function approach
 */
export const checkAccountExists = async (email: string): Promise<boolean> => {
  try {
    // Use edge function to check if email exists
    const { data, error } = await supabase.functions.invoke('dealer-auth', {
      body: { 
        action: 'check-email-exists',
        email 
      }
    });
    
    if (error) {
      console.error("Error checking email existence:", error);
      return false;
    }
    
    return data?.exists === true;
  } catch (error) {
    console.error("Error in checkAccountExists:", error);
    return false;
  }
};
