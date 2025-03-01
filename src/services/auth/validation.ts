
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

/**
 * Checks if an account already exists with the given email
 */
export const checkAccountExists = async (email: string): Promise<boolean> => {
  try {
    // First check in auth.users table using the admin listUsers API
    const { data: authData, error: authError } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'check-email-exists',
        email: email
      }
    });

    if (authError) {
      console.error("Error checking if email exists:", authError);
      throw authError;
    }

    return authData?.exists || false;
  } catch (error) {
    console.error("Error in checkAccountExists:", error);
    throw error;
  }
};

// Add import for supabase client at the top
import { supabase } from "@/integrations/supabase/client";
